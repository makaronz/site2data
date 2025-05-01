# Site2Data Documentation

---

## Purpose

This documentation is for filmmakers using Site2Data – a platform for film script and production documentation analysis powered by AI/ML.

---

## Key Features
- End-to-end workflow for film script analysis
- AI/ML-powered extraction and transformation
- Modular, scalable architecture
- Real-time and batch processing

---

## Workflow Example
```mermaid
graph TD
    U[Filmmaker uploads PDF] --> P[PDF Parsing]
    P --> S[Scene Splitting]
    S --> C[Chunking]
    C --> L[LLM Analysis (Prompt → JSON)]
    L --> E[Embeddings]
    E --> V[Vector DB (Weaviate)]
    V --> Q[QA/Retrieval]
    Q --> U2[Filmmaker queries script knowledge]
```

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