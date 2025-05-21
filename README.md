# ai_CineHub

**ai_CineHub is an advanced, AI-powered platform designed for filmmakers and production teams to deeply analyze film scripts and streamline pre-production workflows. It leverages Large Language Models (OpenAI) to automatically extract, structure, and analyze vast amounts of data from screenplays (initially PDFs, with future support for other formats).**

The platform offers structured insights, dedicated analytical views tailored for various crew roles (e.g., producer, director, cinematographer, production designer), interactive character relationship graphs, and tools to support production planning, risk assessment, and resource management.

---

## Key Features

*   **Advanced AI Script Analysis:**
    *   Utilizes OpenAI API for in-depth content analysis, including scene breakdown, character identification, dialogue extraction, and more.
    *   Automatic extraction of key production elements: characters, locations, props, vehicles, weapons, animals, special equipment, SFX/VFX requirements.
    *   Identification of scene mood, character interactions, and sentiment analysis between characters.
    *   Extraction of potential production risks and elements requiring special permits or attention.
*   **Data Structuring & Storage:**
    *   Asynchronous, multi-stage processing pipeline (chunking, scene-by-scene analysis, graph generation) managed by Redis Streams.
    *   Structured data stored in MongoDB (scene details, character profiles, location data, props, extracted entities, user edits).
    *   Vector embeddings (for scenes, characters, locations) generated via OpenAI and stored in Weaviate for advanced semantic search and similarity analysis.
    *   Original script files and generated assets (like graph exports) stored in MinIO/S3.
*   **Interactive Frontend Dashboard (`frontend/`):**
    *   File upload interface for PDF scripts.
    *   Real-time progress tracking of the analysis pipeline.
    *   **Dedicated Analytical Views:** Tailored dashboards and data presentations for different production roles:
        *   Scene Structure & Breakdown
        *   Character Analysis (appearances, dialogue, relationships, risk associations)
        *   Location Summaries (scenes per location, day/night, permit needs)
        *   Lists of Props, Vehicles, Weapons, etc.
        *   "Difficult Scenes" view highlighting elements like children, animals, stunts, SFX.
        *   Cinematographer's View (lighting schemes, special equipment needs per scene).
        *   Production Risk Checklist (aggregated risks per scene).
        *   Cross-Reference Matrices (e.g., characters vs. locations).
        *   Production Schedule / Shooting Day Planner (initial implementation).
        *   Director's Emotion Map (mood progression across scenes).
        *   Production Designer's View (props/elements grouped by location/scene).
        *   First AD's Daily Checklist (auto-generated needs for shooting days).
        *   Overall Project Statistics Dashboard.
    *   **Interactive Character Relationship Graph:**
        *   Visualization of character connections, interaction strength, and sentiment using `@react-sigma/core`.
        *   Filtering, overlays, and export capabilities (PNG, GEXF).
    *   **Data Editing:** Ability for users to review and edit AI-extracted data, with changes saved to MongoDB.
*   **Data Export:**
    *   Export analytical data in various formats (JSON, CSV).
    *   Export character relationship graphs (GEXF format, packaged in ZIP).
*   **Scalable & Robust Architecture:**
    *   Monorepo managed with pnpm and Turbo.
    *   Microservices/worker architecture (Node.js, Python).
    *   API Gateway (`apps/api`) using Node.js, Express, and tRPC for frontend communication.
    *   Containerized deployment using Docker and Docker Compose for easy setup and scalability.

---

## Roadmap & Progress

The project is currently undergoing significant development to implement a comprehensive suite of features for film production analysis.

### Current Focus & Next Steps:

*   **UI Integration & Enhancement:**
    *   Consolidating and integrating different UI implementations (new main interface and `frontend/` directory) into a unified user experience.
    *   Implementing the 9 core analytical sections with improved UI/UX and data presentation.
*   **Phase 1: Extended Data Modeling & Backend Core (In Progress):**
    *   Defining detailed MongoDB schemas and TypeScript types for all new data structures (scenes, characters with centrality, relationships, production schedules, risk checklists, etc.).
    *   Defining Weaviate classes for `Scene`, `Character`, `Location` embeddings.
    *   Updating AI prompts and `analyzer.ts` (in `apps/api`) for extracting and processing extended data with Zod validation.
    *   Implementing backend API endpoints (CRUD) for data editing.
    *   Developing logic for graph metrics calculation (e.g., character centrality).
*   **Phase 2: Backend Logic for Views, Aggregations & Graph Serving (Upcoming):**
    *   Implementing MongoDB aggregations for cross-reference matrices and other specialized views.
    *   Developing algorithms for production day grouping.
    *   Creating APIs for dedicated views (Producer's Risk Checklist, Cinematographer's View, etc.).
    *   Implementing mood analysis logic (potentially using Weaviate similarity).
    *   Building APIs for data export (JSON, CSV, GEXF) and graph data serving (for Sigma.js).
*   **Phase 3: Frontend Implementation (Upcoming):**
    *   Developing React components for all new analytical views and data editing interfaces.
    *   Implementing the interactive character relationship graph (`RelationshipGraph.tsx` with `@react-sigma/core`), including styling, controls, overlays, and export.
    *   Implementing UI layout suggestions (e.g., production metadata header, sticky analysis menu).
*   **Phase 4: Comprehensive Testing, Optimization & Iteration (Upcoming):**
    *   Manual E2E testing, performance testing (especially for graphs).
    *   Code refactoring and optimization.

### Key Milestones Achieved:

