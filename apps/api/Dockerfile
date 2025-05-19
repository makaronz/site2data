# apps/api/Dockerfile
FROM node:18-alpine AS development
WORKDIR /usr/src/app
# Kopiujemy package.json i pliki lock
COPY package*.json ./
# COPY pnpm-lock.yaml ./ # Jeśli używasz pnpm
# COPY bun.lockb ./ # Jeśli używasz Bun
# Instalujemy wszystkie zależności (w tym devDependencies potrzebne do budowania)
RUN npm install --legacy-peer-deps && npm install ws @types/ws
# RUN pnpm install # Jeśli używasz pnpm
# RUN bun install # Jeśli używasz Bun
# Kopiujemy resztę kodu aplikacji
COPY . .
# Debugowanie: Sprawdź, czy pliki modeli są poprawnie kopiowane
RUN echo "==== LISTOWANIE ZAWARTOŚCI KATALOGU MODELS ====" && \
    ls -la /usr/src/app/src/models && \
    echo "==== SPRAWDZENIE ISTNIEJĄCYCH TYPÓW IMPORTU ====" && \
    cat /usr/src/app/src/router.ts | grep "import.*from.*models"
# Kompilacja TypeScript do JavaScript
RUN npm run build
# --- Obraz produkcyjny ---
FROM node:18-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
# COPY pnpm-lock.yaml ./ # Jeśli używasz pnpm
# COPY bun.lockb ./ # Jeśli używasz Bun
# Instalujemy tylko zależności produkcyjne oraz ws
RUN npm install --production=false --legacy-peer-deps && npm install ws && npm prune --production
# Kopiujemy zbudowaną aplikację z etapu development
COPY --from=development /usr/src/app/dist ./dist
# Upewnij się, że port, na którym nasłuchuje aplikacja, jest zgodny z docker-compose.yml (domyślnie 3000)
EXPOSE ${PORT:-3000}
EXPOSE 5001
# Komenda do uruchomienia aplikacji - używamy skompilowanego JavaScript
CMD ["node", "dist/server.js"]
