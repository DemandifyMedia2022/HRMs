# Maintenance & Support Guide

## Table of Contents
1. [Routine Maintenance](#routine-maintenance)
2. [System Monitoring](#system-monitoring)
3. [Backup & Recovery](#backup--recovery)
4. [Performance Optimization](#performance-optimization)
5. [Security Updates](#security-updates)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Support Procedures](#support-procedures)
8. [Emergency Procedures](#emergency-procedures)

---

## Routine Maintenance

### Daily Tasks

#### 1. System Health Check
```bash
# Check application status
pm2 status

# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h
```

#### 2. Log Review
```bash
# Check application logs
pm2 logs hrms --lines 100

# Check Nginx error logs
sudo tail -n 100 /var/log/nginx/hrms_error.log

# Check MySQL error logs
sudo tail -n 100 /var/log/mysql/error.log
```

#### 3. Database Health
```bash
# Check MySQL status
sudo systemctl status mysql

# Check database connections
mysql -u hrms_user -p -e "SHOW PROCESSLIST;"

# Check database size
mysql -u hrms_user -p -e "
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'hrms'
GROUP BY table_schema;
"
```

### Weekly Tasks

#### 1. Backup Verification
```bash
# Verify latest backup exists
ls -lh /home/hrms/backups/database/ | head -n 5

# Test backup restoration (on test server)
mysql -u test_user -p test_db < latest_backup.sql
```

#### 2. Performance Review
```bash
# Check slow queries
mysql -u hrms_user -p -e "
SELECT * FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 10;
"

# Check PM2 metrics
pm2 describe hrms
```

#### 3. Security Scan
```bash
# Check for failed login attempts
grep "Failed password" /var/log/auth.log | tail -n 20

# Check firewall status
sudo ufw status verbose

# Review Nginx access logs for suspicious activity
sudo grep -E "404|500" /var/log/nginx/hrms_access.log | tail -n 50
```

### Monthly Tasks

#### 1. System Updates
```bash
# Update system packages
sudo apt update
sudo apt list --upgradable
sudo apt upgrade -y

# Update Node.js packages
cd /home/hrms/app
npm outdated
npm update

# Rebuild application
npm run build
pm2 restart hrms
```

#### 2. Database Optimization
```bash
# Optimize all tables
mysqlcheck -u hrms_user -p --optimize hrms

# Analyze tables
mysqlcheck -u hrms_user -p --analyze hrms

# Check and repair tables
mysqlcheck -u hrms_user -p --check --auto-repair hrms
```

#### 3. Log Rotation
```bash
# Rotate PM2 logs
pm2 flush

# Rotate Nginx logs
sudo logrotate -f /etc/logrotate.d/nginx

# Archive old logs
cd /home/hrms/logs
tar -czf archive_$(date +%Y%m).tar.gz *.log
rm *.log
```

#### 4. SSL Certificate Check
```bash
# Check certificate expiration
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

### Quarterly Tasks

#### 1. Full System Audit
- Review user accounts and permissions
- Check for unused dependencies
- Review and update documentation
- Conduct security audit
- Performance benchmarking

#### 2. Disaster Recovery Test
- Test backup restoration
- Verify failover procedures
- Update disaster recovery plan
- Train team on emergency procedures

#### 3. Capacity Planning
- Review storage usage trends
- Analyze database growth
- Evaluate server resources
- Plan for scaling if needed

---

## System Monitoring

### Application Monitoring

#### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Application metrics
pm2 describe hrms

# Memory usage
pm2 list
```

#### Custom Health Check Script
```bash
# Create health check script
nano /home/hrms/scripts/health-check.sh
```

```bash
#!/bin/bash

LOG_FILE="/home/hrms/logs/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check application
APP_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status')
if [ "$APP_STATUS" != "online" ]; then
    echo "$DATE - CRITICAL: Application is $APP_STATUS" >> $LOG_FILE
    pm2 restart hrms
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE - WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ $MEM_USAGE -gt 85 ]; then
    echo "$DATE - WARNING: Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi

# Check database
DB_STATUS=$(systemctl is-active mysql)
if [ "$DB_STATUS" != "active" ]; then
    echo "$DATE - CRITICAL: MySQL is $DB_STATUS" >> $LOG_FILE
    sudo systemctl restart mysql
fi

echo "$DATE - Health check completed" >> $LOG_FILE
```

```bash
# Make executable
chmod +x /home/hrms/scripts/health-check.sh

# Schedule every 5 minutes
crontab -e
# Add: */5 * * * * /home/hrms/scripts/health-check.sh
```

### Database Monitoring

#### Monitor Database Performance
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'hrms'
ORDER BY (data_length + index_length) DESC;

-- Check active connections
SHOW PROCESSLIST;

-- Check database status
SHOW STATUS LIKE '%connection%';
```

### Server Monitoring

#### Resource Usage
```bash
# CPU usage
top -bn1 | grep "Cpu(s)"

# Memory usage
free -h

# Disk I/O
iostat -x 1 5

# Network usage
nethogs
```

---

## Backup & Recovery

### Automated Backup System

#### Database Backup Script
```bash
#!/bin/bash

# Configuration
DB_USER="hrms_user"
DB_PASS="your_password"
DB_NAME="hrms"
BACKUP_DIR="/home/hrms/backups/database"
S3_BUCKET="s3://your-backup-bucket"  # Optional
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup
mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  $DB_NAME | gzip > $BACKUP_DIR/hrms_$DATE.sql.gz

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/hrms_$DATE.sql.gz $S3_BUCKET/

# Remove old backups
find $BACKUP_DIR -name "hrms_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Backup completed - hrms_$DATE.sql.gz" >> /home/hrms/logs/backup.log

# Verify backup
if [ -f "$BACKUP_DIR/hrms_$DATE.sql.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/hrms_$DATE.sql.gz" | cut -f1)
    echo "$(date): Backup verified - Size: $SIZE" >> /home/hrms/logs/backup.log
else
    echo "$(date): ERROR - Backup file not found!" >> /home/hrms/logs/backup.log
fi
```

### Recovery Procedures

#### Database Recovery
```bash
# Stop application
pm2 stop hrms

# Backup current database (safety)
mysqldump -u hrms_user -p hrms > /tmp/current_backup.sql

# Restore from backup
gunzip < /home/hrms/backups/database/hrms_YYYYMMDD_HHMMSS.sql.gz | \
  mysql -u hrms_user -p hrms

# Verify restoration
mysql -u hrms_user -p -e "USE hrms; SHOW TABLES;"

# Start application
pm2 start hrms

# Verify application
curl http://localhost:3000/api/status
```

#### Application Recovery
```bash
# Stop application
pm2 stop hrms

# Restore application files
cd /home/hrms
rm -rf app
tar -xzf backups/files/hrms_files_YYYYMMDD_HHMMSS.tar.gz

# Restore environment
cp backups/.env app/.env

# Install dependencies
cd app
npm ci --production

# Build application
npm run build

# Start application
pm2 start ecosystem.config.js
pm2 save
```

---

## Performance Optimization

### Database Optimization

#### Index Optimization
```sql
-- Check missing indexes
SELECT 
  t.table_name,
  s.index_name,
  s.column_name
FROM information_schema.tables t
LEFT JOIN information_schema.statistics s 
  ON t.table_name = s.table_name
WHERE t.table_schema = 'hrms'
  AND s.index_name IS NULL;

-- Add recommended indexes
CREATE INDEX idx_attendance_email_date ON attendance(email, date);
CREATE INDEX idx_leave_emp_status ON leavedata(emp_code, status);
CREATE INDEX idx_users_dept_status ON users(department, employment_status);
```

#### Query Optimization
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Analyze slow queries
SELECT * FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 10;
```

### Application Optimization

#### PM2 Cluster Mode
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hrms',
    script: 'npm',
    args: 'start',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048'
  }]
};
```

#### Nginx Caching
```nginx
# Add to Nginx configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=hrms_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache hrms_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_bypass $http_cache_control;
    add_header X-Cache-Status $upstream_cache_status;
    
    proxy_pass http://localhost:3000;
}
```

### Redis Caching

#### Setup Redis Caching
```javascript
// lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached(key: string) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCache(key: string, data: any, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(data));
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## Security Updates

### Regular Security Tasks

#### 1. System Security Updates
```bash
# Check for security updates
sudo apt update
sudo apt list --upgradable | grep -i security

# Install security updates
sudo apt upgrade -y

# Check for kernel updates
uname -r
apt list --installed | grep linux-image
```

#### 2. Application Security
```bash
# Check for npm vulnerabilities
cd /home/hrms/app
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

#### 3. SSL Certificate Renewal
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### 4. Password Policy
```bash
# Enforce password expiration (90 days)
sudo chage -M 90 hrms

# Check password status
sudo chage -l hrms
```

### Security Monitoring

#### Monitor Failed Login Attempts
```bash
# Check failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -n 20

# Check failed application logins
grep "Invalid credentials" /home/hrms/logs/app.log | tail -n 20
```

#### Monitor Suspicious Activity
```bash
# Check for unusual network connections
sudo netstat -tulpn | grep ESTABLISHED

# Check for unusual processes
ps aux | grep -v "USER\|root\|hrms"

# Check file integrity
sudo aide --check
```

---

## Troubleshooting Guide

### Application Issues

#### Issue: Application Not Starting
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hrms --lines 100

# Check port availability
sudo lsof -i :3000

# Restart application
pm2 restart hrms

# If still failing, rebuild
cd /home/hrms/app
npm run build
pm2 restart hrms
```

#### Issue: High Memory Usage
```bash
# Check memory usage
pm2 list
free -h

# Restart application
pm2 restart hrms

# Adjust memory limit
pm2 delete hrms
pm2 start ecosystem.config.js --max-memory-restart 1G
```

#### Issue: Slow Response Times
```bash
# Check application logs
pm2 logs hrms

# Check database queries
mysql -u hrms_user -p -e "SHOW PROCESSLIST;"

# Check server resources
htop

# Enable cluster mode
pm2 delete hrms
pm2 start ecosystem.config.js -i max
```

### Database Issues

#### Issue: Database Connection Failed
```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check connections
mysql -u hrms_user -p -e "SHOW PROCESSLIST;"

# Check error log
sudo tail -n 50 /var/log/mysql/error.log
```

#### Issue: Slow Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';

-- Check slow queries
SELECT * FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 10;

-- Optimize tables
OPTIMIZE TABLE users, attendance, leavedata;
```

#### Issue: Database Locked
```sql
-- Check locks
SHOW OPEN TABLES WHERE In_use > 0;

-- Kill blocking query
SHOW PROCESSLIST;
KILL <process_id>;
```

### Server Issues

#### Issue: Disk Space Full
```bash
# Check disk usage
df -h

# Find large files
sudo du -h / | sort -rh | head -n 20

# Clean up
# Remove old logs
sudo find /var/log -name "*.log" -mtime +30 -delete

# Clean PM2 logs
pm2 flush

# Clean old backups
find /home/hrms/backups -mtime +30 -delete

# Clean npm cache
npm cache clean --force
```

#### Issue: High CPU Usage
```bash
# Check processes
top

# Check PM2 processes
pm2 monit

# Restart application
pm2 restart hrms

# Check for runaway processes
ps aux | sort -nrk 3,3 | head -n 5
```

---

## Support Procedures

### Support Tiers

#### Tier 1: User Support
- **Scope**: Basic user issues, password resets, navigation help
- **Response Time**: 4 hours
- **Contact**: support@yourcompany.com

#### Tier 2: Technical Support
- **Scope**: Application errors, data issues, feature problems
- **Response Time**: 2 hours
- **Contact**: tech-support@yourcompany.com

#### Tier 3: System Administration
- **Scope**: Server issues, database problems, security incidents
- **Response Time**: 1 hour
- **Contact**: sysadmin@yourcompany.com

### Issue Reporting

#### User Issue Template
```
Subject: [HRMS] Issue Description

Priority: [Low/Medium/High/Critical]

Description:
[Detailed description of the issue]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Screenshots:
[Attach if applicable]

User Information:
- Name:
- Email:
- Role:
- Browser:
```

### Escalation Procedures

1. **Level 1** (0-4 hours): User support attempts resolution
2. **Level 2** (4-8 hours): Technical support investigates
3. **Level 3** (8+ hours): System admin involvement
4. **Level 4** (Critical): Development team engaged

---

## Emergency Procedures

### System Down

1. **Immediate Actions**:
   ```bash
   # Check application status
   pm2 status
   
   # Check logs
   pm2 logs hrms --lines 100
   
   # Restart application
   pm2 restart hrms
   ```

2. **If Still Down**:
   ```bash
   # Check database
   sudo systemctl status mysql
   sudo systemctl restart mysql
   
   # Check Nginx
   sudo systemctl status nginx
   sudo systemctl restart nginx
   
   # Rebuild application
   cd /home/hrms/app
   npm run build
   pm2 restart hrms
   ```

3. **Escalation**:
   - Notify system administrator
   - Check backup systems
   - Prepare for failover if needed

### Data Loss

1. **Stop Application**:
   ```bash
   pm2 stop hrms
   ```

2. **Assess Damage**:
   ```bash
   # Check database
   mysql -u hrms_user -p -e "USE hrms; SHOW TABLES;"
   
   # Check recent backups
   ls -lh /home/hrms/backups/database/
   ```

3. **Restore from Backup**:
   ```bash
   # Restore database
   gunzip < /home/hrms/backups/database/latest.sql.gz | \
     mysql -u hrms_user -p hrms
   
   # Verify restoration
   mysql -u hrms_user -p -e "USE hrms; SELECT COUNT(*) FROM users;"
   ```

4. **Restart Application**:
   ```bash
   pm2 start hrms
   ```

### Security Breach

1. **Immediate Actions**:
   - Disconnect affected systems from network
   - Change all passwords
   - Review access logs
   - Notify security team

2. **Investigation**:
   ```bash
   # Check access logs
   sudo grep "Failed password" /var/log/auth.log
   
   # Check application logs
   grep -i "error\|unauthorized" /home/hrms/logs/app.log
   
   # Check active connections
   sudo netstat -tulpn
   ```

3. **Recovery**:
   - Patch vulnerabilities
   - Restore from clean backup
   - Implement additional security measures
   - Document incident

---

## Contact Information

### Emergency Contacts

**System Administrator**:
- Name: [Name]
- Email: sysadmin@yourcompany.com
- Phone: +1234567890
- Available: 24/7

**Database Administrator**:
- Name: [Name]
- Email: dba@yourcompany.com
- Phone: +1234567891
- Available: Business hours

**Development Team Lead**:
- Name: [Name]
- Email: dev-lead@yourcompany.com
- Phone: +1234567892
- Available: Business hours

---

## Document Version
- **Version**: 1.0
- **Last Updated**: November 13, 2025
- **Author**: Development Team
