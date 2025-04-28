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
from minio.error import S3Error
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
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.propagate = False # Prevent duplicate logging if root logger is configured

# --- Redis Configuration ---
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
# Stream names and group (must match worker-js)
STREAM_GRAPH_GENERATION = 'stream_graph_generation'
GROUP_GRAPH_WORKERS = 'group_graph_workers'
STREAM_PROGRESS_UPDATES = 'stream_progress_updates' # For publishing progress
# Consumer ID
CONSUMER_ID = f'worker-py-{os.getpid()}'

# --- MongoDB Configuration ---
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = 'site2data'
JOBS_COLLECTION = 'jobs'
SCENES_COLLECTION = 'scenes'

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
        logger.error({"job_id": job_id}, "Redis client not initialized for publishing progress")
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
        logger.debug({"job_id": job_id, "status": status, "progress": progress}, "Published progress update")
    except Exception as e:
        logger.error({"job_id": job_id, "channel": channel, "error": str(e)}, "Failed to publish progress update")

def build_relationship_graph(scenes_data: list) -> nx.Graph:
    """Builds a NetworkX graph from scene analysis results."""
    G = nx.Graph()
    character_appearances = {}

    logger.debug(f"Building graph from {len(scenes_data)} scenes data entries.")

    for scene in scenes_data:
        analysis = scene.get('analysisResult')
        if not analysis or not isinstance(analysis, dict):
            logger.warning({"scene_id": scene.get('sceneId')}, "Missing or invalid analysisResult for scene")
            continue

        characters = analysis.get('characters')
        if not characters or not isinstance(characters, list) or len(characters) < 1:
            continue

        # Add nodes (characters) with attributes if not already present
        for char in characters:
            if char not in G:
                G.add_node(char, label=char) # Add label for GEXF
            # Track appearances
            character_appearances[char] = character_appearances.get(char, 0) + 1

        # Add edges (co-occurrence in a scene implies relationship)
        # Create edges between all pairs of characters in the current scene
        for i in range(len(characters)):
            for j in range(i + 1, len(characters)):
                char1 = characters[i]
                char2 = characters[j]
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

    logger.info(f"Built graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")
    return G

# --- Main Job Processing Logic ---

