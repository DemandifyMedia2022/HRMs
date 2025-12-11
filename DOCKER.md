# Docker Setup Guide

This guide explains how to run the HRMS application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

### 1. Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:
- `DATABASE_URL`: Your MySQL database connection string
- `NEXT_PUBLIC_BASE_URL`: Your application's public URL
- `NEXT_PUBLIC_APP_URL`: Your application's app URL
- Other environment variables as needed

### 2. Using Docker Compose (Recommended)

This method will start both the application and MySQL database:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

The application will be available at `http://localhost:3000`

### 3. Using Docker Only

If you have an external database:

```bash
# Build the image
docker build -t hrms-app .

# Run the container
docker run -d \
  --name hrms-app \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  hrms-app
```

## Prisma Database Setup

The Docker setup automatically handles Prisma operations:

1. **During Build**: `prisma generate` is run to generate the Prisma Client
2. **During Startup**: The entrypoint script automatically:
   - Waits for the database to be ready
   - Generates Prisma Client (to ensure it's up to date)
   - Runs migrations (if they exist)
   - Optionally pulls database schema (if `PRISMA_DB_PULL=true` is set)

### Automatic Prisma Operations

By default, the container will:
- Generate Prisma Client on startup
- Run any pending migrations

### Pulling Database Schema

If you want to pull the database schema on startup, set the environment variable:

```bash
# In docker-compose.yml or .env file
PRISMA_DB_PULL=true
```

Or when running with docker:

```bash
docker run -d \
  --name hrms-app \
  -p 3000:3000 \
  -e PRISMA_DB_PULL=true \
  --env-file .env \
  hrms-app
```

### Manual Prisma Commands

If you need to run Prisma commands manually:

```bash
# Access the container
docker exec -it hrms-app sh

# Pull database schema
prisma db pull

# Generate Prisma Client
prisma generate

# Run migrations
prisma migrate deploy

# View Prisma Studio (if needed)
prisma studio
```

Or from the host:

```bash
# Pull database schema
docker exec -it hrms-app prisma db pull

# Generate Prisma Client
docker exec -it hrms-app prisma generate

# Run migrations
docker exec -it hrms-app prisma migrate deploy
```

## Database Connection

When using `docker-compose.yml`, the database connection string should be:

```
DATABASE_URL="mysql://hrms_user:hrms_password@db:3306/hrms"
```

Note: Use `db` as the hostname (the service name) instead of `localhost` when connecting from the app container.

## Troubleshooting

### Container won't start

1. Check logs: `docker-compose logs app`
2. Verify `.env` file exists and has correct values
3. Ensure port 3000 is not already in use

### Database connection errors

1. Verify `DATABASE_URL` in `.env` is correct
2. If using docker-compose, ensure the database service is running: `docker-compose ps`
3. Check database health: `docker-compose logs db`

### Prisma errors

1. Check container logs: `docker-compose logs app` or `docker logs hrms-app`
2. Ensure Prisma Client is generated: `docker exec -it hrms-app prisma generate`
3. Verify database schema matches: `docker exec -it hrms-app prisma db pull`
4. Check if database is accessible: `docker exec -it hrms-app prisma db execute --stdin <<< "SELECT 1"`

## Production Considerations

1. **Environment Variables**: Never commit `.env` file. Use Docker secrets or environment variable injection in production.

2. **Database**: For production, use a managed database service instead of the containerized MySQL.

3. **Volumes**: The `uploads` directory is mounted as a volume. Ensure proper backups.

4. **Security**: 
   - Change default database passwords
   - Use strong passwords for production
   - Enable SSL for database connections

5. **Performance**: 
   - Consider using a reverse proxy (nginx) in front of the app
   - Enable database connection pooling
   - Use CDN for static assets

## Building for Production

```bash
# Build with no cache
docker build --no-cache -t hrms-app:latest .

# Tag for registry
docker tag hrms-app:latest your-registry/hrms-app:latest

# Push to registry
docker push your-registry/hrms-app:latest
```

