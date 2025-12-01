# Quick Reference Guide

## Essential Commands

### Application Management

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run with PM2
pm2 start ecosystem.config.js
pm2 restart hrms
pm2 stop hrms
pm2 logs hrms
pm2 monit
```

### Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio
npx prisma studio

# Backup database
mysqldump -u hrms_user -p hrms > backup.sql

# Restore database
mysql -u hrms_user -p hrms < backup.sql
```

### Server Management

```bash
# Check application status
pm2 status

# Check system resources
htop
free -h
df -h

# Check logs
pm2 logs hrms --lines 100
sudo tail -f /var/log/nginx/hrms_error.log

# Restart services
sudo systemctl restart nginx
sudo systemctl restart mysql
pm2 restart hrms
```

---

## Important File Locations

### Application Files
```
/home/hrms/app/                 # Application root
/home/hrms/app/.env             # Environment variables
/home/hrms/app/prisma/          # Database schema
/home/hrms/app/src/             # Source code
/home/hrms/logs/                # Application logs
```

### Configuration Files
```
/etc/nginx/sites-available/hrms # Nginx config
/home/hrms/app/ecosystem.config.js # PM2 config
/home/hrms/app/.env             # Environment config
```

### Backup Locations
```
/home/hrms/backups/database/    # Database backups
/home/hrms/backups/files/       # File backups
```

### Log Files
```
/home/hrms/logs/app.log         # Application logs
/var/log/nginx/hrms_access.log  # Nginx access logs
/var/log/nginx/hrms_error.log   # Nginx error logs
/var/log/mysql/error.log        # MySQL error logs
```

---

## Environment Variables

### Required Variables
```env
DATABASE_URL="mysql://user:pass@localhost:3306/hrms"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

### Optional Variables
```env
REDIS_URL="redis://localhost:6379"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"

# ESSL Integration
ESSL_SERVER_URL="http://192.168.0.3/webapiservice.asmx"
ESSL_SERIAL_NUMBER="BJ2C211860737"
ESSL_USERNAME="essl1"
ESSL_PASSWORD="Essl@123"
ESSL_SYNC_URL="http://localhost:3000/api/essl/sync"
ESSL_SYNC_TIMEOUT_MS="6000"
ESSL_LOOKBACK_DAYS="0"
ESSL_OVERWRITE_SHIFT="0"
ESSL_MAX_SHIFT_HOURS="16"
```

---

## API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/login          # Login
POST   /api/auth/validate       # Validate token
POST   /api/auth/user-details   # Get user info
GET    /api/auth/me             # Current user
POST   /api/auth/logout         # Logout
```

### Employees
```
GET    /api/employees           # List employees
GET    /api/employees/:id       # Get employee
POST   /api/employees           # Create employee
PUT    /api/employees/:id       # Update employee
PUT    /api/employees/update-salary # Update salary structure
DELETE /api/employees/:id       # Delete employee
```

### Attendance
```
GET    /api/attendance          # List attendance
POST   /api/attendance/clock-in # Clock in
POST   /api/attendance/clock-out # Clock out
GET    /api/attendance/live     # Live attendance
POST   /api/essl/sync           # Sync from ESSL
POST   /api/essl/debug          # Debug ESSL connection
```

### Leaves
```
GET    /api/leaves              # List leaves
POST   /api/leaves              # Apply leave
PUT    /api/leaves/:id/approve  # Approve leave
PUT    /api/leaves/:id/reject   # Reject leave
```

---

## Database Tables Quick Reference

### Core Tables
- `users` - Employee master data
- `attendance` - Daily attendance records
- `leavedata` - Leave applications
- `npattendance` - Biometric attendance data

### Financial Tables
- `tax` - Tax calculations
- `provident_fund` - PF management
- `employee_insurance` - ESI management
- `professionaltax` - Professional tax
- `gratuity` - Gratuity calculations
- `bonus` - Bonus management

### Operational Tables
- `issuedata` - Employee issues
- `crud_events` - Events management
- `shift_time` - Shift schedules

### Communication Tables
- `call_data` - VoIP call logs
- `extensions` - VoIP extensions
- `sip_credentials` - SIP authentication

---

## Common SQL Queries

### User Management
```sql
-- Find user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- List all active employees
SELECT id, Full_name, email, department 
FROM users 
WHERE employment_status = 'active';

-- Count employees by department
SELECT department, COUNT(*) as count 
FROM users 
GROUP BY department;
```

### Attendance Queries
```sql
-- Today's attendance
SELECT * FROM attendance 
WHERE date = CURDATE();

-- Employee attendance for month
SELECT * FROM attendance 
WHERE email = 'user@example.com' 
  AND MONTH(date) = MONTH(CURDATE())
  AND YEAR(date) = YEAR(CURDATE());

-- Attendance summary
SELECT 
  status, 
  COUNT(*) as count 
FROM attendance 
WHERE date BETWEEN '2025-11-01' AND '2025-11-30'
GROUP BY status;
```

