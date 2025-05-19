# ai_CineHub Frontend

---

## Purpose

This is the React frontend for ai_CineHub – a platform for filmmakers to analyze film scripts and production documentation using AI/ML.

---

## Key Features
- Modern UI for uploading and analyzing film scripts (PDF)
- Real-time progress and results via WebSocket
- Dashboard for script structure, characters, relationships, and graph visualization
- Integration with backend AI/ML services

---

## Technologies
- React
- TypeScript
- TailwindCSS
- Socket.IO
- Material UI (where applicable)

---

## Directory Structure
- `/src` – Contains the main source code, including components, pages, services, and utilities.
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