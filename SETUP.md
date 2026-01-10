# Deployment Guide (Unraid / Docker)

This guide explains how to deploy the `wealth-tracker` on a personal server using **Docker Compose**.

> [!NOTE]
> This configuration merges Frontend and Backend into a single **App** container. The Database runs in a separate **DB** container.

## Prerequisites

- **Docker** and **Docker Compose** installed.
- On **Unraid**, use "Docker Compose Manager" or terminal.

## Setup Instructions

1. **Transfer Files**: Copy the project directory `wealth-tracker` to your server.

2. **Database Persistence**:
   - Edit `docker-compose.yml` to set the volume path for Postgres:
     ```yaml
     volumes:
       - /mnt/user/appdata/wealth-tracker/pgdata:/var/lib/postgresql/data
     ```

3. **Port Configuration**:
   - The app is exposed on port `3000`.
   - To change it (e.g., to 8080), edit `docker-compose.yml`:
     ```yaml
     ports:
       - '8080:3000'
     ```

## Running the Application

1. Open terminal in project directory.
2. Run:
   ```bash
   docker compose up -d --build
   ```

3. **Access**: Go to `http://<SERVER_IP>:3000`.
   - Frontend is served at `/`.
   - API is available at `/api`.

## Troubleshooting

- **Postgres Connection**: The app waits for the DB to be healthy. If it fails, check `docker logs wealth_tracker_app`.
- **Permissions**: Ensure the Postgres data directory is writable by the container user (usually UID 999).
