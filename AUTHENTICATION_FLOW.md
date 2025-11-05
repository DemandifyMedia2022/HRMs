# Secure Two-Step JWT Authentication Flow

## Overview
This HRMS application implements a secure two-step authentication flow that separates token generation from user data retrieval, following security best practices.

## The Castle Gate Analogy

### 🏰 Gate 1: Login Gate (Credentials Check)
**Endpoint:** `POST /api/auth/login`

**What happens:**
- User provides email and password
- System validates credentials against database
- If valid, generates JWT access token and refresh token
- Returns **ONLY** the token and success message
- **Does NOT** return user role, department, or other sensitive data yet

**Response:**
```json
{
  "success": true,
  "message": "Login successful. Token generated.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 42
}
```

**Security principle:** *"You say you're Sir Email-Password? Here's your entry token. Welcome, but I'm not giving you access to the treasury yet."*

---

### 🛡️ Gate 2: Validation Gate (Token Verification)
**Endpoint:** `POST /api/auth/validate`

**What happens:**
- Client sends the token received from login
- System validates token signature and expiration
- Checks token format and structure
- Returns success if token is valid
- **Still does NOT** fetch user data from database

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token validated successfully",
  "userId": 42
}
```

**Security principle:** *"Show token. Let me verify it's authentic and not expired."*

---

### 📜 Gate 3: Treasury Gate (User Details Fetch)
**Endpoint:** `POST /api/auth/user-details`

**What happens:**
- Client sends the validated token
- System verifies token again (defense in depth)
- Fetches user data from database using token payload
- Determines user role based on department and name
- Returns complete user profile with role

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome! You are a ADMIN",
  "user": {
    "id": 42,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "department": "administration",
    "emp_code": "EMP001"
  }
}
```

**Security principle:** *"Let me check your official scrolls... oh you're a Knight (role admin). Proceed."*

---

### 🚪 Gate 4: Redirection (Role-Based Access)
**Location:** Frontend (`page.tsx`)

**What happens:**
- Client receives user role from Gate 3
- Redirects user to appropriate dashboard based on role:
  - **Admin** → `/pages/admin`
  - **HR** → `/pages/hr`
  - **User** → `/pages/user`

**Security principle:** *"Proceed to your designated area based on your rank."*

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: POST /api/auth/login                                   │
│  ├─ Validate email & password                                   │
│  ├─ Generate JWT token                                          │
│  ├─ Set httpOnly cookies                                        │
│  └─ Return: { success, token, userId }                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: POST /api/auth/validate                                │
│  ├─ Verify token signature                                      │
│  ├─ Check token expiration                                      │
│  ├─ Validate token structure                                    │
│  └─ Return: { success, message, userId }                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: POST /api/auth/user-details                            │
│  ├─ Verify token again (defense in depth)                       │
│  ├─ Fetch user from database                                    │
│  ├─ Determine role (admin/hr/user)                              │
│  └─ Return: { success, user: { role, name, email, ... } }       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Role-Based Redirection                                 │
│  ├─ Admin → /pages/admin                                        │
│  ├─ HR → /pages/hr                                              │
│  └─ User → /pages/user                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Benefits

### 1. **Separation of Concerns**
- Token generation is separate from data retrieval
- Each step has a single responsibility
- Easier to audit and maintain

### 2. **Defense in Depth**
- Multiple validation layers
- Token verified at each step
- Database queries only after token validation

### 3. **Minimal Information Disclosure**
- Login only returns token, not user data
- Role information only revealed after full validation
- Reduces attack surface for credential stuffing

### 4. **Token Integrity**
- Token validated before any database operations
- Prevents unnecessary database queries with invalid tokens
- Reduces load on database

### 5. **Audit Trail**
- Each step can be logged independently
- Easier to track authentication failures
- Better security monitoring

---

## Middleware Protection

The `middleware.ts` file provides additional protection:

1. **Rate Limiting:** Prevents brute force attacks
2. **Path Validation:** Blocks path traversal attempts
3. **Security Headers:** CSP, XSS protection, etc.
4. **Role-Based Access Control:** Enforces role permissions
5. **Token Refresh:** Automatic token rotation

---

## Token Storage

### Access Token
- **Storage:** httpOnly cookie
- **Lifetime:** 15 minutes
- **Purpose:** Short-lived authentication
- **Security:** Cannot be accessed by JavaScript

### Refresh Token
- **Storage:** httpOnly cookie (session)
- **Lifetime:** 30 days (server-side)
- **Purpose:** Token rotation without re-login
- **Security:** Cleared on browser close

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/auth/login` | POST | Validate credentials, generate token | Token only |
| `/api/auth/validate` | POST | Verify token validity | Success status |
| `/api/auth/user-details` | POST | Fetch user data with token | User profile + role |
| `/api/auth/me` | GET | Get current user (uses cookie) | User profile |
| `/api/auth/refresh` | POST | Rotate tokens | New tokens |
| `/api/auth/logout` | POST | Clear session | Success |

---

## Role Determination Logic

Roles are determined based on:

1. **Special Cases:**
   - "Viresh Kumbhar" → Always `admin`

2. **Department-Based:**
   - `hr` department → `hr` role
   - `administration` department → `admin` role
   - All other departments → `user` role

3. **Default:** `user` role

---

## Error Handling

Each step includes comprehensive error handling:

- **Invalid credentials:** 401 Unauthorized
- **Missing token:** 400 Bad Request
- **Invalid token format:** 401 Unauthorized
- **Expired token:** 401 Unauthorized
- **User not found:** 404 Not Found
- **Server errors:** 500 Internal Server Error

---

## Testing the Flow

### Manual Testing

1. **Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

2. **Validate Token:**
```bash
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'
```

3. **Get User Details:**
```bash
curl -X POST http://localhost:3000/api/auth/user-details \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'
```

---

## Environment Variables

Required in `.env`:

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-here
REFRESH_TOKEN_EXPIRES_IN=30d
NODE_ENV=production
```

---

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
2. **Biometric Authentication**
3. **OAuth2/OIDC Integration**
4. **Session Management Dashboard**
5. **Anomaly Detection**
6. **Geographic Restrictions**

---

## Compliance

This authentication flow helps meet:

- **OWASP Top 10** security standards
- **GDPR** data protection requirements
- **SOC 2** compliance standards
- **ISO 27001** information security standards

---

## Support

For issues or questions about the authentication flow, contact the development team.
