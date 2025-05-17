# apps/worker-js/Dockerfile
FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Kopiujemy pliki package*.json z właściwego podkatalogu (apps/worker-js)
COPY apps/worker-js/package*.json ./

RUN npm install --legacy-peer-deps

# Kopiujemy katalog packages do /usr/src/app/packages w etapie development
COPY packages/ ./packages/

# Kopiujemy resztę kodu aplikacji worker-js
COPY apps/worker-js/src/ ./src/
COPY apps/worker-js/tsconfig.json ./tsconfig.json
# Jeśli są inne pliki/katalogi w apps/worker-js do skopiowania, dodaj je tutaj
# Np. COPY apps/worker-js/.env.example ./.env.example

# Zamiast kompilacji TypeScript, kopiujemy pliki źródłowe do dist (tymczasowe obejście)
# Ta logika może wymagać dostosowania, jeśli `src` zawiera rzeczy, których nie chcemy w `dist`
RUN mkdir -p dist && cp -r src/* dist/

# --- Obraz produkcyjny ---
FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Kopiujemy pliki package*.json z właściwego podkatalogu
COPY apps/worker-js/package*.json ./

RUN npm install --only=production --legacy-peer-deps

# Kopiujemy z etapu 'development'
# Upewniamy się, że docelowe katalogi istnieją i są traktowane jako katalogi
COPY --from=development /usr/src/app/dist/ ./dist/
COPY --from=development /usr/src/app/src/ ./src/
COPY --from=development /usr/src/app/tsconfig.json ./tsconfig.json
# Kopiujemy packages z etapu development do ./packages/ (czyli /usr/src/app/packages/)
COPY --from=development /usr/src/app/packages/ ./packages/

# Komenda do uruchomienia workera poprzez ts-node z tsconfig-paths
CMD ["sh", "-c", "echo '--- Listing /usr/src/app (worker-js) ---' && ls -la /usr/src/app && echo '--- Listing /usr/src/app/node_modules (worker-js) ---' && ls -la /usr/src/app/node_modules || echo 'node_modules not found or empty' && echo '--- Listing /usr/src/app/packages (worker-js) ---' && ls -la /usr/src/app/packages || echo 'packages not found or empty' && echo '--- Starting ts-node (worker-js) ---' && npx ts-node -r tsconfig-paths/register --project tsconfig.json src/index.ts"]
# Lub jeśli masz skrypt start: CMD ["npm", "start"] 