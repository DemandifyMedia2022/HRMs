# Project Overview

## Project Name
**HRMS - Human Resource Management System**

## Version
0.1.0

## Project Type
Enterprise Web Application

---

## Executive Summary

This HRMS is a comprehensive Human Resource Management System built with modern web technologies to streamline HR operations, employee management, attendance tracking, payroll processing, and communication systems. The application provides role-based access control for administrators, HR personnel, and employees.

---

## Business Purpose

The HRMS system is designed to:

- **Centralize Employee Data**: Maintain comprehensive employee records including personal, professional, and financial information
- **Automate Attendance Tracking**: Real-time attendance monitoring with biometric integration
- **Streamline Payroll Processing**: Automated salary calculations, tax computations, and compliance management
- **Manage Leave Requests**: Digital leave application and approval workflow
- **Enable Communication**: Integrated VoIP calling system for internal and external communication
- **Ensure Compliance**: Tax calculations, PF, ESI, and other statutory compliance
- **Generate Reports**: Comprehensive reporting for HR analytics and decision-making

---

## Key Features

### 1. **Employee Management**
- Complete employee lifecycle management (onboarding to exit)
- Personal information, documents, and family details
- Employment history and organizational hierarchy
- Document management (Aadhaar, PAN, certificates, etc.)

### 2. **Attendance System**
- Biometric integration for clock-in/clock-out
- Real-time attendance tracking
- Break time management (morning, lunch, evening)
- Shift management and scheduling
- Attendance regularization requests

### 3. **Leave Management**
- Multiple leave types (paid, sick, casual)
- Leave balance tracking
- Multi-level approval workflow (Manager → HR)
- Leave calendar and team visibility

### 4. **Payroll Management**
- Automated salary calculations
- Tax computation (Old & New regime)
- Statutory deductions (PF, ESI, Professional Tax)
- Salary slips generation
- Reimbursement processing
- Advance salary management

### 5. **Tax & Compliance**
- Income tax calculations
- Investment declarations (80C, 80D, etc.)
- Form 16 generation
- PF and ESI compliance
- Professional tax management
- Gratuity calculations

### 6. **Communication System**
- Integrated VoIP calling (JsSIP)
- Call logging and recording
- Extension management
- Campaign management for outbound calls

### 7. **Data Mining & Lead Management**
- Lead capture and qualification
- Campaign tracking
- Quality assurance workflows
- Data suppression management

### 8. **Issue Tracking**
- Employee grievance management
- Issue categorization and resolution
- Acknowledgement workflows
- Resolution tracking

### 9. **Events & Celebrations**
- Birthday wishes system
- Event calendar management
- Team celebrations

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.4 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Lucide Icons, Tabler Icons
- **State Management**: React Hooks
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js, Recharts
- **PDF Generation**: React-PDF, jsPDF, html2pdf
- **Drag & Drop**: dnd-kit
- **Date Handling**: date-fns, react-day-picker
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: MySQL (via Prisma ORM)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **Caching**: ioredis (Redis)
- **VoIP**: JsSIP

### Database
- **RDBMS**: MySQL 8.x
- **ORM**: Prisma 6.17.0
- **Migrations**: Prisma Migrate

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier
- **Build Tool**: Turbopack (Next.js)

---

## System Architecture

### Architecture Pattern
**Monolithic Full-Stack Application** with:
- Server-side rendering (SSR)
- API routes for backend logic
- Client-side interactivity
- Database persistence

