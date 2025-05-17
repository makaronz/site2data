import os
import sys
import signal
import time
import logging
import json
import networkx as nx
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection
from redis import Redis
from minio import Minio
from dotenv import load_dotenv
from pythonjsonlogger import jsonlogger
import zipfile
import io

# --- Configuration & Logging ---
load_dotenv()

log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
logger = logging.getLogger(__name__)
logger.setLevel(log_level)
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(module)s %(funcName)s %(lineno)d %(message)s')
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.propagate = False # Prevent duplicate logging if root logger is configured

# --- Redis Configuration ---
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
# Stream names and group (must match worker-js)
STREAM_GRAPH_GENERATION = os.getenv('REDIS_STREAM_GRAPH_GENERATION', 'stream_graph_generation')
GROUP_GRAPH_WORKERS = os.getenv('REDIS_GROUP_GRAPH_WORKERS', 'group_graph_workers')
STREAM_PROGRESS_UPDATES = os.getenv('REDIS_STREAM_PROGRESS_UPDATES', 'stream_progress_updates') # For publishing progress
# Consumer ID
CONSUMER_ID = f'worker-py-{os.getpid()}'

# --- MongoDB Configuration ---
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('MONGO_DB_NAME', 'site2data')
JOBS_COLLECTION_NAME = os.getenv('MONGO_JOBS_COLLECTION', 'jobs')
SCENES_COLLECTION_NAME = os.getenv('MONGO_SCENES_COLLECTION', 'scenes')

# --- MinIO Configuration ---
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'scripts')
MINIO_USE_SSL = os.getenv('MINIO_USE_SSL', 'False').lower() == 'true'

# --- Global Variables ---
redis_client: Redis = None
mongo_client: MongoClient = None
minio_client: Minio = None
is_shutting_down = False

# --- Helper Functions ---

def publish_progress(job_id: str, status: str, progress: int, message: str, final_url: str = None):
    if not redis_client:
        logger.error("Redis client not initialized for publishing progress", extra={"job_id": job_id})
        return
    channel = f'progress:{job_id}'
    payload = {
        "jobId": job_id,
        "status": status,
        "progress": progress,
        "message": message,
    }
    if final_url:
        payload['finalResultUrl'] = final_url
    try:
        redis_client.publish(channel, json.dumps(payload))
        logger.debug("Published progress update", extra={"job_id": job_id, "status": status, "progress": progress})
    except Exception as e:
        logger.error("Failed to publish progress update", extra={"job_id": job_id, "channel": channel, "error": str(e)})

def build_relationship_graph(scenes_data: list, job_id_for_logging: str) -> nx.Graph:
    """Builds a NetworkX graph from scene analysis results."""
    G = nx.Graph()
    character_appearances = {}

    logger.debug(f"Building graph from {len(scenes_data)} scenes data entries.", extra={"job_id": job_id_for_logging})

    for scene_idx, scene in enumerate(scenes_data):
        analysis = scene.get('analysisResult')
        scene_identifier = scene.get('sceneId', f'scene_index_{scene_idx}') # Fallback identifier
        if not analysis or not isinstance(analysis, dict):
            logger.warning("Missing or invalid analysisResult for scene", extra={"job_id": job_id_for_logging, "scene_identifier": scene_identifier})
            continue

        characters = analysis.get('characters')
        if not characters or not isinstance(characters, list) or len(characters) < 1:
            logger.debug("No characters found in scene analysis or empty list", extra={"job_id": job_id_for_logging, "scene_identifier": scene_identifier})
            continue

        # Add nodes (characters) with attributes if not already present
        for char_name in characters:
            if not isinstance(char_name, str) or not char_name.strip():
                logger.warning("Invalid character name found (empty or not a string)", extra={"job_id": job_id_for_logging, "scene_identifier": scene_identifier, "character_name": char_name})
                continue
            char = char_name.strip()
            if char not in G:
                G.add_node(char, label=char) # Add label for GEXF
            # Track appearances
            character_appearances[char] = character_appearances.get(char, 0) + 1

        # Add edges (co-occurrence in a scene implies relationship)
        # Create edges between all pairs of characters in the current scene
        valid_characters_in_scene = [c.strip() for c in characters if isinstance(c, str) and c.strip()]
        for i in range(len(valid_characters_in_scene)):
            for j in range(i + 1, len(valid_characters_in_scene)):
                char1 = valid_characters_in_scene[i]
                char2 = valid_characters_in_scene[j]
                if G.has_edge(char1, char2):
                    # Increment weight for existing edge
                    G[char1][char2]['weight'] += 1
                else:
                    # Add new edge with weight 1
                    G.add_edge(char1, char2, weight=1)

    # Optional: Adjust node size based on appearances
    for node, appearances in character_appearances.items():
        if node in G:
            G.nodes[node]['size'] = appearances # Example: size proportional to appearances

    logger.info(f"Built graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.", extra={"job_id": job_id_for_logging})
    return G

