# Installation & Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

#### 1. Node.js
- **Version**: 20.x or higher
- **Download**: https://nodejs.org/
- **Verification**:
  ```bash
  node --version
  # Should output: v20.x.x or higher
  ```

#### 2. npm (Node Package Manager)
- **Version**: 10.x or higher
- **Comes with Node.js**
- **Verification**:
  ```bash
  npm --version
  # Should output: 10.x.x or higher
  ```

#### 3. MySQL
- **Version**: 8.0 or higher
- **Download**: https://dev.mysql.com/downloads/mysql/
- **Verification**:
  ```bash
  mysql --version
  # Should output: mysql Ver 8.0.x
  ```

#### 4. Git
- **Version**: Latest
- **Download**: https://git-scm.com/
- **Verification**:
  ```bash
  git --version
  ```

### Optional Software

#### 1. Redis (Recommended for Production)
- **Version**: 6.x or higher
- **Download**: https://redis.io/download
- **Purpose**: Caching and session management
- **Verification**:
  ```bash
  redis-cli --version
  ```

#### 2. PM2 (Process Manager for Production)
- **Installation**:
  ```bash
  npm install -g pm2
  ```
- **Purpose**: Process management and monitoring

---

## System Requirements

### Development Environment

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 10 GB | 20+ GB |
| OS | Windows 10, macOS 10.15, Ubuntu 20.04 | Latest versions |

### Production Environment

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Storage | 50 GB SSD | 100+ GB SSD |
| OS | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS |
| Network | 100 Mbps | 1 Gbps |

---

## Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url> hrms
cd hrms
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - Next.js and React
# - Prisma ORM
# - All UI libraries
# - All dependencies listed in package.json
```

**Expected Output**:
```
added 1234 packages in 45s
```

### Step 3: Verify Installation

```bash
# Check if all packages are installed
npm list --depth=0

# Should show all dependencies without errors
```

---

## Database Setup

### Step 1: Create MySQL Database

#### Option A: Using MySQL Command Line

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, for security)
CREATE USER 'hrms_user'@'localhost' IDENTIFIED BY 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON hrms.* TO 'hrms_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Click "Create New Schema" icon
4. Name: `hrms`
5. Character Set: `utf8mb4`
6. Collation: `utf8mb4_unicode_ci`
7. Click "Apply"

### Step 2: Configure Database Connection

Create a `.env` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env

# Or create manually
touch .env
```

Edit `.env` and add your database connection:

```env
DATABASE_URL="mysql://username:password@localhost:3306/hrms"
```

**Format Explanation**:
```
mysql://[username]:[password]@[host]:[port]/[database_name]
```

**Example**:
```env
DATABASE_URL="mysql://hrms_user:secure_password@localhost:3306/hrms"
```

### Step 3: Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# Or for development (creates migration files)
npx prisma migrate dev
```

**Expected Output**:
```
✔ Generated Prisma Client
✔ Applied 1 migration(s)
```

### Step 4: Verify Database Setup

```bash
# Open Prisma Studio to view database
npx prisma studio

# This opens a browser at http://localhost:5555
# You should see all tables created
```

### Step 5: Seed Initial Data (Optional)

If you have a seed script:

```bash
npx prisma db seed
```

Or manually insert an admin user:

```sql
INSERT INTO users (
  Full_name, 
  email, 
  password, 
  type, 
  department,
  emp_code,
  created_at,
  updated_at
) VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$10$hashed_password_here', -- Use bcrypt to hash
  'admin',
  'administration',
  'EMP001',
  NOW(),
  NOW()
);
```

---

## Environment Configuration

### Complete .env File Template

Create a `.env` file with the following configuration:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="mysql://username:password@localhost:3306/hrms"

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
REFRESH_TOKEN_EXPIRES_IN="30d"

# ============================================
# APPLICATION SETTINGS
# ============================================
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
PORT=3000

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="HRMS <noreply@yourcompany.com>"

# ============================================
# REDIS CONFIGURATION (Optional)
# ============================================
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# ============================================
# FILE UPLOAD SETTINGS
# ============================================
MAX_FILE_SIZE="10485760"  # 10MB in bytes
UPLOAD_DIR="./public/uploads"

# ============================================
# VOIP/SIP CONFIGURATION
# ============================================
SIP_SERVER="sip.yourprovider.com"
SIP_PORT="5060"
SIP_DOMAIN="yourcompany.com"

# ============================================
# BIOMETRIC INTEGRATION (ESSL)
# ============================================
ESSL_API_URL="http://biometric-device-ip/api"
ESSL_API_KEY="your-essl-api-key"

# ============================================
# SECURITY SETTINGS
# ============================================
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"  # 15 minutes in ms
BCRYPT_ROUNDS="10"

# ============================================
# LOGGING
# ============================================
LOG_LEVEL="info"  # error, warn, info, debug
LOG_FILE="./logs/app.log"
```

