# 🏰 Security Gates - Visual Guide

## The Castle Authentication System

```
                    🚶 USER ARRIVES AT LOGIN PAGE
                              │
                              │ Enters Email & Password
                              ▼
        ╔═══════════════════════════════════════════════╗
        ║         🏰 GATE 1: LOGIN GATE                 ║
        ║    "You say you're Sir Email-Password?"      ║
        ╠═══════════════════════════════════════════════╣
        ║  POST /api/auth/login                         ║
        ║  ✓ Check email exists in database             ║
        ║  ✓ Verify password hash matches               ║
        ║  ✓ Generate JWT access token                  ║
        ║  ✓ Generate refresh token                     ║
        ║  ✓ Set httpOnly cookies                       ║
        ║                                               ║
        ║  ❌ NO ROLE REVEALED YET                      ║
        ║  ❌ NO USER DETAILS RETURNED                  ║
        ║                                               ║
        ║  Returns: { token, userId, success }          ║
        ╚═══════════════════════════════════════════════╝
                              │
                              │ Token: "eyJhbGc..."
                              ▼
        ╔═══════════════════════════════════════════════╗
        ║      🛡️ GATE 2: VALIDATION GATE               ║
        ║   "Show token. Let me verify it's real."     ║
        ╠═══════════════════════════════════════════════╣
        ║  POST /api/auth/validate                      ║
        ║  ✓ Verify JWT signature                       ║
        ║  ✓ Check token not expired                    ║
        ║  ✓ Validate token structure                   ║
        ║  ✓ Confirm payload integrity                  ║
        ║                                               ║
        ║  ❌ STILL NO DATABASE QUERY                   ║
        ║  ❌ STILL NO ROLE REVEALED                    ║
        ║                                               ║
        ║  Returns: { success, userId }                 ║
        ╚═══════════════════════════════════════════════╝
                              │
                              │ Token Validated ✓
                              ▼
        ╔═══════════════════════════════════════════════╗
        ║       📜 GATE 3: TREASURY GATE                ║
        ║  "Let me check your official scrolls..."     ║
        ╠═══════════════════════════════════════════════╣
        ║  POST /api/auth/user-details                  ║
        ║  ✓ Re-verify token (defense in depth)        ║
        ║  ✓ Query database for user record             ║
        ║  ✓ Fetch department & name,                    ║
        ║  ✓ Determine role based on rules:            ║
        ║    • "Viresh Kumbhar" → admin                 ║
        ║    • department="hr" → hr                     ║
        ║    • department="administration" → admin      ║
        ║    • others → user                            ║
        ║                                               ║
        ║  ✅ NOW ROLE IS REVEALED                      ║
        ║  ✅ FULL USER PROFILE RETURNED                ║
        ║                                               ║
        ║  Returns: { user: { role, name, email... } }  ║
        ╚═══════════════════════════════════════════════╝
                              │
                              │ Role: "admin" / "hr" / "user"
                              ▼
        ╔═══════════════════════════════════════════════╗
        ║      🚪 GATE 4: REDIRECTION GATE              ║
        ║   "Proceed to your designated area."         ║
        ╠═══════════════════════════════════════════════╣
        ║  Frontend Logic (page.tsx)                    ║
        ║                                               ║
        ║  if (role === 'admin')                        ║
        ║    → /pages/admin                             ║
        ║                                               ║
        ║  else if (role === 'hr')                      ║
        ║    → /pages/hr                                ║
        ║                                               ║
        ║  else                                         ║
        ║    → /pages/user                              ║
        ╚═══════════════════════════════════════════════╝
                              │
                              ▼
                    🎯 USER AT CORRECT DASHBOARD
```

---

## 🔐 Security Principles Applied

### 1. **Principle of Least Privilege**
Each gate only reveals the minimum information needed:
- Gate 1: Only token (no role)
- Gate 2: Only validation status (no user data)
- Gate 3: Full user data (after full validation)

### 2. **Defense in Depth**
Multiple layers of security:
- Password hashing (bcrypt)
- JWT signature verification
- Token expiration checks
- Database validation
- Role-based access control