### Leave Queries
```sql
-- Pending leave applications
SELECT * FROM leavedata 
WHERE status = 'pending';

-- Employee leave balance
SELECT 
  emp_code, 
  remaining_leave, 
  paid_leave, 
  sick_leave 
FROM users 
WHERE emp_code = 'EMP001';
```

---

## Troubleshooting Quick Fixes

### Application Not Starting
```bash
# Check logs
pm2 logs hrms --lines 50

# Restart application
pm2 restart hrms

# If still failing, rebuild
cd /home/hrms/app
npm run build
pm2 restart hrms
```

### Database Connection Error
```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Test connection
mysql -u hrms_user -p -e "SELECT 1;"
```

### High Memory Usage
```bash
# Check memory
free -h
pm2 list

# Restart application
pm2 restart hrms

# Clear cache
npm cache clean --force
```

### Disk Space Full
```bash
# Check disk usage
df -h

# Find large files
sudo du -h / | sort -rh | head -n 20

# Clean logs
pm2 flush
sudo find /var/log -name "*.log" -mtime +30 -delete
```

---

## Security Quick Reference

### Password Requirements
- Minimum 8 characters
- Mix of letters, numbers, and symbols
- Hashed with bcrypt (10 rounds)

### Token Expiration
- Access Token: 15 minutes
- Refresh Token: 30 days

### Rate Limits
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## Backup & Recovery

### Create Backup
```bash
# Database backup
mysqldump -u hrms_user -p hrms | gzip > backup_$(date +%Y%m%d).sql.gz

# Files backup
tar -czf files_backup_$(date +%Y%m%d).tar.gz /home/hrms/app/public/uploads
```

### Restore Backup
```bash
# Stop application
pm2 stop hrms

# Restore database
gunzip < backup_20251113.sql.gz | mysql -u hrms_user -p hrms

# Restore files
tar -xzf files_backup_20251113.tar.gz -C /

# Start application
pm2 start hrms
```

---

## Monitoring Commands

### Application Health
```bash
# PM2 status
pm2 status

# Application logs
pm2 logs hrms --lines 100

# Monitor resources
pm2 monit
```

### System Health
```bash
# CPU and memory
htop

# Disk usage
df -h

# Network connections
sudo netstat -tulpn

# Process list
ps aux | grep node
```

### Database Health
```bash
# MySQL status
sudo systemctl status mysql

# Active connections
mysql -u hrms_user -p -e "SHOW PROCESSLIST;"

# Database size
mysql -u hrms_user -p -e "
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'hrms';
"
```

---

## User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- All HR and employee functions

### HR
- Employee management
- Attendance management
- Leave approvals
- Payroll processing
- Reports generation

### User (Employee)
- View personal information
- Mark attendance
- Apply for leaves
- View salary slips
- Raise issues

---

## Important URLs

### Application URLs
```
Development: http://localhost:3000
Production:  https://your-domain.com
API Base:    https://your-domain.com/api
```

### Admin Panels
```
Prisma Studio: http://localhost:5555
PM2 Web:       http://localhost:9615 (if enabled)
```

---

## Contact Information

### Emergency Contacts
- **System Admin**: sysadmin@yourcompany.com / +1234567890
- **Database Admin**: dba@yourcompany.com / +1234567891
- **Dev Team Lead**: dev-lead@yourcompany.com / +1234567892

### Support Channels
- **Technical Support**: tech-support@yourcompany.com
- **HR Support**: hr@yourcompany.com
- **General Support**: support@yourcompany.com

---

## Useful Links

### Documentation
- [Project Overview](./01-PROJECT-OVERVIEW.md)
- [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md)
- [Installation Guide](./03-INSTALLATION-SETUP-GUIDE.md)
- [API Documentation](./04-API-DOCUMENTATION.md)
- [User Guide](./06-USER-GUIDE.md)
- [Deployment Guide](./07-DEPLOYMENT-GUIDE.md)
- [Maintenance Guide](./08-MAINTENANCE-SUPPORT.md)

### External Resources
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- MySQL Docs: https://dev.mysql.com/doc/
- Nginx Docs: https://nginx.org/en/docs/

---

## Version Information

- **Application Version**: 0.1.0
- **Node.js Version**: 20.x
- **Next.js Version**: 15.5.4
- **React Version**: 19.1.0
- **Prisma Version**: 6.17.0
- **MySQL Version**: 8.0+

---

---

## Recent Updates (November 2025)

### ESSL Integration
- Fixed SOAP endpoint URL configuration
- Enhanced response parser for multiple formats
- Added debug endpoint for troubleshooting
- Improved error handling and logging

### Live Attendance
- Real-time attendance tracking (10-second updates)
- Client-side timer for second-by-second display
- Auto-sync with ESSL before fetching data
- Break time alerts and notifications
- Visual indicators for ongoing shifts

### Payroll Improvements
- CSV export for process attendance
- CSV export for bank challan (51 columns)
- Fixed salary structure update endpoint
- Proper data type handling for ESIC fields

### UI/UX Enhancements
- Replaced browser alerts with shadcn toast
- Added empty states for charts
- Improved loading indicators
- Better error messages

---

**Document Version**: 1.1  
**Last Updated**: November 26, 2025  
**Author**: Development Team
