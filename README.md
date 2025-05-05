# Site2Data

---

## Purpose and Audience

**Site2Data** is an advanced platform for filmmakers, dedicated to the analysis of film scripts and, in the future, all film production documentation. It leverages AI/ML for extraction, analysis, and transformation of data from various sources (PDF, text, production documents).

---

## Key Features

-   Advanced ML/AI analysis (OpenAI API, potentially LangChain, embeddings via Weaviate)

-   Automated extraction and structuring of film scripts (PDF via `apps/worker-js`)

-   Asynchronous multi-stage analysis (chunking, scene analysis, graph generation) via Redis Streams

-   Real-time progress tracking (SSE for `apps/web`, WebSocket for `frontend/`)

-   Two distinct frontends: Simple PDF upload (`apps/web`) and Feature-rich dashboard (`frontend/`) with graph visualization (ReactFlow/Sigma)

-   Scalable architecture using microservices/workers (Node.js, Python) managed within a pnpm monorepo

-   Backend API Gateway (`apps/api`) using Node.js, Express, tRPC (for `apps/web`)

-   Graph generation using Python (`apps/worker-py`) and NetworkX

-   Secure file storage (MinIO/S3) and data persistence (MongoDB)

-   Containerized deployment (Docker)

---

## Documentation

Detailed technical documentation and analysis can be found in the `ReverseEngineering/` directory, including:

-   [Architecture Overview](ReverseEngineering/07_ArchitectureOverview.md)

-   [API Analysis](ReverseEngineering/05_APIAnalysis.md)

