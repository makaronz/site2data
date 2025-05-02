#!/bin/bash
set -e

# Function to display usage information
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -h, --help     Display this help message"
  echo "  -p, --port     Specify the API port (default: 3000)"
  echo "  -w, --web-port Specify the web port (default: 5173)"
  echo "  -d, --detach   Run in detached mode (background)"
}

# Parse command line arguments
DETACHED=false
API_PORT=3000
WEB_PORT=5173

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      usage
      exit 0
      ;;
    -p|--port)
      API_PORT="$2"
      shift 2
      ;;
    -w|--web-port)
      WEB_PORT="$2"
      shift 2
      ;;
    -d|--detach)
      DETACHED=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# Function to clean up resources
cleanup() {
  echo "Stopping all containers..."
  docker-compose down
  rm -f docker-compose.override.yml
  echo "Application stopped."
  exit 0
}

# Function to handle errors
handle_error() {
  echo "Error: $1"
  cleanup
  exit 1
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup INT TERM

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  handle_error "Docker is not installed. Please install Docker first."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  handle_error "Docker Compose is not installed. Please install Docker Compose first."
fi


# Check if Docker daemon is running
if ! docker info &> /dev/null; then
  echo "Error: Docker daemon is not running."
  echo "Please start Docker daemon first:"

  # Platform-specific instructions
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  - macOS: Open Docker Desktop application"
    echo "  - Or run: open -a Docker"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "  - Linux: Run 'sudo systemctl start docker' or 'sudo service docker start'"
  else
    echo "  - Please start Docker daemon using your system's method"
  fi

  # Clean up without trying to stop containers (since Docker isn't running)
  rm -f docker-compose.override.yml
  echo "Application could not be started. Docker daemon must be running first."
  exit 1
fi
    

# Create a docker-compose override file that sets both context and dockerfile
cat > docker-compose.override.yml << EOL
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - VITE_API_URL=http://localhost:${API_PORT}/trpc
      - VITE_SSE_URL=http://localhost:${API_PORT}/sse
    ports:
      - "${WEB_PORT}:5173"
    command: npm run dev

  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${API_PORT}:3000"
    environment:
      - PORT=3000
      - NODE_ENV=development
    command: npm run dev:api

  worker-js:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - API_URL=http://api:3000
      - NODE_ENV=development
    command: npm run dev:worker-js

  worker-py:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - API_URL=http://api:3000
      - PYTHONUNBUFFERED=1
    command: python -m worker.main
EOL

# Function to check if a port is available
check_port_available() {
  local port=$1
  if lsof -i:"$port" > /dev/null 2>&1; then
    return 1
  fi
  return 0
}

# Function to find an available port
find_available_port() {
  local base_port=$1
  local max_attempts=$2
  local port=$base_port
  
  for (( i=0; i<max_attempts; i++ )); do
    if check_port_available "$port"; then
      echo "$port"
      return 0
    fi
    port=$((base_port + i + 1))
  done
  
  # If no port is available, return the base port and hope for the best
  echo "$base_port"
}

# Check if the specified ports are available, otherwise find available ones
if ! check_port_available "$API_PORT"; then
  echo "Warning: Port $API_PORT is already in use."
  NEW_API_PORT=$(find_available_port 3400 10)
  echo "Using port $NEW_API_PORT for API instead."
  API_PORT=$NEW_API_PORT
  
  # Update the override file with the new port
  sed -i.bak "s/- \"${API_PORT}:3000\"/- \"${NEW_API_PORT}:3000\"/" docker-compose.override.yml
  sed -i.bak "s/VITE_API_URL=http:\/\/localhost:${API_PORT}/VITE_API_URL=http:\/\/localhost:${NEW_API_PORT}/" docker-compose.override.yml
  sed -i.bak "s/VITE_SSE_URL=http:\/\/localhost:${API_PORT}/VITE_SSE_URL=http:\/\/localhost:${NEW_API_PORT}/" docker-compose.override.yml
  rm -f docker-compose.override.yml.bak
fi

if ! check_port_available "$WEB_PORT"; then
  echo "Warning: Port $WEB_PORT is already in use."
  NEW_WEB_PORT=$(find_available_port 5173 10)
  echo "Using port $NEW_WEB_PORT for web instead."
  WEB_PORT=$NEW_WEB_PORT
  
  # Update the override file with the new port
  sed -i.bak "s/- \"${WEB_PORT}:5173\"/- \"${NEW_WEB_PORT}:5173\"/" docker-compose.override.yml
  rm -f docker-compose.override.yml.bak
fi

# Start the application using Docker Compose
echo "Starting Site2Data application..."
if [ "$DETACHED" = true ]; then
  docker-compose up -d || handle_error "Failed to start Docker containers."
else
  docker-compose up -d || handle_error "Failed to start Docker containers."
fi

# Function to check if a service is ready
check_service_ready() {
  local service=$1
  local max_attempts=$2
  local attempt=1
  
  echo "Waiting for $service to be ready..."
  while [ $attempt -le $max_attempts ]; do
    if docker-compose ps | grep -q "$service.*Up"; then
      echo "$service is ready!"
      return 0
    fi
    
    # Check if the service has exited with an error
    if docker-compose ps | grep -q "$service.*Exit"; then
      echo "Error: $service failed to start."
      docker-compose logs $service
      return 1
    fi
    
    echo "Attempt $attempt/$max_attempts: $service not ready yet, waiting..."
    sleep 3
    attempt=$((attempt+1))
  done
  
  echo "Error: $service failed to start within the expected time."
  docker-compose logs $service
  return 1
}

# Check if critical services are ready
check_service_ready "api" 20 || handle_error "API service failed to start."
check_service_ready "web" 20 || handle_error "Web service failed to start."

# Get the mapped port for the frontend service
WEB_PORT=$(docker-compose port web 5173 | cut -d: -f2)
if [ -z "$WEB_PORT" ]; then
  echo "Warning: Could not determine web port from Docker. Using previously set port $WEB_PORT."
fi

# Get the mapped port for the API service
API_PORT=$(docker-compose port api 3000 | cut -d: -f2)
if [ -z "$API_PORT" ]; then
  echo "Warning: Could not determine API port from Docker. Using previously set port $API_PORT."
fi

# Set the URL for the application
APP_URL="http://localhost:$WEB_PORT"
echo "Application is running at: $APP_URL"
echo "API is running at: http://localhost:$API_PORT"

# Wait for the application to fully initialize
echo "Waiting for application to fully initialize..."
sleep 5

# Check if the web service is responding
echo "Checking if the web service is responding..."
if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT" | grep -q "200"; then
  echo "Warning: Web service is not responding with a 200 status code. It may still be initializing."
  echo "Waiting an additional 10 seconds..."
  sleep 10
fi

# If not in detached mode, open the browser and keep the script running
if [ "$DETACHED" = false ]; then
  # Open the browser to the application
  echo "Opening browser to $APP_URL"
  plandex browser "$APP_URL" || handle_error "Failed to open browser or application has errors."
  
  # Keep the script running until Ctrl+C
  echo "Press Ctrl+C to stop the application"
  wait
else
  echo "Application is running in detached mode."
  echo "To stop the application, run: $0 stop"
  echo "To view the application, open: $APP_URL"
fi

