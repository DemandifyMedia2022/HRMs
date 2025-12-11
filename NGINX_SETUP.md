# Nginx Setup Guide for HRMS

This guide explains how to set up nginx to serve the HRMS application on port 8000.

## Option 1: Using Docker Compose (Recommended)

The `docker-compose.yml` file has been configured to include nginx. Simply run:

```bash
docker-compose up -d
```

This will:
- Start the HRMS app on port 3000 (internal, not exposed)
- Start nginx on port 8000 (publicly accessible)
- Nginx will proxy all requests to the app

Access the application at: `http://localhost:8000` or `http://your-server-ip:8000`

## Option 2: Standalone Nginx on Server

If you prefer to run nginx directly on your server (not in Docker):

### Step 1: Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# or
sudo dnf install nginx
```

### Step 2: Copy Configuration

```bash
# Copy the standalone config
sudo cp nginx-standalone.conf /etc/nginx/conf.d/hrms.conf

# Or for sites-available/sites-enabled structure:
sudo cp nginx-standalone.conf /etc/nginx/sites-available/hrms
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
```

### Step 3: Update Configuration

Edit `/etc/nginx/conf.d/hrms.conf` (or `/etc/nginx/sites-available/hrms`) and update:

```nginx
upstream hrms_backend {
    server localhost:3000;  # Change if your app runs on different port
    keepalive 64;
}
```

If your app is running in Docker and exposed on a different port, update accordingly:
```nginx
upstream hrms_backend {
    server localhost:3000;  # Or docker container IP:port
    keepalive 64;
}
```

### Step 4: Test Configuration

```bash
sudo nginx -t
```

### Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
# or
sudo service nginx reload
```

### Step 6: Enable Nginx (if not already)

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Configuration Features

The nginx configuration includes:

1. **Port 8000**: Application accessible on port 8000
2. **Rate Limiting**: 
   - API endpoints: 10 requests/second
   - Login endpoint: 5 requests/minute
3. **Gzip Compression**: Enabled for better performance
4. **Static File Caching**: Optimized caching for Next.js static assets
5. **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
6. **File Upload Support**: Up to 50MB file size
7. **WebSocket Support**: For real-time features
8. **Health Check**: `/health` endpoint for monitoring

## Firewall Configuration

If using a firewall, allow port 8000:

```bash
# UFW (Ubuntu)
sudo ufw allow 8000/tcp

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
```

## SSL/HTTPS Setup (Optional but Recommended)

For production, set up SSL with Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

Then update the nginx config to redirect HTTP to HTTPS and use port 443.

## Troubleshooting

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Test Connection

```bash
# Test from server
curl http://localhost:8000/health

# Test from remote
curl http://your-server-ip:8000/health
```

### Common Issues

1. **Port already in use**: Check if port 8000 is available
   ```bash
   sudo netstat -tulpn | grep 8000
   ```

2. **Permission denied**: Ensure nginx has permission to bind to port 8000
   ```bash
   # For ports < 1024, nginx needs root or capabilities
   # Port 8000 should work without special permissions
   ```

3. **502 Bad Gateway**: App not running or wrong upstream address
   - Check if app is running: `docker ps` or `ps aux | grep node`
   - Verify upstream address in nginx config

4. **Connection refused**: Firewall blocking or app not listening
   - Check firewall rules
   - Verify app is listening on the correct port

## Docker Compose Commands

```bash
# Start all services (app + nginx)
docker-compose up -d

# View logs
docker-compose logs -f nginx
docker-compose logs -f app

# Restart nginx
docker-compose restart nginx

# Stop all services
docker-compose down
```

## Environment Variables

Update your `.env` file to reflect the new port:

```env
NEXT_PUBLIC_BASE_URL=http://your-server-ip:8000
NEXT_PUBLIC_APP_URL=http://your-server-ip:8000
BASE_URL=http://your-server-ip:8000
```

After updating, restart the app:
```bash
docker-compose restart app
```