### Deployment Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│                  (React/Next.js UI)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js Server                         │
│  ├─ SSR/SSG Pages                                        │
│  ├─ API Routes (/api/*)                                  │
│  ├─ Middleware (Auth, Rate Limiting)                     │
│  └─ Static Assets                                        │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
┌──────────────────────┐  ┌──────────────────────┐
│   MySQL Database     │  │   Redis Cache        │
│   (Prisma ORM)       │  │   (Session/Cache)    │
└──────────────────────┘  └──────────────────────┘
```

---

## User Roles & Permissions

### 1. **Admin**
- Full system access
- User management (create, update, delete)
- System configuration
- All HR and employee functions
- Reports and analytics

### 2. **HR**
- Employee management
- Attendance management
- Leave approvals
- Payroll processing
- Compliance management
- Reports generation

### 3. **User (Employee)**
- View personal information
- Mark attendance
- Apply for leaves
- View salary slips
- Raise issues/complaints
- Update personal details (limited)

---

## Database Overview

### Core Tables
- **users**: Employee master data
- **attendance**: Daily attendance records
- **leavedata**: Leave applications and approvals
- **dm_form**: Data mining and lead management
- **call_data**: VoIP call logs
- **issuedata**: Employee issues and grievances
- **crud_events**: Event management
- **campaigns**: Marketing/calling campaigns

### Financial Tables
- **tax**: Tax calculations
- **tax_setting**: Tax configuration
- **provident_fund**: PF management
- **employee_insurance**: ESI management
- **professionaltax**: PT management
- **gratuity**: Gratuity calculations
- **bonus**: Bonus management
- **investment_declaration**: Tax investment declarations

### Supporting Tables
- **shift_time**: Shift schedules
- **slabs**: Tax slabs
- **dispositions**: Call dispositions
- **extensions**: VoIP extensions
- **sip_credentials**: SIP authentication
- **deleted_user_informations**: Audit trail for deleted users

---

## Security Features

### Authentication
- JWT-based authentication
- Two-step validation process
- Refresh token mechanism
- httpOnly cookies for token storage

### Authorization
- Role-based access control (RBAC)
- Route-level protection via middleware
- API endpoint authorization

### Data Protection
- Password hashing (bcryptjs)
- SQL injection prevention (Prisma ORM)
- XSS protection headers
- CSRF protection
- Rate limiting
- Path traversal prevention

### Compliance
- GDPR considerations
- Data retention policies
- Audit trails
- Secure document storage

---

## Integration Points

### External Systems
1. **Biometric Devices**: ESSL integration for attendance
2. **Email Server**: SMTP for notifications
3. **VoIP System**: SIP server integration
4. **Redis**: Caching and session management

### APIs
- RESTful API architecture
- JSON request/response format
- JWT authentication for API access

---

## Development Environment

### Prerequisites
- Node.js 20.x or higher
- MySQL 8.x
- Redis (optional, for caching)
- npm or yarn

### Environment Variables
See `.env` file for required configuration:
- Database connection
- JWT secrets
- Email configuration
- Redis connection
- VoIP settings

---

## Project Structure

```
hrms/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── pages/             # Application pages
│   │   └── ...
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── documentation/             # Project documentation
└── ...
```

---

## Performance Considerations

- **Server-side rendering** for faster initial page loads
- **Redis caching** for frequently accessed data
- **Database indexing** on frequently queried fields
- **Lazy loading** for components and routes
- **Image optimization** via Next.js Image component
- **API response caching** where appropriate

---

## Scalability

### Current Capacity
- Designed for small to medium enterprises (100-1000 employees)
- Single server deployment

### Future Scalability Options
- Horizontal scaling with load balancers
- Database replication (master-slave)
- Microservices architecture migration
- CDN for static assets
- Containerization (Docker/Kubernetes)

---

## Support & Maintenance

### Monitoring
- Application logs
- Error tracking
- Performance monitoring
- Database query optimization

### Backup Strategy
- Daily database backups
- Document storage backups
- Configuration backups

---

## Project Status

**Current Phase**: Production-ready

### Completed Features
✅ Employee management
✅ Attendance tracking
✅ Leave management
✅ Payroll processing
✅ Tax calculations
✅ VoIP integration
✅ Issue tracking
✅ Authentication & authorization

### Known Limitations
- Single-tenant architecture
- Limited mobile responsiveness (some pages)
- Manual backup processes
- No real-time notifications (polling-based)

---

## Contact Information

For technical queries or support, refer to the development team documentation.

---

## Document Version
- **Version**: 1.0
- **Last Updated**: November 13, 2025
- **Author**: Development Team
