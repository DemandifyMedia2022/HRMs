# Quick Start Guide - HRMS with Nginx on Port 8000

## Quick Start (Docker Compose)

1. **Update environment variables** in `.env`:
   ```env
   NEXT_PUBLIC_BASE_URL=http://your-server-ip:8000
   NEXT_PUBLIC_APP_URL=http://your-server-ip:8000
   BASE_URL=http://your-server-ip:8000
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - URL: `http://your-server-ip:8000`
   - Health check: `http://your-server-ip:8000/health`

## Services

- **Nginx**: Port 8000 (public)
- **HRMS App**: Port 3000 (internal, proxied by nginx)
- **Database**: External (configured via DATABASE_URL)

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# View nginx logs
docker-compose logs -f nginx

# View app logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Port Configuration

- **Port 8000**: Public access (nginx)
- **Port 3000**: Internal only (app, not exposed externally)

Make sure port 8000 is open in your firewall:
```bash
# UFW
sudo ufw allow 8000/tcp

# firewalld
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

