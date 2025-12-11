#!/bin/sh
set -e

echo "Starting HRMS application..."

# Ensure PATH includes npm global bin directory
export PATH="/usr/local/bin:$PATH"

# Check if prisma is available
if ! command -v prisma > /dev/null 2>&1; then
  echo "Warning: Prisma CLI not found in PATH. Trying npx..."
  PRISMA_CMD="npx prisma"
else
  PRISMA_CMD="prisma"
fi

# Wait for database to be ready (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database connection..."
  max_attempts=30
  attempt=0
  
  # Simple connection test using mysql client if available, otherwise use node
  if command -v mysql > /dev/null 2>&1; then
    # Extract connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    until mysqladmin ping -h "$DB_HOST" -P "${DB_PORT:-3306}" --silent 2>/dev/null; do
      attempt=$((attempt + 1))
      if [ $attempt -ge $max_attempts ]; then
        echo "Database connection timeout after $max_attempts attempts"
        exit 1
      fi
      echo "Database is unavailable - sleeping (attempt $attempt/$max_attempts)"
      sleep 2
    done
  else
    # Fallback: try to connect using Prisma
    until node -e "
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect().then(() => {
          prisma.\$disconnect();
          process.exit(0);
        }).catch(() => process.exit(1));
      } catch(e) {
        process.exit(1);
      }
    " > /dev/null 2>&1; do
      attempt=$((attempt + 1))
      if [ $attempt -ge $max_attempts ]; then
        echo "Database connection timeout after $max_attempts attempts"
        exit 1
      fi
      echo "Database is unavailable - sleeping (attempt $attempt/$max_attempts)"
      sleep 2
    done
  fi
  echo "Database is ready!"
fi

# Set up npx cache directory to avoid permission issues
export NPX_CACHE_DIR=/tmp/.npx
mkdir -p $NPX_CACHE_DIR

# Pull database schema if PRISMA_DB_PULL is set to true
if [ "$PRISMA_DB_PULL" = "true" ]; then
  echo "Pulling database schema..."
  npx --yes --cache $NPX_CACHE_DIR prisma@6.17.0 db pull || echo "Warning: Could not pull database schema. Continuing..."
fi

# Generate Prisma Client (always run to ensure it's up to date)
echo "Generating Prisma Client..."
npx --yes --cache $NPX_CACHE_DIR prisma@6.17.0 generate || {
  echo "Error: Prisma Client generation failed. Please check your database connection and schema."
  exit 1
}

# Run migrations if they exist
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Running database migrations..."
  npx --yes --cache $NPX_CACHE_DIR prisma@6.17.0 migrate deploy || echo "Warning: Migration failed. Continuing..."
fi

# Start the application
echo "Starting Next.js application..."
exec node server.js

