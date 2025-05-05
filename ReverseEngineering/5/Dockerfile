FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y poppler-utils

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Copy the application code
COPY . .

# Install Python dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Install Node.js dependencies if package.json exists
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    if [ -f package.json ]; then npm install; fi

# Default command
CMD if [ -f app.py ]; then \
        exec gunicorn --bind :$PORT app:app; \
    elif [ -f main.py ]; then \
        exec python main.py; \
    elif [ -f server.js ]; then \
        exec node server.js; \
    elif [ -f index.js ]; then \
        exec node index.js; \
    else \
        echo "No recognized entry point found. Please specify a command."; \
        exit 1; \
    fi
