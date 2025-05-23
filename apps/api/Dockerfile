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

# --- Etap build ---
FROM node:18-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# --- Etap produkcyjny ---
FROM node:18-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["node", "dist/server.js"] 