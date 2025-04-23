import os
from dotenv import load_dotenv
import weaviate
from weaviate.classes.init import Auth

def initialize_weaviate_client():
    """
    Initialize connection to Weaviate Cloud Services.
    Returns a Weaviate client instance if successful.
    """
    try:
        # Load environment variables from .env file
        load_dotenv()
        
        # Get credentials from environment variables
        weaviate_url = os.getenv("WEAVIATE_URL")
        weaviate_api_key = os.getenv("WEAVIATE_API_KEY")
        
        # Validate environment variables
        if not weaviate_url or not weaviate_api_key:
            raise ValueError("Missing required environment variables: WEAVIATE_URL or WEAVIATE_API_KEY")
            
        # Connect to Weaviate Cloud
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=weaviate_url,
            auth_credentials=Auth.api_key(weaviate_api_key),
        )
        
        # Check if connection is successful
        if client.is_ready():
            print("Successfully connected to Weaviate!")
            return client
        else:
            raise ConnectionError("Failed to establish connection with Weaviate")
            
    except Exception as e:
        print(f"Error connecting to Weaviate: {str(e)}")
        raise

if __name__ == "__main__":
    client = None
    try:
        client = initialize_weaviate_client()
        # You can add more operations here
        
    except Exception as e:
        print(f"Failed to initialize Weaviate client: {str(e)}")
    finally:
        if client:
            client.close()
            print("Connection closed successfully.") 