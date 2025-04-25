# Docker Deployment Guide for Site2Data

This guide explains how to deploy the Site2Data application using Docker, which provides a consistent environment across different platforms.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your system (usually comes with Docker Desktop)
- Your OpenAI API key

## Option 1: Using the Helper Script (Easiest Method)

A helper script is provided to simplify the Docker deployment process:

1. Run the helper script:
   ```bash
   ./docker_test.sh
   ```

This script will:
- Check if Docker and Docker Compose are installed
- Create a .env file with your OpenAI API key if it doesn't exist
- Create the downloaded_content directory if needed
- Build and start the Docker containers

2. Access the application at http://localhost:5000

3. To stop the application, press Ctrl+C in the terminal where the script is running

## Option 2: Using Docker Compose Manually

If you prefer to run the commands manually:

1. Make sure your `.env` file contains your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. Build and start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application at http://localhost:5000

4. To stop the application:
   ```bash
   docker-compose down
   ```

## Option 3: Using Docker Directly

If you prefer to use Docker commands directly:

1. Build the Docker image:
   ```bash
   docker build -t site2data .
   ```

2. Run the container:
   ```bash
   docker run -p 5000:8080 -e OPENAI_API_KEY=your_openai_api_key_here -v $(pwd)/downloaded_content:/app/downloaded_content site2data
   ```

3. Access the application at http://localhost:5000

4. To stop the container, first find its ID:
   ```bash
   docker ps
   ```

   Then stop it:
   ```bash
   docker stop <container_id>
   ```

## Persistent Storage

The Docker setup includes a volume mount for the `downloaded_content` directory, which ensures that:

- Files downloaded and processed by the application are saved on your local machine
- These files persist even if the container is stopped or removed
- You can access these files directly from your local filesystem

## Deploying to Cloud Platforms

### Google Cloud Run

1. Build and tag your image for Google Container Registry:
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/site2data .
   ```

2. Push the image to Google Container Registry:
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/site2data
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy --image gcr.io/YOUR_PROJECT_ID/site2data --platform managed --set-env-vars OPENAI_API_KEY=your_openai_api_key_here
   ```

### AWS ECS (Elastic Container Service)

1. Create an ECR repository:
   ```bash
   aws ecr create-repository --repository-name site2data
   ```

2. Authenticate Docker to your ECR registry:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com
   ```

3. Build, tag, and push your image:
   ```bash
   docker build -t YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/site2data:latest .
   docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/site2data:latest
   ```

4. Create an ECS task definition, cluster, and service using the AWS Console or CLI

### DigitalOcean App Platform

1. Push your code to GitHub
2. In the DigitalOcean console, create a new App
3. Select "Dockerfile" as the deployment method
4. Connect your GitHub repository
5. Configure environment variables
6. Deploy the application

## Troubleshooting

### Container Exits Immediately

If the container exits immediately after starting:
- Check the Docker logs: `docker logs <container_id>`
- Ensure your OPENAI_API_KEY is correctly set
- Try running the container in interactive mode: `docker run -it --rm site2data /bin/bash`

### Application Not Accessible

If you can't access the application at http://localhost:5000:
- Verify the container is running: `docker ps`
- Check if the port mapping is correct
- Look at the container logs for any errors: `docker logs <container_id>`

### Permission Issues with Volumes

If you encounter permission issues with the mounted volume:
- Check the ownership of the downloaded_content directory
- You may need to adjust permissions: `chmod -R 777 downloaded_content` (use with caution)
