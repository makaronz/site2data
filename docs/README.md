# Site2Data Documentation

---

## Purpose

This documentation is for filmmakers using Site2Data – a platform for film script and production documentation analysis powered by AI/ML.

---

## Key Features
- End-to-end workflow for film script analysis (upload, parsing, chunking, ML analysis)
- AI/ML-powered extraction, scene splitting, character and relationship detection
- Real-time and batch processing with progress tracking (WebSocket/EventSource)
- Interactive dashboard: structure, characters, relationships, graph visualization
- Secure, scalable, and modular architecture (Docker, monorepo)
- REST API for upload, analysis, progress, and graph export
- Comprehensive test coverage (unit, integration, E2E)
- Data anonymization for demo/test flows

---

## Workflow Example
```mermaid
graph TD
    U[User uploads script PDF] --> P[PDF Parsing]
    P --> S[Scene Splitting]
    S --> C[Chunking]
    C --> L[LLM Analysis (Prompt → JSON)]
    L --> E[Embeddings]
    E --> V[Vector DB (Weaviate)]
    V --> Q[QA/Retrieval]
    Q --> U2[User queries script knowledge]
    Q --> VIZ[Interactive Visualizations]
    VIZ --> REL[Relationship Graphs]
    VIZ --> SCN[Scene Timeline (planned)]
    VIZ --> CHR[Character Networks]
    VIZ --> EXP[Export/Download (planned)]
    VIZ --> RISK[Risk-Radar (planned)]
```

---

## Roadmap & Progress

### Recently Completed
- Pełna anonimizacja danych testowych i przykładowych (tytuły, postacie)
- Progres tracker: śledzenie statusu analizy (upload, chunking, analyzing, graph)
- API: upload, analiza, pobieranie wyników, pobieranie grafu relacji
- Dashboard: wizualizacja struktury, postaci, relacji, grafów
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

---

## Technologies
- Node.js, Express, MongoDB
- LangChain, OpenAI, Transformers
- SvelteKit, TailwindCSS
- Docker, Redis, Weaviate

---

## Directory Structure
- `/backend` – Node.js backend
- `/frontend` – SvelteKit frontend
- `/docs` – Documentation
- `/tasks`, `/templates`, `/resources` – Project assets
- `/tests` – Unit and integration tests

---

## How to Use This Documentation
- Start with the main README for setup and workflow
- See `architecture.md` for system overview
- See `product_requirement_docs.md` for requirements
- Use API docs for integration details

---

## Contribution
- See `CONTRIBUTING.md` for guidelines

---

## License
MIT License. See [LICENSE](../LICENSE).

---

## Data Anonymization Notice

All film titles and character names in this documentation are fictional and anonymized for demonstration and testing purposes only. 