# API Documentation

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Authentication Endpoints](#authentication-endpoints)
5. [Employee Management](#employee-management)
6. [Attendance Management](#attendance-management)
7. [Leave Management](#leave-management)
8. [Payroll Management](#payroll-management)
9. [HR Operations](#hr-operations)
10. [Admin Operations](#admin-operations)
11. [VoIP/Call Management](#voipcall-management)
12. [Campaign Management](#campaign-management)
13. [ESSL Integration](#essl-integration)
14. [Live Attendance](#live-attendance)
15. [Error Handling](#error-handling)

---

## API Overview

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### API Architecture
- **Type**: RESTful API
- **Format**: JSON
- **Authentication**: JWT Bearer Token
- **Rate Limiting**: 100 requests per 15 minutes (default)

### HTTP Methods
- `GET`: Retrieve resources
- `POST`: Create new resources
- `PUT`: Update entire resource
- `PATCH`: Partial update
- `DELETE`: Remove resource

### Standard Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Authentication

### Authentication Flow

```
1. Login → Receive JWT Token
2. Include Token in Headers
3. Token Validated on Each Request
4. Refresh Token When Expired
```

### Request Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Structure

```json
{
  "userId": 42,
  "email": "user@example.com",
  "role": "user",
  "iat": 1699900000,
  "exp": 1699900900
}
```

### Token Expiration
- **Access Token**: 15 minutes
- **Refresh Token**: 30 days

---

## Common Patterns

### Pagination

**Request**:
```http
GET /api/employees?page=1&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Filtering

```http
GET /api/employees?department=IT&status=active
```

### Sorting

```http
GET /api/employees?sortBy=name&order=asc
```

### Search

```http
GET /api/employees?search=john
```

---

## Authentication Endpoints

### 1. Login

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful. Token generated.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 42
}
```

**Error Responses**:
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Server error

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

### 2. Validate Token

**Endpoint**: `POST /api/auth/validate`

**Description**: Verify JWT token validity

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Token validated successfully",
  "userId": 42
}
```

**Error Responses**:
- `400`: Missing token
- `401`: Invalid or expired token

---

### 3. Get User Details

**Endpoint**: `POST /api/auth/user-details`

**Description**: Retrieve authenticated user information

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Welcome! You are a USER",
  "user": {
    "id": 42,
    "email": "user@example.com",
    "name": "John Doe",
    "Full_name": "John Doe",
    "role": "user",
    "department": "IT",
    "emp_code": "EMP001",
    "job_role": "Software Engineer",
    "type": "user"
  }
}
```

---

### 4. Get Current User

**Endpoint**: `GET /api/auth/me`

**Description**: Get current authenticated user (uses cookie)

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "success": true,
  "user": {
    "id": 42,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "department": "IT"
  }
}
```

---

### 5. Refresh Token

**Endpoint**: `POST /api/auth/refresh`

**Description**: Refresh access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "token": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

### 6. Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: Logout user and clear tokens

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 7. Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Description**: Request password reset email

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### 8. Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Description**: Reset password using token from email

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "password": "new_password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## Employee Management

### 1. List Employees

**Endpoint**: `GET /api/employees`

**Description**: Get list of all employees

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `department` (optional): Filter by department
- `status` (optional): Filter by employment status
- `search` (optional): Search by name or email

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": 1,
        "Full_name": "John Doe",
        "email": "john@example.com",
        "emp_code": "EMP001",
        "department": "IT",
        "job_role": "Software Engineer",
        "employment_status": "active",
        "joining_date": "2024-01-15"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Permissions**: Admin, HR

---

### 2. Get Employee by ID

**Endpoint**: `GET /api/employees/:id`

**Description**: Get detailed information about a specific employee

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "Full_name": "John Doe",
    "email": "john@example.com",
    "emp_code": "EMP001",
    "department": "IT",
    "job_role": "Software Engineer",
    "dob": "1990-05-15",
    "gender": "Male",
    "contact_no": "+1234567890",
    "emp_address": "123 Main St, City",
    "joining_date": "2024-01-15",
    "employment_type": "Full-time",
    "employment_status": "active",
    "reporting_manager": "Jane Smith",
    "CTC": "1200000",
    "bank_name": "ABC Bank",
    "Account_no": "1234567890",
    "IFSC_code": "ABCD0001234"
  }
}
```

**Error Responses**:
- `404`: Employee not found
- `403`: Insufficient permissions

**Permissions**: Admin, HR, Self

---

### 3. Create Employee

**Endpoint**: `POST /api/employees`

**Description**: Create a new employee record

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "Full_name": "John Doe",
  "email": "john@example.com",
  "password": "temporary_password",
  "emp_code": "EMP001",
  "department": "IT",
  "job_role": "Software Engineer",
  "dob": "1990-05-15",
  "gender": "Male",
  "contact_no": "+1234567890",
  "emp_address": "123 Main St, City",
  "joining_date": "2024-01-15",
  "employment_type": "Full-time",
  "employment_status": "active",
  "reporting_manager": "Jane Smith",
  "CTC": "1200000",
  "type": "user"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": 1,
    "Full_name": "John Doe",
    "email": "john@example.com",
    "emp_code": "EMP001"
  }
}
```

**Error Responses**:
- `400`: Invalid data
- `409`: Email or emp_code already exists
- `403`: Insufficient permissions

**Permissions**: Admin, HR

---

### 4. Update Employee

**Endpoint**: `PUT /api/employees/:id`

**Description**: Update employee information

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (partial update allowed):
```json
{
  "contact_no": "+1234567891",
  "emp_address": "456 New St, City",
  "job_role": "Senior Software Engineer",
  "CTC": "1500000"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": 1,
    "Full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Permissions**: Admin, HR, Self (limited fields)

---

### 5. Delete Employee

**Endpoint**: `DELETE /api/employees/:id`

**Description**: Delete employee (moves to deleted_user_informations table)

**Headers**:
```http
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**Error Responses**:
- `404`: Employee not found
- `403`: Insufficient permissions

**Permissions**: Admin only

---

### 6. Search Employees

**Endpoint**: `GET /api/employees/search`

**Description**: Search employees by various criteria

**Query Parameters**:
- `q`: Search query (name, email, emp_code)
- `department`: Filter by department
- `job_role`: Filter by job role

**Example**:
```http
GET /api/employees/search?q=john&department=IT
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "Full_name": "John Doe",
        "email": "john@example.com",
        "emp_code": "EMP001",
        "department": "IT"
      }
    ],
    "count": 1
  }
}
```

---

## Attendance Management

### 1. Clock In

**Endpoint**: `POST /api/attendance/clock-in`

**Description**: Mark attendance clock-in

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "date": "2025-11-13",
  "login_time": "09:00:00"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "date": "2025-11-13",
    "login_time": "09:00:00",
    "status": "present"
  }
}
```

---

### 2. Clock Out

**Endpoint**: `POST /api/attendance/clock-out`

**Description**: Mark attendance clock-out

**Request Body**:
```json
{
  "email": "user@example.com",
  "date": "2025-11-13",
  "logout_time": "18:00:00",
  "logout_reason": "End of day"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Clocked out successfully",
  "data": {
    "id": 1,
    "login_hours": "09:00:00",
    "working_hours": "09:00:00"
  }
}
```

---

### 3. Get Attendance Records

**Endpoint**: `GET /api/attendance`

**Description**: Get attendance records

**Query Parameters**:
- `email`: Filter by email
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `status`: Filter by status (present, absent, leave)

**Example**:
```http
GET /api/attendance?email=user@example.com&startDate=2025-11-01&endDate=2025-11-30
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "date": "2025-11-13",
        "login_time": "09:00:00",
        "logout_time": "18:00:00",
        "login_hours": "09:00:00",
        "status": "present"
      }
    ],
    "summary": {
      "totalDays": 30,
      "presentDays": 22,
      "absentDays": 2,
      "leaveDays": 6
    }
  }
}
```

---

### 4. Mark Break

**Endpoint**: `POST /api/attendance/break`

**Description**: Mark break start/end

**Request Body**:
```json
{
  "attendanceId": 1,
  "breakType": "lunch",
  "action": "start"
}
```

**Break Types**: `morning`, `lunch`, `evening`
**Actions**: `start`, `end`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Break started successfully"
}
```

---

### 5. Get Attendance Report

**Endpoint**: `GET /api/attendance/report`

**Description**: Generate attendance report

**Query Parameters**:
- `month`: Month (1-12)
- `year`: Year (YYYY)
- `department`: Filter by department (optional)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "month": 11,
    "year": 2025,
    "employees": [
      {
        "emp_code": "EMP001",
        "name": "John Doe",
        "totalDays": 30,
        "presentDays": 22,
        "absentDays": 2,
        "leaveDays": 6,
        "totalHours": "198:00:00"
      }
    ]
  }
}
```

**Permissions**: Admin, HR

---

## Leave Management

### 1. Apply Leave

**Endpoint**: `POST /api/leaves`

**Description**: Submit leave application

**Request Body**:
```json
{
  "emp_code": "EMP001",
  "leave_type": "Paid Leave",
  "start_date": "2025-11-20",
  "end_date": "2025-11-22",
  "reason": "Personal work",
  "added_by_user": "John Doe",
  "Team": "IT"
}
```

**Leave Types**: `Paid Leave`, `Sick Leave`, `Casual Leave`

**Success Response** (201):
```json
{
  "success": true,
  "message": "Leave application submitted successfully",
  "data": {
    "l_id": 1,
    "status": "pending",
    "HRapproval": "pending",
    "Managerapproval": "pending"
  }
}
```

---

### 2. Get Leave Applications

**Endpoint**: `GET /api/leaves`

**Description**: Get leave applications

**Query Parameters**:
- `emp_code`: Filter by employee code
- `status`: Filter by status (pending, approved, rejected)
- `startDate`: Filter from date
- `endDate`: Filter to date

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "leaves": [
      {
        "l_id": 1,
        "emp_code": "EMP001",
        "leave_type": "Paid Leave",
        "start_date": "2025-11-20",
        "end_date": "2025-11-22",
        "reason": "Personal work",
        "status": "pending",
        "HRapproval": "pending",
        "Managerapproval": "pending",
        "leaveregdate": "2025-11-13"
      }
    ]
  }
}
```

---

### 3. Approve Leave

**Endpoint**: `PUT /api/leaves/:id/approve`

**Description**: Approve leave application

**Request Body**:
```json
{
  "approverType": "HR"
}
```

**Approver Types**: `HR`, `Manager`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Leave approved successfully",
  "data": {
    "l_id": 1,
    "HRapproval": "approved",
    "status": "approved"
  }
}
```

**Permissions**: Admin, HR (for HR approval), Manager (for Manager approval)

---

### 4. Reject Leave

**Endpoint**: `PUT /api/leaves/:id/reject`

**Description**: Reject leave application

**Request Body**:
```json
{
  "approverType": "HR",
  "reason": "Insufficient leave balance"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Leave rejected",
  "data": {
    "l_id": 1,
    "HRapproval": "rejected",
    "HRrejectReason": "Insufficient leave balance"
  }
}
```

---

### 5. Get Leave Balance

**Endpoint**: `GET /api/leaves/balance/:empCode`

**Description**: Get employee leave balance

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "emp_code": "EMP001",
    "remaining_leave": 12,
    "paid_leave": 2,
    "sick_leave": 1,
    "last_leave_update": "2025-01-01"
  }
}
```

---

## Payroll Management

### 1. Get Salary Details

**Endpoint**: `GET /api/payroll/salary/:empCode`

**Description**: Get employee salary details

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "emp_code": "EMP001",
    "CTC": "1200000",
    "Basic_Monthly_Remuneration": "50000",
    "HRA_Monthly_Remuneration": "20000",
    "OTHER_ALLOWANCE_Monthly_Remuneration": "10000",
    "PF_Monthly_Contribution": "1800",
    "gross_salary": "80000",
    "netSalary": "72000"
  }
}
```

