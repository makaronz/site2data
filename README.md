# Site2Data

---

## Purpose and Audience

**Site2Data** is an advanced platform for filmmakers, dedicated to the analysis of film scripts and, in the future, all film production documentation. It leverages AI/ML for extraction, analysis, and transformation of data from various sources (PDF, text, production documents).

---

## Key Features
- Advanced ML/AI analysis (transformers, LangChain, OpenAI, embeddings)
- Automated extraction and structuring of film scripts (PDF, text, production docs)
- Scene splitting, character and relationship detection
- NLP processing (compromise, node-nlp)
- Real-time progress tracking and job status (WebSocket/EventSource)
- Interactive dashboard: structure, characters, relationships, graph visualization
- Secure, scalable, and modular architecture (Docker, monorepo, microservices)
- API-first: REST endpoints for upload, analysis, progress, and graph export
- Comprehensive test coverage (unit, integration, E2E)
- Data anonymization for demo/test flows

---

## Documentation

- [System Overview](docs/system_overview.md) - Comprehensive overview of the system architecture, data flow, and components
- [Architecture Documentation](docs/architecture.md) - Detailed architecture diagrams and component interactions
- [Developer Guide](docs/developer_guide.md) - Setup instructions, codebase organization, and contribution guidelines
- [API Documentation](docs/api_documentation.md) - Complete API reference with endpoints and examples

---

## Workflow Example

```mermaid
graph TD
    subgraph "Input"
        U[User uploads script PDF] --> P[PDF Parsing]
    end
    subgraph "Processing"
        P --> S[Scene Splitting]
        S --> C[Chunking]
        C --> L[LLM Analysis]
        L --> E[Embeddings Generation]
    end
    subgraph "Storage"
        E --> V[Vector DB Storage]
        L --> D[Document DB Storage]
    end
    subgraph "Retrieval"
        V --> Q[Semantic Search]
        D --> R[Structured Queries]
        Q --> A[Analysis Results]
        R --> A
    end
    subgraph "Visualization"
        A --> VIZ[Interactive Visualizations]
        VIZ --> REL[Relationship Graphs]
        VIZ --> SCN[Scene Timeline (planned)]
        VIZ --> CHR[Character Networks]
        VIZ --> EXP[Export/Download (planned)]
        VIZ --> RISK[Risk-Radar (planned)]
    end
    A --> U2[User queries script knowledge]
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

## Technologies & Architecture
- **Backend**: Node.js, Express, MongoDB
- **ML/AI**: LangChain (JS/Python), OpenAI, Transformers
- **Frontend**: SvelteKit, TailwindCSS
- **Vector database**: Weaviate
- **Testing**: Jest, Cypress
- **DevOps**: Docker, docker-compose, Prometheus
- **Cache**: Redis, FileSystemCache
- **Architecture**: Monorepo, microservices for ML and embeddings

---

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/site2data.git
cd site2data
```
2. Install dependencies:
```bash
npm install
```
3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env file according to your configuration
```
4. Run the application:
```bash
# Development mode
npm run dev
# Production mode
npm start
```

For detailed setup instructions, see the [Developer Guide](docs/developer_guide.md).

---

## Testing

- `npm test` - Run tests
- `npm run lint` - Check code for errors
- `npm run format` - Format code
- E2E and component tests: see `cypress/` and `src/**/*.cy.ts`

---

## Development & Contribution
- See the [Developer Guide](docs/developer_guide.md) for detailed contribution guidelines
- All code and documentation should reflect the film industry focus

---

## API Reference

The Site2Data API provides endpoints for script upload, analysis, and visualization. For complete documentation, see the [API Documentation](docs/api_documentation.md).

Example API usage:

```javascript
// Upload a script
const response = await fetch('/api/scripts/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});

// Get analysis results
const analysis = await fetch(`/api/scripts/${scriptId}/analysis`, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

---

## System Architecture

Site2Data uses a microservices architecture with separate components for frontend, API, and workers. For a detailed overview of the system architecture, see the [System Overview](docs/system_overview.md) and [Architecture Documentation](docs/architecture.md).

---

## Contact & Support
- Open an Issue on GitHub
- See documentation in `/docs`
- Contact the development team

---

## License
MIT License. See [LICENSE](LICENSE).

---

## Data Anonymization Notice

All film titles and character names used in examples, tests, and data files are fictional and have been anonymized. Any resemblance to real films or persons is coincidental. This ensures compliance with copyright and privacy requirements for demo and test data.

