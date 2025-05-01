# Site2Data Frontend (SvelteKit)

---

## Purpose

This is the SvelteKit-based frontend for Site2Data – a platform for filmmakers to analyze film scripts and production documentation using AI/ML.

---

## Key Features
- Upload and analyze film scripts (PDF)
- Real-time progress and results via WebSocket
- Dashboard for script structure, characters, relationships, and graph visualization
- Seamless integration with backend AI/ML services

---

## Technologies
- SvelteKit
- TypeScript
- TailwindCSS
- Socket.IO
- Material UI (where applicable)

---

## Directory Structure
- `/src/routes` – SvelteKit routes and pages
- `/src/lib` – Shared components and utilities
- `/src/stores` – State management
- `/src/types` – TypeScript types
- `/static` – Static assets

---

## How to Run

1. Install dependencies:
```bash
npm install
```
2. Start the development server:
```bash
npm run dev
```
3. Access the app at [http://localhost:5173](http://localhost:5173) (default)

---

## Development Workflow
- All UI/UX should be tailored for filmmakers and script analysis
- Use data-cy attributes for testability
- Follow the Arrange-Act-Assert pattern in tests
- See `CONTRIBUTING.md` for guidelines

---

## License
MIT License. See [LICENSE](../LICENSE).
