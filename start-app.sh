#!/bin/bash
set -e

echo "[APP] Waiting for PostgreSQL to be ready..."
until pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" -q; do
    sleep 1
done
echo "[APP] PostgreSQL is ready. Starting app..."

exec node dist/main
