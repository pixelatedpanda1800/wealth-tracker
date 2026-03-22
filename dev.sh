#!/bin/bash

# Wealth Tracker Dev Script for Mac
# This script starts both the Backend (NestJS) and Frontend (Vite) in development mode.

# Get the absolute path of the project root
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Starting Wealth Tracker Dev Environment..."

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "👋 Shutting down dev environment..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# 1. Backend (NestJS)
echo "📦 Starting Backend (NestJS) on http://localhost:3000..."
(cd "$PROJECT_ROOT/backend" && npm install && npm run start:dev) &

# 2. Frontend (Vite)
echo "🌐 Starting Frontend (Vite) on http://localhost:5173..."
(cd "$PROJECT_ROOT/frontend" && npm install && npm run dev) &

echo "✨ Services are launching. Press Ctrl+C to stop both."

# Wait for background processes to finish
wait