-   [Component Interaction & Data Flow](ReverseEngineering/07_ArchitectureOverview.md#component-interaction--data-flow-diagram-detailed)

-   [Error Analysis](ReverseEngineering/06_ErrorsAndDiagnostics.md)

---

## Workflow Overview

*(Refer to the detailed diagram in [Architecture Overview](ReverseEngineering/07_ArchitectureOverview.md#component-interaction--data-flow-diagram-detailed))* 

1.  User uploads PDF script via either frontend (`apps/web` or `frontend/`).

2.  API Gateway (`apps/api`) initiates the job, stores metadata in MongoDB, and publishes the initial task to Redis Stream (`RS_Chunk`).

3.  JS Worker (`apps/worker-js`) consumes the chunking task, fetches the PDF from MinIO, parses/splits it, stores scenes in MongoDB, and publishes analysis tasks to Redis Stream (`RS_Analyze`).

4.  JS Worker (`apps/worker-js`) consumes analysis tasks, calls OpenAI API, stores results in MongoDB and embeddings in Weaviate, and publishes progress via Redis Pub/Sub.

5.  Once all scenes are analyzed, a graph generation task is published to Redis Stream (`RS_Graph`).

6.  Python Worker (`apps/worker-py`) consumes the graph task, fetches data from MongoDB, builds the graph (NetworkX), generates GEXF/ZIP, uploads it to MinIO, updates MongoDB, and publishes completion via Redis Pub/Sub.

7.  Frontends receive real-time updates (SSE for `apps/web`, WebSocket for `frontend/`) and display results/graphs.

---

## Roadmap & Progress

*(Based on recent activity and task lists)*

### Core Functionality Implemented

-   Monorepo setup with pnpm workspaces.

-   Asynchronous processing pipeline using Redis Streams (chunking, analysis, graph gen).

-   PDF upload via both frontends.

-   Backend API Gateway (`apps/api`) with tRPC for `apps/web`.

-   JS Worker (`apps/worker-js`) for PDF parsing, OpenAI analysis, Weaviate embedding.

-   Python Worker (`apps/worker-py`) for graph generation (NetworkX).

-   Basic real-time progress updates (SSE/WebSocket).

-   Basic graph visualization in `frontend/`.

-   Containerization setup (Docker, docker-compose).

### In Progress / Next Steps

-   Refining and stabilizing the graph visualization in `frontend/`.

-   Ensuring robust error handling and retry mechanisms across all workers.

-   Completing test coverage (unit, integration, E2E) for all components.

-   Standardizing API responses and WebSocket events.

-   Improving monitoring and logging (Prometheus, potentially LangSmith/Sentry).

-   Completing and unifying technical documentation.

-   Implementing user authentication/authorization if needed.

### Planned / Future

-   Support for other input formats (TXT, Fountain, Final Draft).

-   Advanced search capabilities using Weaviate embeddings.

-   Automated generation of production reports.

-   Enhanced analysis features (risk radar, timeline visualization).

-   Integrations with external production tools.

-   Full internationalization (i18n).

---

## Technologies & Architecture

-   **Monorepo Management:** pnpm, Turbo (likely)

-   **Frontend (`apps/web`):** React, TypeScript, Vite, Material UI

-   **Frontend (`frontend/`):** React, TypeScript, Vite, Material UI, Zustand, React Router DOM, ReactFlow, Sigma, PapaParse, Axios

-   **Backend API Gateway (`apps/api`):** Node.js, TypeScript, Express, tRPC

-   **Worker JS (`apps/worker-js`):** Node.js, TypeScript, Pino, OpenAI Client, AJV, PDF parsing utils, (LangChain inferred)

-   **Worker PY (`apps/worker-py`):** Python, NetworkX, LXML

-   **Database:** MongoDB

-   **Vector Database:** Weaviate

-   **File Storage:** MinIO / S3

-   **Messaging/Queueing:** Redis (Streams, Pub/Sub)

-   **Real-time:** Server-Sent Events (SSE), WebSockets

-   **AI/ML:** OpenAI API

-   **Containerization:** Docker, Docker Compose

-   **Monitoring:** Prometheus

-   **Testing:** Cypress (E2E/Component), Vitest (Unit)

-   **Code Quality:** ESLint, Prettier

---

## Quick Start

1.  Ensure Docker, Docker Compose, Node.js (check version), and pnpm are installed.

2.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

3.  Install dependencies from the root directory:
    ```bash
    pnpm install
    ```

4.  Configure environment variables:
    ```bash
    cp .env.example .env
    # Edit .env with your API keys (OpenAI), MinIO credentials, etc.
    ```

5.  Build necessary packages/apps (if needed, check `turbo.json`):
    ```bash
    pnpm turbo build
    ```

6.  Run the entire stack using Docker Compose:
    ```bash
    docker compose up --build
    ```

7.  Access the frontends:
    -   Simple (`apps/web`): Likely served by `apps/api` (check `docker-compose.yml` or API logs for port, e.g., http://localhost:8000)

    -   Rich (`frontend/`): Check `docker-compose.yml` (e.g., http://localhost:5173)

*Note: Refer to `docker-compose.yml` for specific service names, ports, and dependencies.* 

---

## Testing

-   Run all tests (check `package.json` scripts, likely using Turbo):
    ```bash
    pnpm turbo test
    ```

-   Run specific package tests (e.g., for `frontend/`):
    ```bash
    pnpm --filter frontend test
    ```

-   Run linters/formatters:
    ```bash
    pnpm turbo lint
    # or specific package: pnpm --filter <package_name> lint
    ```

-   E2E tests likely use Cypress (check `package.json` scripts).

---

## Development & Contribution

-   Follow standard Git workflow (feature branches, PRs).

-   Ensure code quality (linting, formatting, types).

-   Add tests for new features/fixes.

-   Update relevant documentation in `ReverseEngineering/` or other appropriate locations.

---

## API Reference

-   The primary API gateway is `apps/api`. It uses tRPC for communication with `apps/web`.

-   Other REST endpoints or WebSocket communication might be used by `frontend/`. Refer to `ReverseEngineering/05_APIAnalysis.md` and the specific application code (`apps/api/src`, `frontend/src`) for details.

---

## System Architecture

The system utilizes a monorepo structure housing multiple applications and shared packages. Core components include two frontends, an API gateway, and two background workers communicating via Redis. See [Architecture Overview](ReverseEngineering/07_ArchitectureOverview.md) for a detailed description and diagram.

---

## Contact & Support

-   Open an Issue on the GitHub repository.

-   Refer to documentation in the `ReverseEngineering/` directory.

-   Contact the development team.

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Data Anonymization Notice

All film titles and character names used in examples, tests, and data files should be fictional and anonymized. Any resemblance to real films or persons is coincidental. This ensures compliance with copyright and privacy requirements for demo and test data.

