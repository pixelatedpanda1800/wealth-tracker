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
# Prune dev dependencies to reduce image size
RUN npm prune --production

# Stage 3: Production Run
FROM node:20-bookworm-slim
WORKDIR /app

# Install PostgreSQL 15 and Supervisor
RUN apt-get update && apt-get install -y gnupg2 wget lsb-release && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y postgresql-15 supervisor procps && \
    rm -rf /var/lib/apt/lists/*

# Fix postgresql configuration locations and ensure run dirs exist
RUN mkdir -p /var/run/postgresql && chown -R postgres:postgres /var/run/postgresql && \
    mkdir -p /var/log/postgresql && chown -R postgres:postgres /var/log/postgresql

# Data directory for Postgres
ENV PGDATA=/var/lib/postgresql/data
RUN mkdir -p $PGDATA && chown -R postgres:postgres $PGDATA

# Copy Backend production assets
COPY --from=builder-backend /app/backend/package*.json ./
COPY --from=builder-backend /app/backend/node_modules ./node_modules
COPY --from=builder-backend /app/backend/dist ./dist

# Copy Frontend build to 'client' folder where NestJS expects it
COPY --from=builder-frontend /app/frontend/dist ./client

# Copy configs and scripts
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Persist DB data
VOLUME /var/lib/postgresql/data

# Expose port (Backend serves both)
EXPOSE 3000

ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=postgres
ENV DB_DATABASE=wealth_tracker

ENTRYPOINT ["/app/docker-entrypoint.sh"]
