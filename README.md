# Site2Data

---

## Purpose and Audience

**Site2Data** is an advanced platform for filmmakers, dedicated to the analysis of film scripts and, in the future, all film production documentation. It leverages AI/ML for extraction, analysis, and transformation of data from various sources (PDF, text, production documents).

---

## Key Features
- ML analysis (transformers, LangChain, embeddings)
- Data extraction (PDF, text, film documentation)
- NLP processing (compromise, node-nlp)
- Real-time analysis (Socket.IO)
- Secure architecture (Helmet, rate-limiting)
- Scalable (Docker, workspace management)

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

---

## Testing

- `npm test` - Run tests
- `npm run lint` - Check code for errors
- `npm run format` - Format code
- E2E and component tests: see `cypress/` and `src/**/*.cy.ts`

---

## Development & Contribution
- See `CONTRIBUTING.md` for guidelines
- All code and documentation should reflect the film industry focus

---

## Contact & Support
- Open an Issue on GitHub
- See documentation in `/docs`
- Contact the development team

---

## License
MIT License. See [LICENSE](LICENSE).
