#!/bin/bash
set -e

APP_NAME="mashed-game"
echo "🚀 Deploying Mashed..."

# Pull latest code
echo "📥 Pulling latest from git..."
git pull origin main

# Build Docker image
echo "🔨 Building Docker image..."
docker compose build --no-cache

# Stop old container
echo "🛑 Stopping old container..."
docker compose down || true

# Start new container
echo "▶️ Starting new container..."
docker compose up -d

# Health check
echo "🏥 Running health check..."
sleep 3
for i in {1..10}; do
  if curl -sf http://localhost:80/api/health > /dev/null 2>&1; then
    echo "✅ Mashed is up and healthy!"
    docker compose logs --tail=5
    exit 0
  fi
  echo "  Waiting... ($i/10)"
  sleep 2
done

echo "❌ Health check failed!"
docker compose logs --tail=20
exit 1