# --- Main Job Processing Logic ---

def process_graph_job(message_id: str, message_data: dict):
    job_id = message_data.get('jobId')
    if not job_id:
        logger.error("Invalid message received, missing jobId", extra={"message_id": message_id, "data": message_data})
        # Acknowledge to prevent reprocessing
        if redis_client:
             redis_client.xack(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, message_id)
        return

    # Create a logger adapter for this job_id
    job_extra = {'job_id': job_id}
    # job_logger = logging.LoggerAdapter(logger, job_extra) # Not needed if using extra in calls

    logger.info("Processing graph generation job...", extra=job_extra)

    try:
        # 1. Update status and publish progress
        jobs_coll = mongo_client[DB_NAME][JOBS_COLLECTION_NAME]
        scenes_coll = mongo_client[DB_NAME][SCENES_COLLECTION_NAME]
        
        update_result = jobs_coll.update_one({"jobId": job_id}, {"$set": {"status": "GENERATING_GRAPH", "updatedAt": time.time()}})
        if update_result.matched_count == 0:
            logger.warning("JobId not found in DB for status update to GENERATING_GRAPH. Proceeding, but this is unusual.", extra=job_extra)
        publish_progress(job_id, 'GENERATING_GRAPH', 10, "Pobieranie danych scen...")

        # 2. Fetch all analyzed scenes for the job
        scenes_cursor = scenes_coll.find({"jobId": job_id, "status": "INDEXED"})
        scenes_data = list(scenes_cursor)
        if not scenes_data:
            logger.error("No scenes with status 'INDEXED' found for graph generation.", extra=job_extra)
            raise ValueError("No scenes with status 'INDEXED' found for graph generation")
        logger.info(f"Fetched {len(scenes_data)} scenes from MongoDB.", extra=job_extra)
        publish_progress(job_id, 'GENERATING_GRAPH', 30, "Budowanie grafu relacji...")

        # 3. Build the graph
        graph = build_relationship_graph(scenes_data, job_id)
        publish_progress(job_id, 'GENERATING_GRAPH', 60, "Generowanie pliku GEXF...")

        # 4. Generate GEXF content in memory
        gexf_buffer = io.BytesIO()
        nx.write_gexf(graph, gexf_buffer, encoding='utf-8', version='1.2draft')
        gexf_buffer.seek(0) # Reset buffer position to the beginning
        gexf_content = gexf_buffer.read()
        logger.info(f"Generated GEXF content ({len(gexf_content)} bytes).", extra=job_extra)
        publish_progress(job_id, 'GENERATING_GRAPH', 80, "Tworzenie archiwum ZIP...")

        # 5. Create ZIP archive in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr('network.gexf', gexf_content)
            # Optionally add the full JSON analysis data
            # zipf.writestr('analysis.json', json.dumps(scenes_data, default=str)) # Use default=str for non-serializable data like ObjectId
        zip_buffer.seek(0)
        zip_content = zip_buffer.read()
        zip_size = len(zip_content)
        logger.info(f"Created ZIP archive ({zip_size} bytes).", extra=job_extra)

        # 6. Upload ZIP to MinIO
        zip_object_key = f"results/{job_id}/analysis_results.zip"
        minio_client.put_object(
            MINIO_BUCKET,
            zip_object_key,
            io.BytesIO(zip_content), # Pass content as stream
            zip_size,
            content_type='application/zip'
        )
        # Construct the final URL (assuming MinIO is accessible)
        # This might need adjustment based on actual deployment (e.g., using presigned GET URL from API)
        final_url_scheme = 'https' if MINIO_USE_SSL else 'http'
        final_url = f"{final_url_scheme}://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{zip_object_key}" # Basic URL
        logger.info(f"Uploaded results ZIP to MinIO: {final_url}", extra=job_extra)

        # 7. Update final job status in MongoDB
        jobs_coll.update_one(
            {"jobId": job_id},
            {"$set": {"status": "COMPLETED", "finalResultUrl": final_url, "updatedAt": time.time()}}
        )
        publish_progress(job_id, 'COMPLETED', 100, "Analiza zakończona.", final_url=final_url)
        logger.info("Job completed successfully.", extra=job_extra)

        # 8. Acknowledge message
        redis_client.xack(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, message_id)
        logger.info(f"Acknowledged message {message_id}", extra=job_extra)

    except ValueError as ve:
        logger.error(f"ValueError during job processing: {str(ve)}", extra=job_extra)
        # Update job to FAILED, then re-raise or handle as a specific failure type
        try:
            jobs_coll = mongo_client[DB_NAME][JOBS_COLLECTION_NAME]
            jobs_coll.update_one({"jobId": job_id}, {"$set": {"status": "FAILED", "errorMessage": f"Graph generation failed: {str(ve)}", "updatedAt": time.time()}})
            publish_progress(job_id, 'FAILED', 0, f"Błąd generowania grafu: {str(ve)}")
            if redis_client: # Ensure client exists before acking
                redis_client.xack(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, message_id)
            logger.warn(f"Acknowledged failed message {message_id} due to ValueError.", extra=job_extra)
        except Exception as ack_err:
            logger.error(f"Failed to update status/ack failed job after ValueError: {str(ack_err)}", extra=job_extra)
    except Exception as e:
        logger.error(f"Failed to process graph generation job: {str(e)}", exc_info=True, extra=job_extra) # exc_info=True for stack trace
        try:
            jobs_coll = mongo_client[DB_NAME][JOBS_COLLECTION_NAME]
            jobs_coll.update_one({"jobId": job_id}, {"$set": {"status": "FAILED", "errorMessage": f"Graph generation failed: {str(e)}", "updatedAt": time.time()}})
            publish_progress(job_id, 'FAILED', 0, f"Błąd generowania grafu: {str(e)}")
            if redis_client: # Ensure client exists before acking
                 redis_client.xack(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, message_id)
            logger.warn(f"Acknowledged failed message {message_id}", extra=job_extra)
        except Exception as ack_err:
            logger.error(f"Failed to update status/ack failed job: {str(ack_err)}", exc_info=True, extra=job_extra)