def process_graph_job(message_id: str, message_data: dict):
    job_id = message_data.get('jobId')
    if not job_id:
        logger.error({"message_id": message_id, "data": message_data}, "Invalid message received, missing jobId")
        # Acknowledge to prevent reprocessing
        redis_client.xack(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, message_id)
        return

    job_logger = logger.getChild('job').getChild(job_id)
    job_logger.info("Processing graph generation job...")

    try:
        # 1. Update status and publish progress
        jobs_coll = mongo_client[DB_NAME][JOBS_COLLECTION]
        scenes_coll = mongo_client[DB_NAME][SCENES_COLLECTION]
        jobs_coll.update_one({"jobId": job_id}, {"$set": {"status": "GENERATING_GRAPH", "updatedAt": time.time()}})
        publish_progress(job_id, 'GENERATING_GRAPH', 10, "Pobieranie danych scen...")

        # 2. Fetch all analyzed scenes for the job
        scenes_cursor = scenes_coll.find({"jobId": job_id, "status": "ANALYZED"})
        scenes_data = list(scenes_cursor)
        if not scenes_data:
            raise ValueError("No analyzed scenes found for graph generation")
        job_logger.info(f"Fetched {len(scenes_data)} analyzed scenes from MongoDB.")
        publish_progress(job_id, 'GENERATING_GRAPH', 30, "Budowanie grafu relacji...")

        # 3. Build the graph
        graph = build_relationship_graph(scenes_data)
        publish_progress(job_id, 'GENERATING_GRAPH', 60, "Generowanie pliku GEXF...")

        # 4. Generate GEXF content in memory
        gexf_buffer = io.BytesIO()
        nx.write_gexf(graph, gexf_buffer, encoding='utf-8', version='1.2draft')
        gexf_buffer.seek(0) # Reset buffer position to the beginning
        gexf_content = gexf_buffer.read()
        job_logger.info(f"Generated GEXF content ({len(gexf_content)} bytes).")
        publish_progress(job_id, 'GENERATING_GRAPH', 80, "Tworzenie archiwum ZIP...")

        # 5. Create ZIP archive in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr('network.gexf', gexf_content)
            # Optionally add the full JSON analysis data
            # zipf.writestr('analysis.json', json.dumps(scenes_data, indent=2))
        zip_buffer.seek(0)
        zip_content = zip_buffer.read()
        zip_size = len(zip_content)
        job_logger.info(f"Created ZIP archive ({zip_size} bytes).")

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
        # This might need adjustment based on actual deployment (e.g., using presigned GET URL)
        final_url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{zip_object_key}" # Basic URL
        job_logger.info(f"Uploaded results ZIP to MinIO: {final_url}")

        # 7. Update final job status in MongoDB
        jobs_coll.update_one(
            {"jobId": job_id},
            {"$set": {"status": "COMPLETED", "finalResultUrl": final_url, "updatedAt": time.time()}}
        )
        publish_progress(job_id, 'COMPLETED', 100, "Analiza zakończona.", final_url=final_url)
        job_logger.info("Job completed successfully.")

        # 8. Acknowledge message
        redis_client.xack(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, message_id)
        job_logger.info(f"Acknowledged message {message_id}")

    except Exception as e:
        job_logger.error({"error": str(e), "message_id": message_id}, "Failed to process graph generation job")
        try:
            jobs_coll = mongo_client[DB_NAME][JOBS_COLLECTION]
            jobs_coll.update_one({"jobId": job_id}, {"$set": {"status": "FAILED", "errorMessage": f"Graph generation failed: {str(e)}", "updatedAt": time.time()}})
            publish_progress(job_id, 'FAILED', 0, f"Błąd generowania grafu: {str(e)}")
            redis_client.xack(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, message_id)
            job_logger.warn(f"Acknowledged failed message {message_id}")
        except Exception as ack_err:
            job_logger.error({"error": str(ack_err), "original_error": str(e)}, "Failed to update status/ack failed job")

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
            redis_client.xgroup_create(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, id='0', mkstream=True)
            logger.info(f"Created consumer group '{GROUP_GRAPH_WORKERS}' for stream '{STREAM_GRAPH_GENERATION}'.")
        except Exception as redis_err:
            if "BUSYGROUP" in str(redis_err):
                logger.info(f"Consumer group '{GROUP_GRAPH_WORKERS}' already exists.")
            else:
                raise redis_err # Re-raise other errors

        # MongoDB
        mongo_client = MongoClient(MONGO_URI)
        mongo_client.admin.command('ping') # Test connection
        logger.info("MongoDB client connected.")
        # Ensure indexes (optional, can be done elsewhere)
        # mongo_client[DB_NAME][JOBS_COLLECTION].create_index("jobId", unique=True)
        # mongo_client[DB_NAME][SCENES_COLLECTION].create_index([("jobId", 1)])

        # MinIO
        minio_client = Minio(
            MINIO_ENDPOINT,
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
        logger.critical({"error": str(e)}, "Failed to initialize clients during startup")
        return False

def worker_loop():
    logger.info(f"Worker started. Consumer ID: {CONSUMER_ID}. Waiting for jobs in stream {STREAM_GRAPH_GENERATION}...")
    while not is_shutting_down:
        try:
            # Read from stream, block for 5 seconds
            response = redis_client.xreadgroup(
                GROUP_GRAPH_WORKERS, CONSUMER_ID,
                {STREAM_GRAPH_GENERATION: '>'}, # Read new messages for this consumer
                count=1,
                block=5000 # 5 seconds
            )

            if response:
                # response format: [[stream_name, [[message_id, {key: val, ...}]]]]
                stream_name, messages = response[0]
                message_id, message_data = messages[0]
                logger.info({"message_id": message_id, "stream": stream_name}, "Received new message")
                process_graph_job(message_id, message_data)
            else:
                # Timeout, no new messages
                logger.debug("No new messages, looping...")
                pass

        except Exception as e:
            logger.error({"error": str(e)}, "Error in worker loop")
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
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    if initialize_clients():
        worker_loop()
    else:
        sys.exit(1)

    # Cleanup after loop exits
    logger.info("Cleaning up resources...")
    if redis_client:
        try:
            redis_client.close()
            logger.info("Redis connection closed.")
        except Exception as e:
            logger.error({"error": str(e)}, "Error closing Redis connection")
    if mongo_client:
        try:
            mongo_client.close()
            logger.info("MongoDB connection closed.")
        except Exception as e:
            logger.error({"error": str(e)}, "Error closing MongoDB connection")

    logger.info("Worker shutdown complete.")
    sys.exit(0) 