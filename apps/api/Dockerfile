# apps/api/Dockerfile
FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Kopiujemy package.json i pliki lock
COPY package*.json ./
# COPY pnpm-lock.yaml ./ # Jeśli używasz pnpm
# COPY bun.lockb ./ # Jeśli używasz Bun

# Instalujemy wszystkie zależności (w tym devDependencies potrzebne do budowania)
RUN npm install --legacy-peer-deps
# RUN pnpm install # Jeśli używasz pnpm
# RUN bun install # Jeśli używasz Bun

# Kopiujemy resztę kodu aplikacji
COPY . .

# Debugowanie: Sprawdź, czy pliki modeli są poprawnie kopiowane
RUN echo "==== LISTOWANIE ZAWARTOŚCI KATALOGU MODELS ====" && \
    ls -la /usr/src/app/src/models && \
    echo "==== SPRAWDZENIE ISTNIEJĄCYCH TYPÓW IMPORTU ====" && \
    cat /usr/src/app/src/router.ts | grep "import.*from.*models"

# Zamiast kompilacji TypeScript, kopiujemy pliki źródłowe do dist
RUN mkdir -p dist && cp -r src/* dist/

# --- Obraz produkcyjny ---
FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
# COPY pnpm-lock.yaml ./ # Jeśli używasz pnpm
# COPY bun.lockb ./ # Jeśli używasz Bun

# Instalujemy tylko zależności produkcyjne oraz ts-node
RUN npm install --only=production --legacy-peer-deps
# RUN pnpm install --prod # Jeśli używasz pnpm
# RUN bun install --production # Jeśli używasz Bun


# Kopiujemy zbudowaną aplikację z etapu '''development'''
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/src ./src
COPY --from=development /usr/src/app/tsconfig.json ./tsconfig.json
# Jeśli twój skrypt build umieszcza pliki gdzie indziej, dostosuj ścieżkę /usr/src/app/dist

# Upewnij się, że port, na którym nasłuchuje aplikacja, jest zgodny z docker-compose.yml (domyślnie 3000)
EXPOSE ${PORT:-3000}

# Komenda do uruchomienia aplikacji
# Załóżmy, że główny plik to dist/server.js lub dist/main.js
# Jeśli używasz skryptu start z package.json, może to być: CMD ["npm", "run", "start:prod"] lub podobnie
# CMD ["npx", "ts-node", "src/server.ts"]
CMD ["sh", "-c", "echo '--- Listing /usr/src/app ---' && ls -la /usr/src/app && echo '--- Listing /usr/src/app/node_modules ---' && ls -la /usr/src/app/node_modules || echo 'node_modules not found or empty' && echo '--- Starting ts-node ---' && npx ts-node --project tsconfig.json src/server.ts"]
# Lub jeśli masz skrypt start: CMD ["npm", "start"] (upewnij się, że package.json jest skonfigurowany) 