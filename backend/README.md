# Site2Data Backend

---

## Purpose

This is the Node.js backend for Site2Data – a platform for filmmakers to analyze film scripts and production documentation using AI/ML.

---

## Key Features
- REST API for uploading and analyzing film scripts (PDF)
- Integration with AI/ML services (LangChain, OpenAI)
- Chunking, parsing, and scene extraction
- Real-time progress via WebSocket/SSE
- Embedding and vector search (Weaviate)
- Secure, scalable, and modular architecture

---

## Technologies
- Node.js, Express
- TypeScript
- MongoDB
- Redis
- LangChain, OpenAI
- Weaviate
- Docker

---

## Directory Structure
- `/src/controllers` – Request handlers and business logic
- `/src/models` – Database models and schemas
- `/src/utils` – Helper functions and utilities
- `/src/script_analysis` – Script analysis modules
- `/src/config` – Configuration files

---

## How to Run

1. Install dependencies:
```bash
npm install
```
2. Start the backend server:
```bash
npm run dev
```
3. The API will be available at [http://localhost:5000](http://localhost:5000) (default)

---

## API Overview
- See OpenAPI/Swagger docs at `/api-docs` when the server is running
- Main endpoints:
  - `POST /api/script/analyze` – Upload and analyze a film script
  - `GET /api/script/{id}/result` – Get analysis results
  - `GET /api/script/{id}/graph` – Download relationship graph
  - `GET /api/progress/{jobId}` – Real-time progress

---

## Development Workflow
- All endpoints and logic should be tailored for filmmakers and script analysis
- Use TypeScript for type safety
- Write unit and integration tests for all critical flows
- See `CONTRIBUTING.md` for guidelines

---

## License
MIT License. See [LICENSE](../LICENSE). 