*   Core monorepo structure and asynchronous processing pipeline (Redis Streams).
*   PDF upload and basic analysis flow.
*   Initial versions of `apps/api`, `apps/worker-js`, `apps/worker-py`.
*   Basic graph generation (NetworkX) and visualization (`frontend/`).
*   Containerization with Docker and Docker Compose.
*   Enhanced AI interaction in `apps/api` with retry mechanisms and Zod validation.
*   Creation of a new basic UI in the project root (React/Vite).
*   Comprehensive update of the "Memory Bank" documentation.

### Future Considerations (Post-MVP+):

*   Support for additional input formats (DOCX, TXT, Fountain, Final Draft).
*   Advanced semantic search using Weaviate embeddings.
*   Automated generation of comprehensive production reports.
*   User authentication and authorization.
*   Full internationalization (i18n).

---

## Technologies & Architecture

*   **Monorepo Management:** pnpm, Turbo
*   **Languages:** TypeScript (primary), Python
*   **Frontend (`frontend/` - Main Dashboard):**
    *   React, Vite, Material UI (MUI)
    *   Zustand (state management)
    *   React Router DOM (routing)
    *   `@react-sigma/core` (interactive graph visualization)
    *   Axios, PapaParse
    *   Potentially: `react-big-calendar`, `Recharts`
*   **Backend API Gateway (`apps/api`):**
    *   Node.js, Express, tRPC
    *   OpenAI Client, Zod (validation)
    *   `ws` (WebSockets)
    *   Pino (logging)
    *   Clients for Redis, MongoDB, MinIO, Weaviate
    *   `graphology`, `graphology-metrics`, `graphology-gexf` (server-side graph processing)
*   **JS Worker (`apps/worker-js`):**
    *   Node.js, TypeScript
    *   OpenAI Client, Zod (validation, replacing AJV)
    *   `pdf-parse` (or similar for PDF processing)
    *   Clients for Redis, MongoDB, MinIO, Weaviate
*   **Python Worker (`apps/worker-py` - potentially to be phased out or refocused):**
    *   Python
    *   NetworkX, LXML (if GEXF generation remains here)
*   **Databases & Storage:**
    *   **MongoDB:** Primary database for structured analytical data, metadata, user edits.
    *   **Weaviate:** Vector database for OpenAI embeddings (scenes, characters, locations).
    *   **Redis:** Message broker (Streams for task queuing) and Pub/Sub.
    *   **MinIO/S3:** Object storage for PDF files and generated graph exports.
*   **AI/ML:** OpenAI API (GPT models for text analysis & embeddings)
*   **Shared Packages (`packages/*`):** TypeScript types, utility functions, AI prompts, Zod schemas.
*   **Containerization:** Docker, Docker Compose
*   **Code Quality:** ESLint, Prettier
*   **Testing:** Vitest (unit/integration), Cypress (E2E/component)
*   **Monitoring:** Prometheus (initial setup), Grafana (planned), LangSmith/Sentry (considered)

---

## Quick Start

1.  **Prerequisites:**
    *   Docker & Docker Compose
    *   Node.js (refer to `.nvmrc` or project settings for version)
    *   pnpm ( `npm install -g pnpm` )
2.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd ai-cinehub
    ```
3.  **Install dependencies:**
    (From the project root directory)
    ```bash
    pnpm install
    ```
4.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file in the project root and provide all necessary credentials and configurations (OpenAI API Key, MinIO details, etc.).
5.  **Build packages (if necessary, managed by Turbo):**
    ```bash
    pnpm turbo build
    ```
6.  **Run the application stack:**
    (From the project root directory)
    ```bash
    docker compose up --build -d
    ```
    *(Use `-d` to run in detached mode. View logs with `docker compose logs -f <service_name>` e.g., `docker compose logs -f api`)*
7.  **Access the Frontend:**
    *   The main frontend application (`frontend/`) should be accessible at: `http://localhost:5173` (verify port in `docker-compose.yml` or Vite config if changed).
    *   The new basic UI (if still separately served during development) might be on `http://localhost:3005`.

*Note: Consult `docker-compose.yml` for specific service names, exposed ports, and environment variable overrides.*

---

## Contributing

Details on contributing, coding standards, and submitting pull requests will be provided in a `CONTRIBUTING.md` file (to be created).

---

## API Reference

-   The primary API gateway is `apps/api`. It uses tRPC for communication with `apps/web`.

---

## Contact & Support

-   Open an Issue on the GitHub repository.


-   Contact the development team.

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Data Anonymization Notice

All film titles and character names used in examples, tests, and data files should be fictional and anonymized. Any resemblance to real films or persons is coincidental. This ensures compliance with copyright and privacy requirements for demo and test data.

## Uruchamianie aplikacji

Aplikacja została skonfigurowana tak, aby zawsze działać na określonych portach. Możesz ją uruchomić za pomocą przygotowanego skryptu:

```bash
# Uruchom całą aplikację jednym poleceniem
npm start
```

Skrypt automatycznie:
1. Sprawdzi dostępność wymaganych portów
2. Zwolni zajęte porty, jeśli to konieczne
3. Uruchomi backend na porcie 3001
4. Uruchomi frontend na porcie 5173
5. Skonfiguruje odpowiednie proxy dla komunikacji między komponentami

### Konfiguracja portów

Możesz dostosować porty, edytując plik `.env.ports`:

```
# Porty aplikacji
PORT=3001
VITE_PORT=5173
API_URL=http://localhost:3001
```