# --- Initialization and Worker Loop ---

def initialize_clients():
    global redis_client, mongo_client, minio_client
    logger.info("Initializing clients...")
    try:
        # Redis
        redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        redis_client.ping() # Test connection
        logger.info("Redis client connected.")
        # Ensure stream and group exist (important for worker startup)
        try:
            # Attempt to create the group. MKSTREAM will create the stream if it doesn't exist.
            redis_client.xgroup_create(name=STREAM_GRAPH_GENERATION, groupname=GROUP_GRAPH_WORKERS, id='0', mkstream=True)
            logger.info(f"Ensured consumer group '{GROUP_GRAPH_WORKERS}' for stream '{STREAM_GRAPH_GENERATION}'. Stream created if not existent.")
        except Exception as redis_err:
            if "BUSYGROUP" in str(redis_err):
                logger.info(f"Consumer group '{GROUP_GRAPH_WORKERS}' already exists for stream '{STREAM_GRAPH_GENERATION}'.")
            else:
                logger.error(f"Failed to create/verify consumer group for stream '{STREAM_GRAPH_GENERATION}': {str(redis_err)}")
                raise redis_err # Re-raise other errors

        # MongoDB
        mongo_client = MongoClient(MONGO_URI)
        mongo_client.admin.command('ping') # Test connection
        logger.info("MongoDB client connected.")
        # Ensure indexes (optional, can be done elsewhere, but good for worker to ensure its needs)
        # mongo_client[DB_NAME][JOBS_COLLECTION_NAME].create_index("jobId", unique=True)
        # mongo_client[DB_NAME][SCENES_COLLECTION_NAME].create_index([("jobId", 1)])
        # logger.info("MongoDB indexes ensured (if uncommented).")

        # MinIO
        minio_target_endpoint = os.getenv('MINIO_ENDPOINT', 'localhost:9000') # MINIO_ENDPOINT from env
        # Ensure port 9000 is used if MINIO_ENDPOINT is just 'minio' and secure is False
        if ':' not in minio_target_endpoint and not MINIO_USE_SSL:
            minio_target_endpoint = f"{minio_target_endpoint}:9000"
        elif ':' not in minio_target_endpoint and MINIO_USE_SSL:
            # Default HTTPS port is 443, Minio client handles this if secure=True and no port
            pass # Let Minio client use default 443 for https if no port

        logger.info(f"Attempting to connect to MinIO at: {minio_target_endpoint}, secure: {MINIO_USE_SSL}") # Log endpoint

        minio_client = Minio(
            minio_target_endpoint,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_USE_SSL
        )
        # Ensure bucket exists
        found = minio_client.bucket_exists(MINIO_BUCKET)
        if not found:
            minio_client.make_bucket(MINIO_BUCKET)
            logger.info(f"Created MinIO bucket '{MINIO_BUCKET}'")
        else:
            logger.info(f"MinIO bucket '{MINIO_BUCKET}' already exists.")

        logger.info("All clients initialized successfully.")
        return True
    except Exception as e:
        logger.critical(f"Failed to initialize clients during startup: {str(e)}", exc_info=True)
        return False

