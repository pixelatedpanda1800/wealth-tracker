# Stage 1: Build Frontend
FROM node:20-alpine AS builder-frontend
WORKDIR /app/frontend
# Copy dependency definitions
COPY frontend/package*.json ./
# Install deps
RUN npm ci
# Copy source
COPY frontend/ .
# Build React app
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS builder-backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Production Run
FROM node:20-alpine
WORKDIR /app

# Copy Backend production assets
COPY --from=builder-backend /app/backend/package*.json ./
COPY --from=builder-backend /app/backend/node_modules ./node_modules
COPY --from=builder-backend /app/backend/dist ./dist

# Copy Frontend build to 'client' folder where NestJS expects it
COPY --from=builder-frontend /app/frontend/dist ./client

# Expose port (Backend serves both)
EXPOSE 3000

CMD ["node", "dist/main"]
