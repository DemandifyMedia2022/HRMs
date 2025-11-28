# Database Schema Documentation

## Table of Contents
1. [Database Overview](#database-overview)
2. [Core Tables](#core-tables)
3. [Financial Tables](#financial-tables)
4. [Operational Tables](#operational-tables)
5. [Communication Tables](#communication-tables)
6. [Relationships](#relationships)
7. [Indexes](#indexes)
8. [Data Types](#data-types)

---

## Database Overview

### Database Information
- **Database Type**: MySQL 8.x
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **ORM**: Prisma 6.17.0
- **Total Tables**: 30+

### Design Principles
- Normalized to 3NF for most tables
- Strategic denormalization for performance
- Comprehensive audit trails (created_at, updated_at)
- Soft deletes (deleted_user_informations)

---

## Core Tables

### 1. users (Employee Master Table)

**Purpose**: Central repository for all employee information

**Key Fields**:
```sql
id                  BIGINT PRIMARY KEY AUTO_INCREMENT
Full_name           VARCHAR(255)
email               VARCHAR(55) UNIQUE
password            VARCHAR(255)
emp_code            VARCHAR(55)
department          VARCHAR(55)
job_role            VARCHAR(55)
type                VARCHAR(55) DEFAULT 'user'  -- admin, hr, user
employment_status   VARCHAR(55)
joining_date        VARCHAR(55)
retirement_date     VARCHAR(55)
CTC                 VARCHAR(255)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Indexes**:
- PRIMARY KEY: `id`
- UNIQUE: `email`
- INDEX: `emp_code`, `department`, `type`

**Relationships**:
- One-to-Many with `attendance`
- One-to-Many with `leavedata`
- One-to-One with `tax`
- One-to-One with `provident_fund`

---

### 2. attendance

**Purpose**: Daily attendance tracking

**Key Fields**:
```sql
id                      INT PRIMARY KEY AUTO_INCREMENT
email                   VARCHAR(255)
date                    DATE
login_time              VARCHAR(255)
logout_time             VARCHAR(255)
login_hours             VARCHAR(55)
status                  VARCHAR(11)  -- present, absent, leave
shift_time              VARCHAR(55)
morning_break_start     TIME
morning_break_end       TIME
lunch_break_start       TIME
lunch_break_end         TIME
evening_break_start     TIME
evening_break_end       TIME
working_hours           TIME
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `email`, `date`
- COMPOSITE: `(email, date)`

---

### 3. leavedata

**Purpose**: Leave applications and approvals

**Key Fields**:
```sql
l_id                    INT PRIMARY KEY AUTO_INCREMENT
emp_code                VARCHAR(255)
leave_type              VARCHAR(55)  -- Paid Leave, Sick Leave, etc.
start_date              DATE
end_date                DATE
reason                  VARCHAR(1000)
HRapproval              VARCHAR(255)  -- pending, approved, rejected
Managerapproval         VARCHAR(255)
HRrejectReason          VARCHAR(255)
ManagerRejecjetReason   VARCHAR(255)
status                  VARCHAR(20)
leaveregdate            DATE
added_by_user           VARCHAR(255)
Team                    VARCHAR(55)
```

**Indexes**:
- PRIMARY KEY: `l_id`
- INDEX: `emp_code`, `status`, `start_date`

---

### 4. npattendance

**Purpose**: Normalized attendance data from biometric devices

**Key Fields**:
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
employeeId      INT
empName         VARCHAR(255)
date            DATE
inTime          TIME
outTime         TIME
loginHours      TIME
totalHours      TIME
breakHours      TIME
status          VARCHAR(255)
clockTimes      TEXT  -- JSON array of clock events
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## Financial Tables

### 1. tax

**Purpose**: Employee tax calculations

**Key Fields**:
```sql
user_id                         INT PRIMARY KEY
Full_name                       VARCHAR(255)
emp_code                        VARCHAR(55)
income_salary                   INT
Basic_salary                    INT
Gross_salary                    INT
Standard_deduction              INT
Profession_Tax                  INT
Total_Taxable_income            INT
Deductions_80C                  INT
Deductions_80D                  INT
Total_Deductions                INT
Total_Taxable                   INT
Tax_on_the_above                INT
Total_Tax_liability             INT
```

---

### 2. provident_fund

**Purpose**: PF configuration and calculations

**Key Fields**:
```sql
id                      INT PRIMARY KEY AUTO_INCREMENT
user_id                 INT
pf_contribution         VARCHAR(255)
employee_contribution   VARCHAR(255)
pension                 DECIMAL(10,2)
wage_limit              VARCHAR(255)
contribution_limit      VARCHAR(255)
admin_charge            VARCHAR(20)
edli_contribution       DECIMAL(10,1)
exemption_limit         VARCHAR(255)
```

---

### 3. employee_insurance

**Purpose**: ESI (Employee State Insurance) management

**Key Fields**:
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
user_id         INT
esi             VARCHAR(255)
wage            VARCHAR(255)
esi_limit       VARCHAR(255)
employer_esi    VARCHAR(255)
employee_esi    VARCHAR(255)
```

---

### 4. professionaltax

**Purpose**: Professional tax configuration

**Key Fields**:
```sql
id                  INT PRIMARY KEY AUTO_INCREMENT
user_id             INT
professional_tax    VARCHAR(255)
separate            VARCHAR(255)
disabled            VARCHAR(255)
exemption           VARCHAR(255)
exemption_limit     VARCHAR(255)
```

---

### 5. gratuity

**Purpose**: Gratuity calculations

**Key Fields**:
```sql
id          INT PRIMARY KEY AUTO_INCREMENT
user_id     INT
Gratuity    VARCHAR(255)
```

---

### 6. bonus

**Purpose**: Bonus management

**Key Fields**:
```sql
id          INT PRIMARY KEY AUTO_INCREMENT
user_id     INT
bonus       VARCHAR(255)
```

---

### 7. investment_declaration

**Purpose**: Tax investment declarations (80C, 80D, etc.)

**Key Fields**:
```sql
id                      INT PRIMARY KEY AUTO_INCREMENT
user_id                 INT
Full_name               VARCHAR(255)
emp_code                VARCHAR(100)
Gross_salary            VARCHAR(20)
HRA_80GG                VARCHAR(20)
HRA_Exempted            VARCHAR(20)
A_80C                   VARCHAR(20)
A_Others                VARCHAR(20)
Standard_Deduction      VARCHAR(20)
Net_taxable_income      VARCHAR(20)
Annual_Projected_TDS    VARCHAR(20)
```

---

### 8. tax_setting

**Purpose**: Tax configuration and settings

**Key Fields**:
```sql
id                      INT PRIMARY KEY AUTO_INCREMENT
user_id                 INT
children_no             INT
tution_fees             VARCHAR(20)
net_taxable_old         VARCHAR(20)
net_taxable_new         VARCHAR(28)
tax_rebate_old          VARCHAR(20)
tax_rebate_new          VARCHAR(50)
standard_deduction_old  VARCHAR(20)
standard_deduction_new  VARCHAR(20)
cess_charge             VARCHAR(20)
Senior_citizen_age      INT
super_citizen_age       INT
```

---

### 9. slabs

**Purpose**: Tax slab configuration by state and gender

**Key Fields**:
```sql
id              BIGINT PRIMARY KEY AUTO_INCREMENT
state           VARCHAR(255)
branch          VARCHAR(255)
gender1         VARCHAR(10)
min_limit1      INT
max_limit1      INT
jan1            VARCHAR(255)
feb1            VARCHAR(255)
...
dec1            VARCHAR(255)
-- Repeats for gender2, gender3, gender4, gender5
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## Operational Tables

### 1. issuedata

**Purpose**: Employee grievances and issue tracking

**Key Fields**:
```sql
id                      INT PRIMARY KEY AUTO_INCREMENT
name                    VARCHAR(55)
department              VARCHAR(55)
issuse_type             VARCHAR(55)
reason                  VARCHAR(2000)
added_by_user           VARCHAR(55)
status                  VARCHAR(11)
Date_Attendance_Update  DATE
Attendance_status       VARCHAR(255)
Attendance_Approval     VARCHAR(255)
raisedate               DATETIME
resolved_date           DATETIME
resolution_comment      TEXT
acknowledgement_status  VARCHAR(55)
resolved_by             VARCHAR(255)
```

---

### 2. crud_events

**Purpose**: Event management (birthdays, celebrations, etc.)

**Key Fields**:
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
event_name      VARCHAR(255)
event_date      DATETIME
event_start     DATE
event_end       DATE
description     TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

### 3. birthday_wishes

**Purpose**: Birthday wishes tracking

**Key Fields**:
```sql
id          BIGINT PRIMARY KEY AUTO_INCREMENT
user_id     BIGINT
wished_by   BIGINT
message     TEXT
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

---

### 4. shift_time

**Purpose**: Employee shift schedules

**Key Fields**:
```sql
Id              INT PRIMARY KEY AUTO_INCREMENT
Full_name       VARCHAR(255)
biomatric_id    INT
shift_time      VARCHAR(255)
group_name      VARCHAR(255)
```

---

## Communication Tables

### 1. call_data

**Purpose**: VoIP call logs

**Key Fields**:
```sql
id                  BIGINT PRIMARY KEY AUTO_INCREMENT
extension           VARCHAR(64)
destination         VARCHAR(64)
direction           VARCHAR(16)  -- inbound, outbound
status              VARCHAR(32)  -- answered, missed, busy
start_time          DATETIME
answer_time         DATETIME
end_time            DATETIME
duration_seconds    INT
recording_url       TEXT
user_name           VARCHAR(255)
source_number       VARCHAR(64)
region              VARCHAR(64)
created_at          TIMESTAMP
```

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `extension`, `start_time`, `status`

---

### 2. extensions

**Purpose**: VoIP extension management

**Key Fields**:
```sql
id          BIGINT PRIMARY KEY AUTO_INCREMENT
extension   VARCHAR(64) UNIQUE
username    VARCHAR(128)
password    VARCHAR(255)
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

---

### 3. sip_credentials

**Purpose**: SIP authentication credentials

**Key Fields**:
```sql
id              BIGINT PRIMARY KEY AUTO_INCREMENT
email           VARCHAR(255) UNIQUE
extension       VARCHAR(64)
sip_password    VARCHAR(255)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## Data Mining & Campaign Tables

### 1. dm_form

**Purpose**: Lead management and data mining

**Key Fields**:
```sql
f_id                INT PRIMARY KEY AUTO_INCREMENT
f_campaign_name     VARCHAR(255)
f_lead              VARCHAR(255)
f_resource_name     VARCHAR(255)
f_data_source       VARCHAR(255)
f_first_name        TEXT
f_last_name         TEXT
f_email_add         VARCHAR(255)
f_conatct_no        VARCHAR(50)
f_company_name      VARCHAR(255)
f_qa_status         VARCHAR(255)
f_delivary_status   VARCHAR(11)
f_date              TIMESTAMP
form_status         INT
```

**Indexes**:
- PRIMARY KEY: `f_id`
- INDEX: `f_email_add`, `f_campaign_name`, `f_qa_status`

---

### 2. campaigns

**Purpose**: Campaign management

**Key Fields**:
```sql
id                  BIGINT PRIMARY KEY AUTO_INCREMENT
c_id                VARCHAR(64)
f_campaign_name     VARCHAR(255)
f_start_date        DATE
f_end_date          DATE
f_assignto          VARCHAR(255)
f_allocation        INT
f_method            VARCHAR(255)
f_script            TEXT
f_script_url        VARCHAR(512)
f_status            BOOLEAN DEFAULT true
created_at          TIMESTAMP
```

---

### 3. dispositions

**Purpose**: Call disposition codes

**Key Fields**:
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
dispositions    VARCHAR(255)
```

---

### 4. internal_suppression1

**Purpose**: Suppression list for campaigns

**Key Fields**:
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
date            VARCHAR(9)
method          VARCHAR(6)
internal_id     VARCHAR(11)
sponsor         VARCHAR(14)
campaign_name   VARCHAR(77)
first_name      VARCHAR(21)
last_name       VARCHAR(35)
email_id        VARCHAR(62)
company_name    VARCHAR(81)
```

---

## Audit & System Tables

### 1. deleted_user_informations

**Purpose**: Audit trail for deleted employees

**Key Fields**: Same as `users` table plus:
```sql
Deleted_User_ID             INT PRIMARY KEY AUTO_INCREMENT
date_of_resignation         DATE
expected_last_working_day   DATE
date_of_relieving           DATE
resignation_reason_employee VARCHAR(255)
```

---

### 2. migrations

**Purpose**: Database migration tracking

**Key Fields**:
```sql
id          INT PRIMARY KEY AUTO_INCREMENT
migration   VARCHAR(255)
batch       INT
```

---

### 3. failed_jobs

**Purpose**: Failed job queue tracking

**Key Fields**:
```sql
id          BIGINT PRIMARY KEY AUTO_INCREMENT
uuid        VARCHAR(255) UNIQUE
connection  TEXT
queue       TEXT
payload     LONGTEXT
exception   LONGTEXT
failed_at   TIMESTAMP
```

---

### 4. password_reset_tokens

**Purpose**: Password reset token management

**Key Fields**:
```sql
email       VARCHAR(255) PRIMARY KEY
token       VARCHAR(255)
created_at  TIMESTAMP
```

---

### 5. personal_access_tokens

**Purpose**: API token management

**Key Fields**:
```sql
id              BIGINT PRIMARY KEY AUTO_INCREMENT
tokenable_type  VARCHAR(255)
tokenable_id    BIGINT
name            VARCHAR(255)
token           VARCHAR(64) UNIQUE
abilities       TEXT
last_used_at    TIMESTAMP
expires_at      TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## Relationships

### Entity Relationship Diagram

```
users (1) ----< (M) attendance
users (1) ----< (M) leavedata
users (1) ---- (1) tax
users (1) ---- (1) provident_fund
users (1) ---- (1) employee_insurance
users (1) ---- (1) professionaltax
users (1) ---- (1) gratuity
users (1) ---- (1) bonus
users (1) ---- (1) investment_declaration
users (1) ---- (1) sip_credentials (via email)

campaigns (1) ----< (M) dm_form
extensions (1) ----< (M) call_data
```

### Foreign Key Relationships

**Note**: Current schema uses logical relationships without explicit foreign key constraints. Recommended to add foreign keys for data integrity:

```sql
-- Recommended foreign keys
ALTER TABLE attendance 
  ADD CONSTRAINT fk_attendance_user 
  FOREIGN KEY (email) REFERENCES users(email);

ALTER TABLE leavedata 
  ADD CONSTRAINT fk_leave_user 
  FOREIGN KEY (emp_code) REFERENCES users(emp_code);

ALTER TABLE tax 
  ADD CONSTRAINT fk_tax_user 
  FOREIGN KEY (user_id) REFERENCES users(id);
```

---

## Indexes

### Recommended Indexes for Performance

```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_emp_code ON users(emp_code);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_users_status ON users(employment_status);

-- Attendance table
CREATE INDEX idx_attendance_email ON attendance(email);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_email_date ON attendance(email, date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Leave table
CREATE INDEX idx_leave_emp_code ON leavedata(emp_code);
CREATE INDEX idx_leave_status ON leavedata(status);
CREATE INDEX idx_leave_dates ON leavedata(start_date, end_date);

-- Call data table
CREATE INDEX idx_call_extension ON call_data(extension);
CREATE INDEX idx_call_start_time ON call_data(start_time);
CREATE INDEX idx_call_status ON call_data(status);

-- DM Form table
CREATE INDEX idx_dm_campaign ON dm_form(f_campaign_name);
CREATE INDEX idx_dm_email ON dm_form(f_email_add);
CREATE INDEX idx_dm_status ON dm_form(f_qa_status);
```

---

## Data Types

### Common Data Type Usage

| MySQL Type | Usage | Example Fields |
|------------|-------|----------------|
| `BIGINT` | Large integers, IDs | `id`, `user_id` |
| `INT` | Standard integers | `age`, `count` |
| `VARCHAR(n)` | Variable strings | `name`, `email` |
| `TEXT` | Long text | `description`, `reason` |
| `DATE` | Date only | `dob`, `joining_date` |
| `TIME` | Time only | `login_time`, `break_start` |
| `DATETIME` | Date and time | `created_at`, `event_date` |
| `TIMESTAMP` | Auto-updating timestamp | `updated_at` |
| `DECIMAL(p,s)` | Precise decimals | `salary`, `tax_amount` |
| `BOOLEAN` | True/false | `is_active`, `f_status` |

---

## Document Version
- **Version**: 1.0
- **Last Updated**: November 13, 2025
- **Author**: Development Team