**Permissions**: Admin, HR, Self

---

### 2. Generate Salary Slip

**Endpoint**: `POST /api/payroll/salary-slip`

**Description**: Generate salary slip for a month

**Request Body**:
```json
{
  "emp_code": "EMP001",
  "month": 11,
  "year": 2025
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Salary slip generated",
  "data": {
    "emp_code": "EMP001",
    "month": "November",
    "year": 2025,
    "gross_salary": "80000",
    "deductions": {
      "pf": "1800",
      "esi": "600",
      "professional_tax": "200"
    },
    "netSalary": "77400",
    "pdfUrl": "/uploads/salary-slips/EMP001_Nov2025.pdf"
  }
}
```

---

### 3. Process Payroll

**Endpoint**: `POST /api/payroll/process`

**Description**: Process payroll for all employees

**Request Body**:
```json
{
  "month": 11,
  "year": 2025,
  "department": "IT"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Payroll processed successfully",
  "data": {
    "totalEmployees": 50,
    "processed": 50,
    "failed": 0,
    "totalAmount": "4000000"
  }
}
```

**Permissions**: Admin, HR

---

## VoIP/Call Management

### 1. Get Call Logs

**Endpoint**: `GET /api/call-data`

**Description**: Get call logs

**Query Parameters**:
- `extension`: Filter by extension
- `startDate`: Start date
- `endDate`: End date
- `direction`: inbound/outbound

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "calls": [
      {
        "id": 1,
        "extension": "1001",
        "destination": "+1234567890",
        "direction": "outbound",
        "status": "answered",
        "start_time": "2025-11-13T10:00:00Z",
        "end_time": "2025-11-13T10:05:00Z",
        "duration_seconds": 300,
        "recording_url": "/recordings/call_1.mp3"
      }
    ]
  }
}
```

---

### 2. Get SIP Credentials

**Endpoint**: `GET /api/sip-cred/:email`

**Description**: Get SIP credentials for user

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "extension": "1001",
    "sip_password": "encrypted_password"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": {
    "field": "email",
    "issue": "Email already exists"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password |
| `TOKEN_EXPIRED` | JWT token has expired |
| `TOKEN_INVALID` | JWT token is invalid |
| `UNAUTHORIZED` | User not authenticated |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Input validation failed |
| `DUPLICATE_ENTRY` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

---

## Rate Limiting

### Default Limits
- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Per IP address**

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699900000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

---

## Document Version
- **Version**: 1.0
- **Last Updated**: November 13, 2025
- **Author**: Development Team


---

## ESSL Integration

### Overview
The HRMS integrates with ESSL biometric devices to automatically sync attendance data. The system supports both SOAP-based and JSON-based attendance data sources.

### 1. Sync Attendance from ESSL

**Endpoint**: `POST /api/essl/sync`

**Description**: Synchronize attendance data from ESSL biometric device

**Request Body** (Optional):
```json
{
  "fromDate": "2025-11-26 00:00:00",
  "toDate": "now",
  "lookbackDays": 0,
  "overwriteShift": false,
  "url": "http://source-url/attendance.json"
}
```

**Parameters**:
- `fromDate`: Start date for sync (defaults to last attendance date)
- `toDate`: End date for sync (defaults to current time, use "now" for current)
- `lookbackDays`: Number of days to look back from fromDate
- `overwriteShift`: Whether to overwrite existing shift assignments
- `url`: Optional JSON URL for JSON-mode sync

**Success Response** (200):
```json
{
  "success": true,
  "message": "Attendance data synchronized successfully",
  "inserted": 15,
  "updated": 8
}
```

**Configuration** (Environment Variables):
```env
ESSL_SERVER_URL=http://192.168.0.3/webapiservice.asmx
ESSL_SERIAL_NUMBER=BJ2C211860737
ESSL_USERNAME=essl1
ESSL_PASSWORD=Essl@123
ESSL_SYNC_URL=http://localhost:3000/api/essl/sync
ESSL_SYNC_TIMEOUT_MS=6000
ESSL_LOOKBACK_DAYS=0
ESSL_OVERWRITE_SHIFT=0
ESSL_MAX_SHIFT_HOURS=16
```

**Features**:
- Automatic SOAP request to ESSL device
- Parses multiple response formats (standard, namespaced, CDATA)
- Calculates working hours, break time, and total hours
- Determines attendance status (Present, Half-day, Absent, Late, Early)
- Handles shift time validation
- Supports both SOAP and JSON data sources

---

### 2. Debug ESSL Connection

**Endpoint**: `POST /api/essl/debug`

**Description**: Test ESSL connection and view raw SOAP response

**Request Body** (Optional):
```json
{
  "fromDate": "2025-11-26 00:00:00",
  "toDate": "2025-11-26 23:59:59"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "serverUrl": "http://192.168.0.3/webapiservice.asmx",
  "dateRange": {
    "from": "2025-11-26 00:00:00",
    "to": "2025-11-26 23:59:59"
  },
  "responseStatus": 200,
  "responseData": "<?xml version=\"1.0\"...",
  "responsePreview": "First 1000 characters..."
}
```

---

### 3. Trigger ESSL Sync

**Endpoint**: `POST /api/essl/trigger`

**Description**: Trigger attendance sync (used internally for fire-and-forget syncs)

**Query Parameters**:
- `emp_code`: Optional employee code to sync specific employee

**Success Response** (200):
```json
{
  "ok": true,
  "target": "http://localhost:3000/api/essl/sync"
}
```

---

## Live Attendance

### Overview
Live attendance provides real-time attendance tracking with automatic updates every 10 seconds. The system calculates working hours, break time, and status in real-time.

### 1. Get Live Attendance

**Endpoint**: `GET /api/attendance/live`

**Description**: Get real-time attendance data for an employee

**Query Parameters**:
- `employee_id` (required): Employee ID
- `date` (optional): Date in YYYY-MM-DD format (defaults to today)

**Example Request**:
```
GET /api/attendance/live?employee_id=123&date=2025-11-26
```

**Success Response** (200):
```json
{
  "hasRecord": true,
  "isOngoing": true,
  "employeeId": "123",
  "employeeName": "John Doe",
  "date": "2025-11-26",
  "inTime": "2025-11-26T09:59:00.000Z",
  "outTime": "2025-11-26T11:30:00.000Z",
  "clockTimes": ["09:59", "10:01", "10:04", "11:30"],
  "totalHours": "01:31:00",
  "loginHours": "00:50:48",
  "breakHours": "00:03:00",
  "status": "",
  "shiftTime": "9:00 AM - 6:00 PM",
  "lastUpdated": "2025-11-26T11:30:15.000Z"
}
```

**Response Fields**:
- `hasRecord`: Whether attendance record exists
- `isOngoing`: Whether shift is currently active
- `clockTimes`: Array of punch in/out times (HH:mm format)
- `totalHours`: Total time from first punch to last/current
- `loginHours`: Actual working time (excluding breaks)
- `breakHours`: Total break time
- `status`: Attendance status (empty if ongoing)

**No Record Response** (200):
```json
{
  "hasRecord": false,
  "isOngoing": false
}
```

**Features**:
- Automatic ESSL sync trigger before fetching data
- Real-time calculation of working hours
- Break time detection (odd number of punches)
- Shift validation with 15-minute grace period
- Status determination (Present, Half-day, Absent, Late, Early)
- Ongoing shift detection

---

### 2. Live Attendance Component

**Frontend Component**: `LiveAttendanceCard`

**Usage**:
```tsx
import { LiveAttendanceCard } from '@/components/LiveAttendanceCard';