### 3. **Separation of Concerns**
Each endpoint has one job:
- `/login` → Authenticate credentials
- `/validate` → Verify token integrity
- `/user-details` → Fetch user data
- Frontend → Handle redirection

### 4. **Zero Trust Architecture**
Never trust, always verify:
- Token verified at each step
- Database queried only after token validation
- Role determined from authoritative source (DB)

---

## 📊 Data Flow Timeline

```
Time →  0ms          100ms         200ms         300ms         400ms
        │            │             │             │             │
User:   Login ──────→ Wait ──────→ Wait ──────→ Wait ──────→ Redirected
        │            │             │             │             │
Step:   Gate 1       Gate 2        Gate 3        Gate 4        Dashboard
        │            │             │             │             │
Data:   Token        Validated     Role          Redirect      Page Load
        Only         ✓             Revealed      Based on      Complete
                                                 Role
```

---

## 🎭 What Each Gate Knows

| Gate | Has Token? | Knows Role? | Has User Data? | DB Query? |
|------|-----------|-------------|----------------|-----------|
| **Gate 1: Login** | ✅ Generates | ❌ No | ❌ No | ✅ Yes (auth only) |
| **Gate 2: Validate** | ✅ Verifies | ❌ No | ❌ No | ❌ No |
| **Gate 3: Treasury** | ✅ Re-verifies | ✅ Yes | ✅ Yes | ✅ Yes (full user) |
| **Gate 4: Redirect** | ✅ Has (cookie) | ✅ Yes | ✅ Yes | ❌ No |

---

## 🚨 Attack Scenarios & Defenses

### Scenario 1: Token Tampering
```
Attacker: Modifies token payload to change role
Defense:  Gate 2 validates signature → Fails
Result:   Access denied, no DB query wasted
```

### Scenario 2: Expired Token
```
Attacker: Uses old valid token
Defense:  Gate 2 checks expiration → Fails
Result:   Must re-authenticate
```

### Scenario 3: Credential Stuffing
```
Attacker: Tries many username/password combos
Defense:  Rate limiting in middleware → Blocks
Result:   IP blocked after 100 requests/minute
```

### Scenario 4: SQL Injection
```
Attacker: Injects SQL in email field
Defense:  Prisma ORM parameterizes queries
Result:   Injection attempt fails safely
```

### Scenario 5: XSS Attack
```
Attacker: Tries to steal token via JavaScript
Defense:  httpOnly cookies → Not accessible
Result:   Token cannot be read by scripts
```

---

## 🎯 Why This Flow is Better

### ❌ Old Flow (Single Step)
```
Login → Get Token + Role + All Data → Redirect
```
**Problems:**
- Too much information at once
- Can't validate token separately
- Harder to audit
- Single point of failure

### ✅ New Flow (Multi-Step)
```
Login → Get Token → Validate → Get Role → Redirect
```
**Benefits:**
- Gradual information disclosure
- Independent validation
- Better audit trail
- Multiple security checkpoints

---

## 📝 Code Locations

| Component | File Path |
|-----------|-----------|
| **Gate 1** | `src/app/api/auth/login/route.ts` |
| **Gate 2** | `src/app/api/auth/validate/route.ts` |
| **Gate 3** | `src/app/api/auth/user-details/route.ts` |
| **Gate 4** | `src/app/page.tsx` (handleSubmit) |
| **Middleware** | `middleware.ts` |
| **Auth Utils** | `src/lib/auth.ts` |

---

## 🧪 Testing Commands

### Test Gate 1 (Login)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Gate 2 (Validate)
```bash
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_FROM_GATE_1"}'
```

### Test Gate 3 (User Details)
```bash
curl -X POST http://localhost:3000/api/auth/user-details \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_FROM_GATE_1"}'
```

---

## 🎓 Key Takeaways

1. **Token ≠ Identity**: Token proves authentication, not authorization
2. **Validate Early**: Check token before expensive DB operations
3. **Reveal Gradually**: Don't expose all data at once
4. **Multiple Layers**: Each gate adds security
5. **Audit Everything**: Each step can be logged independently

---

**Remember:** Security is like an onion 🧅 - it has layers, and sometimes it makes you cry when you implement it wrong! 😄
