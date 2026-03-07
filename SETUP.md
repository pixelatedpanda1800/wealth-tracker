# Deployment Guide (Unraid / Docker)

This guide explains how to deploy the `wealth-tracker` on a personal server using **Docker Compose**.

> [!NOTE]
> This configuration embeds the Frontend, Backend, and Database into a **single Docker image**.

## Prerequisites

- **Docker** and **Docker Compose** installed.
- On **Unraid**, use "Docker Compose Manager" or terminal.

## Setup Instructions

1. **Transfer Files**: Copy the project directory `wealth-tracker` to your server.

2. **Database Persistence**:
   - The Database (Postgres) runs inside the single container securely.
   - All data is persisted to a Docker volume across rebuilds and updates.
   - Edit `docker-compose.yml` to set the volume path if you prefer a host binding for backup simplicity:
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

4. **Updating**:
   - To update, pull the new code and run `docker compose up -d --build` again. Your database data persists safely on the volume.

## Troubleshooting

- **Check Logs**: If you have issues, use `docker logs wealth_tracker`.
- **First Run**: The first run will automatically initialize the Postgres database. Depending on hardware performance, the app might take an extra couple of seconds to connect.
- **Permissions**: Ensure the volume directory can be written to. The container ensures `/var/lib/postgresql/data` internal directory has `postgres:postgres` ownership.
