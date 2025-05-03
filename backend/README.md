# Site2Data Backend

---

## Purpose

This is the Node.js backend for Site2Data – a platform for filmmakers to analyze film scripts and production documentation using AI/ML.

---

## Key Features
- REST API for uploading and analyzing film scripts (PDF, text)
- Integration with AI/ML services (LangChain, OpenAI, Transformers)
- Scene splitting, character and relationship detection
- Real-time progress tracking and job status (WebSocket/EventSource)
- Embedding and vector search (Weaviate)
- Secure, scalable, and modular architecture (Docker, monorepo)
- Comprehensive test coverage (unit, integration, E2E)
- Data anonymization for demo/test flows

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
  - `POST /api/script/upload` – Upload a film script
  - `POST /api/script/analyze` – Analyze a film script
  - `GET /api/script/{id}/result` – Get analysis results
  - `GET /api/script/{id}/graph` – Download relationship graph
  - `GET /api/progress/{jobId}` – Real-time progress
  - `GET /api/script/analysis/{id}` – Get advanced ML analysis (planned)
  - `GET /api/export/{id}` – Export results (planned)

---

## Development Workflow
- All endpoints and logic should be tailored for filmmakers and script analysis
- Use TypeScript for type safety
- Write unit and integration tests for all critical flows
- See `CONTRIBUTING.md` for guidelines

---

## License
MIT License. See [LICENSE](../LICENSE).

---

## Data Anonymization Notice

All film titles and character names used in backend examples, tests, and data files are fictional and anonymized. Any resemblance to real films or persons is coincidental. This ensures compliance with copyright and privacy requirements for demo and test data. 

---

## Roadmap & Progress

### Recently Completed
- Pełna anonimizacja danych testowych i przykładowych (tytuły, postacie)
- Progres tracker: śledzenie statusu analizy (upload, chunking, analyzing, graph)
- API: upload, analiza, pobieranie wyników, pobieranie grafu relacji
- Testy jednostkowe i integracyjne dla parsera i API

### In Progress
- Eksport wyników analizy do różnych formatów (CSV, JSON, PDF)
- Timeline scen i wizualizacja przepływu narracji
- Risk-radar: analiza ryzyk i punktów zwrotnych w scenariuszu
- Ulepszona obsługa relacji postaci (typy, siła, sentyment)
- Integracje z zewnętrznymi narzędziami produkcyjnymi

### Planned
- Zaawansowane filtry i wyszukiwanie po metadanych
- Automatyczne generowanie raportów produkcyjnych
- Wsparcie dla kolejnych formatów (Fountain, Final Draft, itp.)
- Rozbudowana dokumentacja API (OpenAPI/Swagger)
- Pełna internacjonalizacja (i18n) 