def worker_loop():
    logger.info(f"Worker started. Consumer ID: {CONSUMER_ID}. Waiting for jobs in stream {STREAM_GRAPH_GENERATION}...")
    while not is_shutting_down:
        try:
            # Read from stream, block for 5 seconds
            response = redis_client.xreadgroup(
                groupname=GROUP_GRAPH_WORKERS, 
                consumername=CONSUMER_ID,
                streams={STREAM_GRAPH_GENERATION: '>'}, # Read new messages for this consumer
                count=1,
                block=5000 # 5 seconds
            )

            if response:
                # response format: [[stream_name, [[message_id, {key: val, ...}]]]]
                stream_name, messages = response[0]
                message_id, message_data_raw = messages[0] # message_data is dict of bytes
                # Assuming message_data needs to be decoded if not already by redis-py
                # decode_responses=True in Redis.from_url should handle this.
                message_data = message_data_raw # If decode_responses=True, it's already a dict of strings
                logger.info("Received new message", extra={"message_id": message_id, "stream": stream_name})
                process_graph_job(message_id, message_data)
            else:
                # Timeout, no new messages
                logger.debug("No new messages, looping...")
                pass

        except Exception as e:
            logger.error(f"Error in worker loop: {str(e)}", exc_info=True)
            # Avoid busy-looping on persistent errors
            time.sleep(5)

    logger.info("Exiting worker loop.")

def shutdown_handler(signum, frame):
    global is_shutting_down
    if not is_shutting_down:
        logger.info(f"Received signal {signum}. Initiating graceful shutdown...")
        is_shutting_down = True
    else:
        logger.warning("Shutdown already in progress.")

if __name__ == "__main__":
    clients_initialized_successfully = initialize_clients() # Store result
    if not clients_initialized_successfully:
        logger.critical("Client initialization failed. Exiting worker-py now as per defined logic.") # More specific exit log
        sys.exit(1) # Ensure exit

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)
    logger.info("Worker-py started. Waiting for jobs...")
    logger.info("Attempting to start worker_loop...")
    worker_loop()
    logger.info("worker_loop has finished.")
    logger.info("Worker-py shut down gracefully.")

    # Cleanup after loop exits
    logger.info("Cleaning up resources...")
    if redis_client:
        try:
            redis_client.close()
            logger.info("Redis connection closed.")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {str(e)}")
    if mongo_client:
        try:
            mongo_client.close()
            logger.info("MongoDB connection closed.")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {str(e)}")

    logger.info("Worker shutdown complete.")
    sys.exit(0) 