<LiveAttendanceCard 
  employeeId="123" 
  showClockTimes={true}
/>
```

**Props**:
- `employeeId` (required): Employee ID to track
- `date` (optional): Specific date to view
- `showClockTimes` (optional): Show punch in/out times (default: true)

**Features**:
- Auto-refresh every 10 seconds
- Client-side timer updates every second
- Visual indicators for ongoing shifts
- Color-coded status badges
- Break time alerts (>45 minutes)
- Responsive design

---

## Payroll Management Updates

### 1. Download Process Attendance CSV

**Endpoint**: `GET /api/payroll/process-attendance?download=csv`

**Description**: Download process attendance report as CSV

**Query Parameters**:
- `month`: Month in YYYY-MM format (required)
- `search`: Search by name or employee code (optional)
- `download`: Set to "csv" for CSV download

**Example Request**:
```
GET /api/payroll/process-attendance?month=2025-11&download=csv
```

**Response**: CSV file download
```csv
#,Name,Emp Code,Company,Designation,Paid Days,Net Salary,Arrears
1,John Doe,123,Demandify Media,Developer,22,50000,0
```

---

### 2. Download Bank Challan CSV

**Endpoint**: `GET /api/bank-challan/download`

**Description**: Download bank challan report as CSV

**Query Parameters**:
- `month`: Month in YYYY-MM format (required)
- `search`: Search by name or employee code (optional)

**Example Request**:
```
GET /api/bank-challan/download?month=2025-11
```

**Response**: CSV file with 51 columns including:
- Employee details (name, code, designation, etc.)
- Bank details (account, IFSC, branch)
- Salary components (basic, HRA, allowances)
- Deductions (PF, ESI, tax, professional tax)
- Net pay calculation

---

### 3. Update Employee Salary Structure

**Endpoint**: `PUT /api/employees/update-salary`

**Description**: Update employee salary structure and components

**Request Body**:
```json
{
  "id": 179,
  "CTC": "523200",
  "gross_salary": "41800",
  "netSalary": "40000",
  "Basic_Monthly_Remuneration": "21800",
  "HRA_Monthly_Remuneration": "10900",
  "OTHER_ALLOWANCE_Monthly_Remuneration": "9100",
  "PF_Monthly_Contribution": "1800",
  "Employee_Esic_Monthly": 0,
  "Employer_Esic_Monthly": 0,
  "salary_pay_mode": "Bank Transfer",
  "PF_Number": "PF123456",
  "UAN": "123456789012",
  "Salary_Revision_Month": "2025-11",
  "ESIC_Applicable": "No"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Salary structure updated successfully",
  "employee": {
    "id": "179",
    "emp_code": "405",
    "Full_name": "John Doe"
  }
}
```

**Features**:
- Updates all salary components
- Handles string and numeric fields correctly
- Validates employee existence
- Updates timestamp automatically
- Supports partial updates

---

## Recent Improvements

### Attendance Sync Enhancements
1. **Improved SOAP Parser**: Handles multiple response formats including namespaced tags and CDATA sections
2. **Fixed Endpoint URL**: Corrected ESSL server URL configuration (removed query parameters)
3. **Better Error Messages**: Detailed error responses with response previews
4. **Empty Response Handling**: Gracefully handles no-data scenarios
5. **Faster Sync**: Optimized to sync only today's data for live attendance

### Live Attendance Features
1. **Real-time Updates**: Polls every 10 seconds with client-side second-by-second updates
2. **Auto-sync Integration**: Triggers ESSL sync before fetching data
3. **Visual Indicators**: Animated pulse for ongoing shifts
4. **Break Alerts**: Notifications when break exceeds 45 minutes
5. **Status Calculation**: Automatic Present/Half-day/Absent determination

### CSV Export Improvements
1. **Proper Formatting**: Correct CSV headers and escaping
2. **Complete Data**: All 51 columns for bank challan
3. **No Pagination**: Exports all records (up to 10,000)
4. **Correct Content-Type**: Proper headers for file download

### UI/UX Enhancements
1. **Toast Notifications**: Replaced browser alerts with shadcn toast
2. **Empty States**: Clear messages when no data available
3. **Loading States**: Better loading indicators
4. **Error Handling**: User-friendly error messages

