# ESSL Biometric Device Integration

This document explains how the ESSL biometric device integration works with the HRMS system.

## Overview

The system fetches attendance data from an ESSL biometric device via SOAP API and stores it in a MySQL database using Prisma ORM.

## Configuration

All ESSL device credentials are stored in the `.env` file:

```env
DATABASE_URL="mysql://root:@localhost:3306/NewHRMSReactDB"
ESSL_SERVER_URL="http://192.168.0.3/webapiservice.asmx?op=GetTransactionsLog"
ESSL_SERIAL_NUMBER="BJ2C211860737"
ESSL_USERNAME="essl1"
ESSL_PASSWORD="Essl@123"
```

## Database Schema

The attendance data is stored in the `npattendance` table with the following structure:

- **employee_id**: Employee ID from the biometric device
- **emp_name**: Employee name
- **date**: Attendance date (cycle starts at 7 AM)
- **in_time**: First clock-in time
- **out_time**: Last clock-out time
- **clock_times**: JSON array of all clock-in/out times in HH:mm format
- **total_hours**: Total time between first in and last out
- **login_hours**: Actual working hours (excluding breaks)
- **break_hours**: Total break time
- **status**: Present/Half-day/Absent based on working hours

## API Endpoints

### 1. Sync Attendance Data

**Endpoint**: `POST /api/essl/sync`

**Description**: Fetches attendance data from ESSL device and stores it in the database.

**Request Body** (optional):
```json
{
  "fromDate": "2025-01-01 07:00:00",
  "toDate": "2025-01-10 23:59:59"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Attendance data synchronized successfully",
  "inserted": 45,
  "updated": 12
}
```

### 2. Test Sync

**Endpoint**: `GET /api/essl/test`

**Description**: Test endpoint to trigger a sync operation.

## How It Works

### 1. Data Fetching
- Sends a SOAP request to the ESSL device
- Retrieves transaction logs between specified dates
- Parses the XML response to extract attendance records

### 2. Data Processing
- Groups punches by employee and date (7 AM cycle)
- Calculates first in-time and last out-time
- Computes working hours, break hours, and total hours
- Determines attendance status based on working hours:
  - **Present**: ≥ 8 hours
  - **Half-day**: ≥ 4 hours and < 8 hours
  - **Absent**: < 4 hours

### 3. Data Storage
- Checks if a record exists for the employee and date
- Inserts new records or updates existing ones
- Prevents duplicate entries using unique constraint on (employee_id, date)

## Usage

### Manual Sync

To manually trigger a sync, you can:

1. **Using API client (Postman, curl, etc.)**:
```bash
curl -X POST http://localhost:3000/api/essl/sync \
  -H "Content-Type: application/json" \
  -d '{"fromDate": "2025-01-01 07:00:00"}'
```

2. **Using browser**:
Visit: `http://localhost:3000/api/essl/test`

### Automated Sync

You can set up a cron job or scheduled task to run the sync periodically:

**Example using Node.js cron** (add to your project):
```typescript
import cron from 'node-cron';

// Run every day at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  await fetch('http://localhost:3000/api/essl/sync', {
    method: 'POST',
  });
});
```

## Attendance Cycle Logic

The system uses a 7 AM to 7 AM cycle:
- Any punch before 7 AM is counted for the previous day
- Any punch from 7 AM onwards is counted for the current day

Example:
- Punch at 2025-01-10 06:30 AM → Counted for 2025-01-09
- Punch at 2025-01-10 07:00 AM → Counted for 2025-01-10

## Working Hours Calculation

The system calculates working hours by pairing consecutive punches:
- Punch 1 (In) → Punch 2 (Out) = Working period 1
- Punch 3 (In) → Punch 4 (Out) = Working period 2
- Total working hours = Sum of all working periods
- Break hours = Total hours - Working hours

## Troubleshooting

### Common Issues

1. **Connection Error**: Ensure the ESSL device is accessible at the configured IP address
2. **Authentication Error**: Verify ESSL_USERNAME and ESSL_PASSWORD in .env
3. **Database Error**: Check DATABASE_URL and ensure MySQL is running
4. **No Data**: Verify the date range and ensure there are transactions in the ESSL device

### Logs

Check the console output for detailed error messages when sync fails.

## Database Migration

If you need to recreate the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or create a migration
npx prisma migrate dev --name add_attendance_table
```

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- The `.gitignore` file should include `.env*` (currently commented out)
- Use environment variables for all sensitive credentials
- Consider implementing API authentication for production use
