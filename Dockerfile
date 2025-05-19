# apps/api/Dockerfile
FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Copy package.json and lock files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for building)
RUN npm install --legacy-peer-deps && npm install ws @types/ws

# Copy the rest of the application code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# --- Production image ---
FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --production=false --legacy-peer-deps && npm install ws && npm prune --production

# Copy the built application from development stage
COPY --from=development /usr/src/app/dist ./dist

# Ensure ports are exposed
EXPOSE ${PORT:-3000}
EXPOSE 5001

# Command to run the application - using compiled JavaScript
CMD ["node", "dist/server.js"]