### Environment Variable Descriptions

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MySQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |
| `JWT_EXPIRES_IN` | Access token expiration | Yes | 15m |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | Yes | 30d |
| `NODE_ENV` | Environment mode | Yes | development |
| `NEXT_PUBLIC_API_URL` | Public API URL | Yes | http://localhost:3000 |
| `PORT` | Application port | No | 3000 |
| `SMTP_HOST` | Email server host | No | - |
| `SMTP_PORT` | Email server port | No | 587 |
| `SMTP_USER` | Email username | No | - |
| `SMTP_PASS` | Email password | No | - |
| `REDIS_URL` | Redis connection URL | No | - |

### Generating Secure Secrets

```bash
# Generate JWT secrets using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

---

## Running the Application

### Development Mode

```bash
# Start development server with hot reload
npm run dev

# Application will start at http://localhost:3000
```

**Expected Output**:
```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.5s
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start npm --name "hrms" -- start

# View logs
pm2 logs hrms

# Monitor
pm2 monit

# Restart
pm2 restart hrms

# Stop
pm2 stop hrms

# Auto-start on system boot
pm2 startup
pm2 save
```

### Accessing the Application

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Login Page**: You should see the login screen
3. **Default Credentials**: Use the admin credentials you created

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Port Already in Use

**Error**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### Issue 2: Database Connection Failed

**Error**:
```
Error: P1001: Can't reach database server
```

**Solutions**:
1. Verify MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux
   sudo systemctl status mysql
   sudo systemctl start mysql
   ```

2. Check DATABASE_URL in `.env`
3. Verify credentials:
   ```bash
   mysql -u username -p
   ```

4. Check firewall settings

#### Issue 3: Prisma Client Not Generated

**Error**:
```
Error: @prisma/client did not initialize yet
```

**Solution**:
```bash
# Generate Prisma Client
npx prisma generate

# Restart application
npm run dev
```

#### Issue 4: Module Not Found

**Error**:
```
Error: Cannot find module 'xyz'
```

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or
npm ci
```

#### Issue 5: Build Errors

**Error**:
```
Error: Build failed
```

**Solutions**:
1. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run build
   ```

2. Check TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

3. Check ESLint errors:
   ```bash
   npm run lint
   ```

#### Issue 6: Environment Variables Not Loading

**Solution**:
1. Ensure `.env` file is in project root
2. Restart development server
3. Check for syntax errors in `.env`
4. Don't use quotes for values (unless they contain spaces)

#### Issue 7: Redis Connection Failed

**Error**:
```
Error: Redis connection failed
```

**Solutions**:
1. Make Redis optional in code
2. Start Redis server:
   ```bash
   # Windows
   redis-server
   
   # Linux
   sudo systemctl start redis
   ```
3. Comment out Redis configuration if not needed

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Application builds successfully
- [ ] All tests passing
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Backup strategy in place
- [ ] Monitoring tools configured

### Deployment Steps

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server

# Install Redis (optional)
sudo apt install redis-server

# Install Nginx (reverse proxy)
sudo apt install nginx

# Install PM2
sudo npm install -g pm2
```

#### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url> /var/www/hrms
cd /var/www/hrms

# Install dependencies
npm ci --production

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start npm --name "hrms" -- start
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

Create `/etc/nginx/sites-available/hrms`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### 5. Firewall Configuration

```bash
# Allow HTTP, HTTPS, SSH
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Post-Deployment

#### 1. Verify Deployment

```bash
# Check application status
pm2 status

# Check logs
pm2 logs hrms

# Test application
curl http://localhost:3000/api/status
```

#### 2. Setup Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate

# Setup log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### 3. Database Backup

```bash
# Create backup script
nano /usr/local/bin/backup-hrms-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/hrms"
mkdir -p $BACKUP_DIR

mysqldump -u username -p'password' hrms > $BACKUP_DIR/hrms_$DATE.sql
gzip $BACKUP_DIR/hrms_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
# Make executable
chmod +x /usr/local/bin/backup-hrms-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /usr/local/bin/backup-hrms-db.sh
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
pm2 logs hrms --lines 100

# Monitor resources
pm2 monit
```

### Database Management

```bash
# Backup database
mysqldump -u username -p hrms > backup.sql

# Restore database
mysql -u username -p hrms < backup.sql

# Run migrations
npx prisma migrate deploy

# View database
npx prisma studio
```

### Updates and Upgrades

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild application
npm run build

# Restart
pm2 restart hrms
```

---

## Health Checks

### Application Health

```bash
# Check if application is running
curl http://localhost:3000/api/status

# Expected response:
# {"status":"ok","timestamp":"2025-11-13T..."}
```

### Database Health

```bash
# Check MySQL status
sudo systemctl status mysql

# Check connections
mysql -u username -p -e "SHOW PROCESSLIST;"
```

### System Health

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top
```

---

## Support and Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- React: https://react.dev

### Community
- GitHub Issues: <repository-url>/issues
- Internal Wiki: <wiki-url>

### Contact
- Technical Support: tech-support@yourcompany.com
- Development Team: dev-team@yourcompany.com

---

## Document Version
- **Version**: 1.0
- **Last Updated**: November 13, 2025
- **Author**: Development Team
