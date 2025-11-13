# Technical Architecture Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Application Layers](#application-layers)
3. [Technology Stack Details](#technology-stack-details)
4. [Database Architecture](#database-architecture)
5. [API Architecture](#api-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Security Architecture](#security-architecture)
8. [Integration Architecture](#integration-architecture)
9. [Performance Optimization](#performance-optimization)
10. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (React 19 + TypeScript)                │  │
│  │  - Server-Side Rendering (SSR)                           │  │
│  │  - Client-Side Rendering (CSR)                           │  │
│  │  - Static Site Generation (SSG)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Middleware Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Authentication Middleware                             │  │
│  │  - Authorization (RBAC)                                  │  │
│  │  - Rate Limiting                                         │  │
│  │  - Security Headers                                      │  │
│  │  - Request Validation                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes                                      │  │
│  │  ├─ /api/auth/*        (Authentication)                  │  │
│  │  ├─ /api/employees/*   (Employee Management)             │  │
│  │  ├─ /api/attendance/*  (Attendance)                      │  │
│  │  ├─ /api/leaves/*      (Leave Management)                │  │
│  │  ├─ /api/payroll/*     (Payroll)                         │  │
│  │  ├─ /api/hr/*          (HR Operations)                   │  │
│  │  ├─ /api/admin/*       (Admin Functions)                 │  │
│  │  └─ /api/call-data/*   (VoIP Integration)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Service Classes                                       │  │
│  │  - Business Rules Engine                                 │  │
│  │  - Validation Logic                                      │  │
│  │  - Calculation Engines (Payroll, Tax)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Prisma ORM                                              │  │
│  │  - Query Builder                                         │  │
│  │  - Type-Safe Database Access                             │  │
│  │  - Migration Management                                  │  │
│  │  - Connection Pooling                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   MySQL Database         │    │   Redis Cache            │
│   - Employee Data        │    │   - Session Storage      │
│   - Attendance Records   │    │   - API Cache            │
│   - Payroll Data         │    │   - Rate Limiting        │
│   - Audit Logs           │    │   - Temporary Data       │
└──────────────────────────┘    └──────────────────────────┘
```

---

## Application Layers

### 1. Presentation Layer

**Technology**: Next.js 15 with React 19

**Components**:
- **Pages**: Route-based page components
- **Layouts**: Shared layout components
- **UI Components**: Reusable UI elements (Radix UI)
- **Forms**: Form components with validation
- **Charts**: Data visualization components

**Rendering Strategies**:
- **SSR**: Dynamic pages requiring authentication
- **CSR**: Interactive dashboards and real-time updates
- **SSG**: Static content pages

### 2. Middleware Layer

**Location**: `middleware.ts`

**Responsibilities**:
- JWT token validation
- Role-based access control
- Rate limiting (prevent abuse)
- Security headers injection
- Path traversal prevention
- Request logging

**Flow**:
```typescript
Request → Middleware → Route Handler → Response
         ↓
    [Validate Token]
         ↓
    [Check Permissions]
         ↓
    [Apply Rate Limits]
         ↓
    [Set Security Headers]
```

### 3. API Layer

**Structure**: RESTful API using Next.js API Routes

**Endpoints Organization**:
```
/api
├── /auth              # Authentication & authorization
├── /employees         # Employee CRUD operations
├── /attendance        # Attendance management
├── /leaves            # Leave management
├── /payroll           # Payroll processing
├── /hr                # HR-specific operations
├── /admin             # Admin functions
├── /call-data         # VoIP call management
├── /campaigns         # Campaign management
├── /forms             # Form submissions
└── /users             # User management
```

**API Response Format**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "error": null
}
```

### 4. Business Logic Layer

**Components**:
- **Services**: Business logic encapsulation
- **Validators**: Input validation (Zod schemas)
- **Calculators**: Payroll, tax, attendance calculations
- **Utilities**: Helper functions

**Example Services**:
- `PayrollService`: Salary calculations, deductions
- `TaxService`: Tax computations (old/new regime)
- `AttendanceService`: Working hours, overtime calculations
- `LeaveService`: Leave balance, approval workflows

### 5. Data Access Layer

**ORM**: Prisma

**Features**:
- Type-safe database queries
- Automatic migrations
- Connection pooling
- Query optimization
- Transaction support

**Example Usage**:
```typescript
// Type-safe query
const user = await prisma.users.findUnique({
  where: { email: 'user@example.com' },
  include: { attendance: true }
});
```

---

## Technology Stack Details

### Frontend Technologies

#### Core Framework
- **Next.js 15.5.4**: React framework with SSR/SSG
- **React 19.1.0**: UI library
- **TypeScript 5**: Type safety

#### UI Libraries
- **Radix UI**: Accessible component primitives
  - Dialog, Dropdown, Select, Tabs, etc.
- **Lucide React**: Icon library
- **Tabler Icons**: Additional icons
- **Tailwind CSS 4**: Utility-first CSS

#### Form Management
- **Zod**: Schema validation
- **React Hook Form**: Form state management

#### Data Visualization
- **Chart.js**: Canvas-based charts
- **Recharts**: React chart library
- **React-Chartjs-2**: Chart.js wrapper

#### PDF Generation
- **@react-pdf/renderer**: PDF creation
- **jsPDF**: Client-side PDF generation
- **html2pdf.js**: HTML to PDF conversion

#### Other Libraries
- **date-fns**: Date manipulation
- **axios**: HTTP client
- **sonner**: Toast notifications
- **@dnd-kit**: Drag and drop

### Backend Technologies

#### Runtime & Framework
- **Node.js**: JavaScript runtime
- **Next.js API Routes**: Backend API

#### Database
- **MySQL 8.x**: Relational database
- **Prisma 6.17.0**: ORM and query builder
- **mysql2**: MySQL driver

#### Authentication
- **jsonwebtoken**: JWT generation/validation
- **bcryptjs**: Password hashing

#### Communication
- **nodemailer**: Email sending
- **JsSIP**: VoIP/SIP client

#### Caching
- **ioredis**: Redis client for caching

---

## Database Architecture

### Database Design Principles

1. **Normalization**: 3NF for most tables
2. **Denormalization**: Strategic denormalization for performance
3. **Indexing**: Indexes on frequently queried columns
4. **Constraints**: Foreign keys, unique constraints
5. **Audit Trail**: Timestamps on all tables

### Entity Relationship Overview

```
┌─────────────┐
│    users    │ (Central entity)
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│attendance│   │leavedata │   │  tax     │   │provident │   │issuedata │
│          │   │          │   │          │   │  _fund   │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### Key Tables

#### 1. users (Employee Master)
- **Purpose**: Central employee repository
- **Key Fields**: 
  - Personal: name, email, dob, gender, blood_group
  - Employment: emp_code, department, job_role, joining_date
  - Financial: CTC, bank details, PF, ESI
  - Documents: aadhaar_card, pan_card, certificates
- **Indexes**: email (unique), emp_code

#### 2. attendance
- **Purpose**: Daily attendance tracking
- **Key Fields**: 
  - date, login_time, logout_time, login_hours
  - Break times (morning, lunch, evening)
  - status, shift_time
- **Indexes**: email, date, composite (email, date)

#### 3. leavedata
- **Purpose**: Leave applications
- **Key Fields**: 
  - leave_type, start_date, end_date, reason
  - HRapproval, Managerapproval
  - status, emp_code
- **Indexes**: emp_code, start_date

#### 4. dm_form (Data Mining)
- **Purpose**: Lead management
- **Key Fields**: 
  - Campaign info, contact details
  - Qualification status, QA fields
  - Delivery status
- **Indexes**: f_email_add, f_campaign_name

#### 5. call_data
- **Purpose**: VoIP call logs
- **Key Fields**: 
  - extension, destination, direction
  - start_time, end_time, duration_seconds
  - recording_url, status
- **Indexes**: extension, start_time

### Database Optimization

#### Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_attendance_email_date ON attendance(email, date);
CREATE INDEX idx_leave_emp_status ON leavedata(emp_code, status);
CREATE INDEX idx_users_dept_status ON users(department, employment_status);
```

#### Query Optimization
- Use of `SELECT` with specific columns (avoid SELECT *)
- Proper use of JOINs
- Pagination for large result sets
- Query result caching in Redis

---

## API Architecture

### RESTful Design Principles

#### HTTP Methods
- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT/PATCH**: Update resources
- **DELETE**: Remove resources

#### Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

### API Endpoint Structure

#### Authentication Endpoints
```
POST   /api/auth/login           # User login
POST   /api/auth/validate        # Token validation
POST   /api/auth/user-details    # Get user info
GET    /api/auth/me              # Current user
POST   /api/auth/refresh         # Refresh token
POST   /api/auth/logout          # Logout
POST   /api/auth/forgot-password # Password reset request
POST   /api/auth/reset-password  # Password reset
```

#### Employee Management
```
GET    /api/employees            # List employees
GET    /api/employees/:id        # Get employee
POST   /api/employees            # Create employee
PUT    /api/employees/:id        # Update employee
DELETE /api/employees/:id        # Delete employee
GET    /api/employees/search     # Search employees
```

#### Attendance Management
```
GET    /api/attendance           # List attendance
POST   /api/attendance/clock-in  # Clock in
POST   /api/attendance/clock-out # Clock out
POST   /api/attendance/break     # Break management
GET    /api/attendance/report    # Attendance report
```

#### Leave Management
```
GET    /api/leaves               # List leaves
POST   /api/leaves               # Apply leave
PUT    /api/leaves/:id/approve   # Approve leave
PUT    /api/leaves/:id/reject    # Reject leave
GET    /api/leaves/balance       # Leave balance
```

### API Security

#### Authentication Flow
1. Client sends credentials to `/api/auth/login`
2. Server validates and returns JWT token
3. Client includes token in subsequent requests
4. Middleware validates token on each request

#### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Rate Limiting
- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Implementation**: Redis-based rate limiting

---

## Authentication & Authorization

### Authentication Mechanism

#### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": 42,
    "email": "user@example.com",
    "role": "user",
    "iat": 1699900000,
    "exp": 1699900900
  }
}
```

#### Token Types
1. **Access Token**: 
   - Lifetime: 15 minutes
   - Storage: httpOnly cookie
   - Purpose: API authentication

2. **Refresh Token**: 
   - Lifetime: 30 days
   - Storage: httpOnly cookie
   - Purpose: Token renewal

### Authorization (RBAC)

#### Role Hierarchy
```
Admin (Full Access)
  │
  ├─ HR (HR Operations + Employee Functions)
  │
  └─ User (Employee Self-Service)
```

#### Permission Matrix

| Feature | Admin | HR | User |
|---------|-------|----|----|
| View All Employees | ✅ | ✅ | ❌ |
| Edit Employee | ✅ | ✅ | ❌ |
| Delete Employee | ✅ | ❌ | ❌ |
| View Own Profile | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ (Limited) |
| Mark Attendance | ✅ | ✅ | ✅ |
| View All Attendance | ✅ | ✅ | ❌ |
| Approve Leaves | ✅ | ✅ | ❌ |
| Apply Leave | ✅ | ✅ | ✅ |
| Process Payroll | ✅ | ✅ | ❌ |
| View Salary Slip | ✅ | ✅ | ✅ (Own) |
| System Settings | ✅ | ❌ | ❌ |

#### Role Determination Logic
```typescript
function determineRole(user) {
  // Special case
  if (user.name === "Viresh Kumbhar") return "admin";
  
  // Department-based
  if (user.department === "administration") return "admin";
  if (user.department === "hr") return "hr";
  
  // Default
  return "user";
}
```

---

## Security Architecture

### Security Layers

#### 1. Network Security
- HTTPS enforcement
- CORS configuration
- Rate limiting
- DDoS protection

#### 2. Application Security
- Input validation (Zod schemas)
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF protection
- Path traversal prevention

#### 3. Authentication Security
- Password hashing (bcrypt, 10 rounds)
- JWT with short expiration
- Refresh token rotation
- httpOnly cookies (XSS protection)
- Secure cookie flag (HTTPS only)

#### 4. Authorization Security
- Role-based access control
- Route-level protection
- API endpoint authorization
- Resource-level permissions

#### 5. Data Security
- Encrypted passwords
- Sensitive data masking in logs
- Secure document storage
- Audit trails

### Security Headers

```typescript
// middleware.ts
headers.set('X-Content-Type-Options', 'nosniff');
headers.set('X-Frame-Options', 'DENY');
headers.set('X-XSS-Protection', '1; mode=block');
headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
```

### Security Best Practices Implemented

1. **Password Policy**:
   - Minimum 8 characters
   - Hashed with bcrypt
   - No plain text storage

2. **Session Management**:
   - Short-lived access tokens
   - Secure token storage
   - Automatic token refresh
   - Logout clears all tokens

3. **Input Validation**:
   - Server-side validation
   - Type checking (TypeScript)
   - Schema validation (Zod)
   - Sanitization of user inputs

4. **Error Handling**:
   - Generic error messages to clients
   - Detailed logging server-side
   - No stack traces in production

---

## Integration Architecture

### External Integrations

#### 1. Biometric System (ESSL)
- **Purpose**: Attendance data sync
- **Protocol**: HTTP API
- **Endpoint**: `/api/essl/*`
- **Data Flow**: Biometric Device → API → Database

#### 2. Email System (SMTP)
- **Library**: Nodemailer
- **Use Cases**: 
  - Password reset emails
  - Leave notifications
  - Payroll notifications
- **Configuration**: Environment variables

#### 3. VoIP System (SIP)
- **Library**: JsSIP
- **Components**:
  - SIP credentials management
  - Call initiation/termination
  - Call logging
  - Recording storage
- **Endpoints**: `/api/call-data/*`, `/api/sip-cred/*`

#### 4. Redis Cache
- **Library**: ioredis
- **Use Cases**:
  - Session storage
  - API response caching
  - Rate limiting counters
  - Temporary data storage

### Integration Patterns

#### Synchronous Integration
```
Client → API → External Service → Response
```
- Used for: Real-time operations
- Example: Email sending, VoIP calls

#### Asynchronous Integration
```
Client → API → Queue → Worker → External Service
```
- Used for: Background jobs
- Example: Bulk email, report generation

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**: Automatic route-based splitting
2. **Lazy Loading**: Components loaded on demand
3. **Image Optimization**: Next.js Image component
4. **Caching**: Browser caching for static assets
5. **Minification**: Production build optimization

### Backend Optimization

1. **Database Query Optimization**:
   - Proper indexing
   - Query result caching
   - Connection pooling
   - Avoid N+1 queries

2. **API Response Caching**:
   - Redis caching for frequent queries
   - Cache invalidation strategies
   - ETags for conditional requests

3. **Pagination**:
   - Limit result sets
   - Cursor-based pagination for large datasets

4. **Compression**:
   - Gzip compression for responses
   - Image compression

### Monitoring & Profiling

- Application performance monitoring
- Database query profiling
- Error tracking and logging
- Resource utilization monitoring

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (Optional - Future)                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Server                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Next.js Application (Node.js)                 │    │
│  │  - Port: 3000                                  │    │
│  │  - Process Manager: PM2 (recommended)          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
┌──────────────────────┐  ┌──────────────────────┐
│  MySQL Server        │  │  Redis Server        │
│  - Port: 3306        │  │  - Port: 6379        │
│  - Persistent        │  │  - In-memory         │
└──────────────────────┘  └──────────────────────┘
```

### Deployment Steps

1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Start Application**:
   ```bash
   npm start
   # or with PM2
   pm2 start npm --name "hrms" -- start
   ```

### Environment Configuration

**Required Environment Variables**:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/hrms"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="password"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

### Backup Strategy

1. **Database Backups**:
   - Daily automated backups
   - Retention: 30 days
   - Off-site storage

2. **File Backups**:
   - Document uploads
   - Configuration files
   - Application logs

3. **Disaster Recovery**:
   - Backup restoration procedures
   - Failover strategies
   - Data recovery plans

---

## Scalability Considerations

### Current Limitations
- Single server deployment
- Monolithic architecture
- Session affinity required

### Future Scalability Options

1. **Horizontal Scaling**:
   - Multiple application servers
   - Load balancer distribution
   - Shared session storage (Redis)

2. **Database Scaling**:
   - Read replicas
   - Database sharding
   - Connection pooling optimization

3. **Caching Layer**:
   - Redis cluster
   - CDN for static assets
   - API gateway caching

4. **Microservices Migration**:
   - Service decomposition
   - API gateway
   - Event-driven architecture

---

## Document Version
- **Version**: 1.0
- **Last Updated**: November 13, 2025
- **Author**: Development Team
