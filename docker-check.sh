#!/bin/bash

echo "=== Docker HRMS Setup Check ==="
echo ""

# Check if container is running
if ! docker ps | grep -q hrms-app; then
    echo "❌ Container hrms-app is not running"
    echo "   Start it with: docker-compose up -d"
    exit 1
fi

echo "✅ Container hrms-app is running"
echo ""

# Check DATABASE_URL
echo "Checking DATABASE_URL in container..."
DB_URL=$(docker exec hrms-app printenv DATABASE_URL)
echo "DATABASE_URL: $DB_URL"
echo ""

# Check if Prisma CLI is available
echo "Checking Prisma CLI..."
if docker exec hrms-app sh -c "command -v prisma" > /dev/null 2>&1; then
    echo "✅ Prisma CLI is available"
    PRISMA_VERSION=$(docker exec hrms-app prisma --version)
    echo "   Version: $PRISMA_VERSION"
else
    echo "❌ Prisma CLI not found"
    echo "   Trying npx..."
    if docker exec hrms-app sh -c "npx prisma --version" > /dev/null 2>&1; then
        echo "✅ Prisma available via npx"
    else
        echo "❌ Prisma not available via npx either"
    fi
fi
echo ""

# Check database connection
echo "Testing database connection..."
docker exec hrms-app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    prisma.\$disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.log('❌ Database connection failed:', e.message);
    process.exit(1);
  });
" 2>&1
echo ""

# Check Prisma schema
echo "Checking Prisma schema..."
if docker exec hrms-app test -f prisma/schema.prisma; then
    echo "✅ Prisma schema file exists"
    SCHEMA_LINES=$(docker exec hrms-app wc -l < prisma/schema.prisma)
    echo "   Schema has $SCHEMA_LINES lines"
else
    echo "❌ Prisma schema file not found"
fi
echo ""

# Check if Prisma Client is generated
echo "Checking Prisma Client..."
if docker exec hrms-app test -d node_modules/.prisma; then
    echo "✅ Prisma Client directory exists"
else
    echo "⚠️  Prisma Client directory not found - needs generation"
fi
echo ""

echo "=== Recommendations ==="
echo ""
echo "If Prisma Client is missing, run:"
echo "  docker exec -it hrms-app prisma generate"
echo ""
echo "If you need to pull schema from database, run:"
echo "  docker exec -it hrms-app prisma db pull"
echo ""
echo "To view container logs:"
echo "  docker-compose logs -f app"
echo ""

