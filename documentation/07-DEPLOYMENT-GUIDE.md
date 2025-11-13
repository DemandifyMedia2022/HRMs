# Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Requirements](#server-requirements)
3. [Production Environment Setup](#production-environment-setup)
4. [Application Deployment](#application-deployment)
5. [Database Migration](#database-migration)
6. [SSL Configuration](#ssl-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Rollback Procedures](#rollback-procedures)
10. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All features tested in staging environment
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Security vulnerabilities addressed
- [ ] Performance optimization completed
- [ ] Documentation updated

### Environment Preparation

- [ ] Production server provisioned
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Database server ready
- [ ] Redis server configured (if using)
- [ ] Backup system in place
- [ ] Monitoring tools configured

### Configuration

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Email service configured
- [ ] External API keys set up
- [ ] Security settings reviewed
- [ ] Rate limiting configured

---

## Server Requirements

### Minimum Requirements

**Application Server**:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- OS: Ubuntu 20.04 LTS or higher
- Network: 100 Mbps

**Database Server**:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 100 GB SSD
- OS: Ubuntu 20.04 LTS or higher

### Recommended Requirements

**Application Server**:
- CPU: 8 cores
- RAM: 16 GB
- Storage: 100 GB SSD
- OS: Ubuntu 22.04 LTS
- Network: 1 Gbps

**Database Server**:
- CPU: 8 cores
- RAM: 16 GB
- Storage: 200 GB SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

- Node.js 20.x or higher
- MySQL 8.0 or higher
- Nginx (reverse proxy)
- PM2 (process manager)
- Redis 6.x or higher (optional)
- Git

---

## Production Environment Setup

### Step 1: Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Create application user
sudo adduser --disabled-password --gecos "" hrms
sudo usermod -aG sudo hrms
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install MySQL

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql

# Create database and user
CREATE DATABASE hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hrms_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON hrms.* TO 'hrms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Install Redis (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: supervised systemd
# Set: bind 127.0.0.1

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Test Redis
redis-cli ping  # Should return PONG
```

### Step 5: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Test Nginx
curl http://localhost  # Should return Nginx welcome page
```

### Step 6: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Switch to application user
sudo su - hrms

# Create application directory
mkdir -p /home/hrms/app
cd /home/hrms/app

# Clone repository
git clone <repository-url> .

# Or upload files via SCP/SFTP
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
npm ci --production

# Install Prisma CLI (needed for migrations)
npm install prisma --save-dev
```

### Step 3: Configure Environment

```bash
# Create .env file
nano .env
```

**Production .env Configuration**:
```env
# Database
DATABASE_URL="mysql://hrms_user:STRONG_PASSWORD@localhost:3306/hrms"

# JWT Secrets (Generate using: openssl rand -hex 64)
JWT_SECRET="your-production-jwt-secret-64-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-production-refresh-secret-64-chars"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Application
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://your-domain.com"
PORT=3000

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="HRMS <noreply@yourcompany.com>"

# Redis
REDIS_URL="redis://localhost:6379"

# Security
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"
BCRYPT_ROUNDS="10"

# Logging
LOG_LEVEL="info"
LOG_FILE="/home/hrms/logs/app.log"
```

### Step 4: Build Application

```bash
# Generate Prisma Client
npx prisma generate

# Build Next.js application
npm run build

# Verify build
ls -la .next/
```

### Step 5: Start Application with PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'hrms',
    script: 'npm',
    args: 'start',
    cwd: '/home/hrms/app',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/hrms/logs/pm2-error.log',
    out_file: '/home/hrms/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

```bash
# Create logs directory
mkdir -p /home/hrms/logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided

# Check status
pm2 status
pm2 logs hrms
```

---

## Database Migration

### Step 1: Backup Existing Database (if applicable)

```bash
# Create backup directory
mkdir -p /home/hrms/backups

# Backup database
mysqldump -u hrms_user -p hrms > /home/hrms/backups/hrms_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Migrations

```bash
cd /home/hrms/app

# Run Prisma migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

### Step 3: Seed Initial Data (if needed)

```bash
# Run seed script
npx prisma db seed

# Or manually insert admin user
mysql -u hrms_user -p hrms
```

```sql
-- Insert admin user (password should be hashed with bcrypt)
INSERT INTO users (
  Full_name, email, password, type, department, 
  emp_code, created_at, updated_at
) VALUES (
  'System Admin',
  'admin@yourcompany.com',
  '$2a$10$hashed_password_here',
  'admin',
  'administration',
  'ADMIN001',
  NOW(),
  NOW()
);
```

---

## SSL Configuration

### Step 1: Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/hrms
```

**Nginx Configuration**:
```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy Settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # File upload size limit
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/hrms_access.log;
    error_log /var/log/nginx/hrms_error.log;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 3: Obtain SSL Certificate

```bash
# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (2)

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Step 1: Setup PM2 Monitoring

```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Step 2: Setup Application Logging

```bash
# Create log directory
mkdir -p /home/hrms/logs

# Set permissions
chmod 755 /home/hrms/logs
```

### Step 3: Setup System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor PM2 processes
pm2 monit

# View logs
pm2 logs hrms --lines 100
```

### Step 4: Setup Nginx Logging

```bash
# View access logs
sudo tail -f /var/log/nginx/hrms_access.log

# View error logs
sudo tail -f /var/log/nginx/hrms_error.log

# Setup log rotation
sudo nano /etc/logrotate.d/nginx
```

---

## Backup Strategy

### Automated Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-hrms-db.sh
```

**Backup Script**:
```bash
#!/bin/bash

# Configuration
DB_USER="hrms_user"
DB_PASS="your_password"
DB_NAME="hrms"
BACKUP_DIR="/home/hrms/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/hrms_$DATE.sql.gz

# Remove old backups
find $BACKUP_DIR -name "hrms_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log backup
echo "$(date): Database backup completed - hrms_$DATE.sql.gz" >> /home/hrms/logs/backup.log
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-hrms-db.sh

# Test backup
sudo /usr/local/bin/backup-hrms-db.sh

# Schedule daily backup (2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-hrms-db.sh
```

### Application Files Backup

```bash
# Create application backup script
sudo nano /usr/local/bin/backup-hrms-files.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/hrms/backups/files"
APP_DIR="/home/hrms/app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup uploads and documents
tar -czf $BACKUP_DIR/hrms_files_$DATE.tar.gz \
  $APP_DIR/public/uploads \
  $APP_DIR/public/complaint_attachments \
  $APP_DIR/.env

# Remove old backups (30 days)
find $BACKUP_DIR -name "hrms_files_*.tar.gz" -mtime +30 -delete

echo "$(date): Files backup completed" >> /home/hrms/logs/backup.log
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-hrms-files.sh

# Schedule weekly backup (Sunday 3 AM)
sudo crontab -e
# Add: 0 3 * * 0 /usr/local/bin/backup-hrms-files.sh
```

---

## Rollback Procedures

### Application Rollback

```bash
# Stop application
pm2 stop hrms

# Backup current version
cd /home/hrms
mv app app_backup_$(date +%Y%m%d_%H%M%S)

# Restore previous version
git clone <repository-url> app
cd app
git checkout <previous-commit-hash>

# Install dependencies
npm ci --production

# Build application
npm run build

# Start application
pm2 start ecosystem.config.js
pm2 save
```

### Database Rollback

```bash
# Stop application
pm2 stop hrms

# Restore database from backup
mysql -u hrms_user -p hrms < /home/hrms/backups/database/hrms_YYYYMMDD_HHMMSS.sql.gz

# Start application
pm2 start hrms
```

---

## Post-Deployment Verification

### Step 1: Health Checks

```bash
# Check application status
pm2 status

# Check application logs
pm2 logs hrms --lines 50

# Test application endpoint
curl http://localhost:3000/api/status

# Test HTTPS
curl https://your-domain.com/api/status
```

### Step 2: Functional Testing

1. **Login Test**:
   - Navigate to https://your-domain.com
   - Login with admin credentials
   - Verify successful login

2. **Database Connection**:
   - Check if data loads correctly
   - Verify CRUD operations work

3. **API Endpoints**:
   - Test critical API endpoints
   - Verify authentication works

4. **File Uploads**:
   - Test file upload functionality
   - Verify files are stored correctly

### Step 3: Performance Testing

```bash
# Check response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Monitor resource usage
htop
pm2 monit
```

### Step 4: Security Verification

```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Verify security headers
curl -I https://your-domain.com

# Check firewall status
sudo ufw status
```

---

## Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow MySQL (only from localhost)
sudo ufw deny 3306/tcp

# Check status
sudo ufw status verbose
```

---

## Maintenance Commands

### Application Management

```bash
# Restart application
pm2 restart hrms

# Stop application
pm2 stop hrms

# View logs
pm2 logs hrms

# Monitor resources
pm2 monit

# Flush logs
pm2 flush
```

### Database Management

```bash
# Backup database
mysqldump -u hrms_user -p hrms > backup.sql

# Restore database
mysql -u hrms_user -p hrms < backup.sql

# Optimize database
mysqlcheck -u hrms_user -p --optimize hrms
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /home/hrms/app
npm update

# Rebuild application
npm run build

# Restart application
pm2 restart hrms
```

---

## Document Version
- **Version**: 1.0
- **Last Updated**: November 13, 2025
- **Author**: Development Team
