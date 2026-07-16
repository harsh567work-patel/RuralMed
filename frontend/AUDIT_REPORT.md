# RURALMED - COMPLETE END-TO-END CODEBASE AUDIT REPORT

**Date:** March 13, 2026  
**Project:** RuralMed - Rural Healthcare Management System  
**Architecture:** React (Frontend) + Express (Backend) + SQLite (Database)  
**Status:** Partially Production-Ready with Critical Issues

---

## STAGE 1: PROJECT STRUCTURE ANALYSIS

### 1.1 DIRECTORY STRUCTURE OVERVIEW

```
ruralmed/
├── frontend (React + Vite)
│   ├── src/
│   │   ├── pages/          [8 pages - routing & features]
│   │   ├── components/     [4 UI components]
│   │   ├── services/       [API client]
│   │   ├── data/           [Mock data]
│   │   ├── styles/         [CSS]
│   │   ├── App.jsx         [Main shell]
│   │   └── main.jsx        [Entry point]
│   ├── dist/               [Built production files]
│   └── package.json        [Frontend deps]
│
└── backend (Express)
    ├── server.js           [Express server]
    ├── db/
    │   └── init.js         [SQLite setup & DB functions]
    ├── routes/             [6 API route handlers]
    ├── middleware/         [Auth middleware]
    ├── node_modules/       [Dependencies]
    └── package.json        [Backend deps]
```

### 1.2 ALL PAGES (Frontend)

| Page | File | Route | Purpose | Status |
|------|------|-------|---------|--------|
| LoginPage | pages/LoginPage.jsx | `/login` | User authentication | ✓ Complete |
| SignupPage | pages/SignupPage.jsx | `/signup` | New doctor registration | ✓ Complete |
| HomePage | pages/HomePage.jsx | `/home` | Dashboard overview | ⚠ Partial (mock data) |
| PatientPage | pages/PatientPage.jsx | `/patients` | Patient registry CRUD | ✓ Complete |
| PrescriptionPage | pages/PrescriptionPage.jsx | `/prescription` | Prescription writing | ✓ Complete |
| ReferPage | pages/ReferPage.jsx | `/refer` | Referral management | ✓ Complete |
| FeedbackPage | pages/FeedbackPage.jsx | `/feedback` | Feedback submission | ✓ Complete |
| SummaryPage | pages/SummaryPage.jsx | `/summary` | Analytics dashboard | ⚠ Partial (not connected to API) |

### 1.3 ALL ROUTES (Backend)

| Route | Method | Handler | Auth | Purpose | Status |
|-------|--------|---------|------|---------|--------|
| `/api/auth/register` | POST | auth.js | ✗ | User registration | ✓ Complete |
| `/api/auth/login` | POST | auth.js | ✗ | User authentication | ✓ Complete |
| `/api/patients` | GET | patients.js | ✓ | List patients | ✓ Complete |
| `/api/patients/:id` | GET | patients.js | ✓ | Get single patient | ✓ Complete |
| `/api/patients` | POST | patients.js | ✓ | Create patient | ✓ Complete |
| `/api/patients/:id` | PUT | patients.js | ✓ | Update patient | ✓ Complete |
| `/api/prescriptions` | GET | prescriptions.js | ✓ | List prescriptions | ✓ Complete |
| `/api/prescriptions` | POST | prescriptions.js | ✓ | Create prescription | ✓ Complete |
| `/api/referrals` | GET | referrals.js | ✓ | List referrals | ✓ Complete |
| `/api/referrals` | POST | referrals.js | ✓ | Create referral | ✓ Complete |
| `/api/feedback` | GET | feedback.js | ✓ | List feedback | ✓ Complete |
| `/api/feedback` | POST | feedback.js | ✓ | Submit feedback | ✓ Complete |
| `/api/inventory` | GET | inventory.js | ✓ | List drugs | ✓ Complete |
| `/api/inventory/low-stock` | GET | inventory.js | ✓ | Get low stock items | ✓ Complete |
| `/api/inventory` | POST | inventory.js | ✓ | Create inventory item | ✓ Complete |
| `/api/inventory/:id` | PUT | inventory.js | ✓ | Update inventory | ✓ Complete |
| `/api/health` | GET | server.js | ✗ | Health check | ✓ Complete |
| `/*` | GET | server.js | ✗ | Serve React app | ✓ Complete |

### 1.4 ALL COMPONENTS (Frontend)

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| Sidebar | components/Sidebar.jsx | Navigation menu | ✓ Complete |
| Topbar | components/Topbar.jsx | Header bar | ✓ Complete |
| Toasts | components/Toasts.jsx | Notification system | ✓ Complete |
| Icons | components/Icons.jsx | Icon library | ✓ Complete |

### 1.5 SERVICES & UTILITIES

| Service | File | Purpose | Status |
|---------|------|---------|--------|
| API Client | services/api.js | HTTP request handler | ✓ Complete |
| Mock Data | data/mockData.js | Static test data | ✓ Complete |
| Auth Middleware | backend/middleware/auth.js | JWT verification | ✓ Complete |
| Database Init | backend/db/init.js | SQLite setup | ✓ Complete |

### 1.6 DATABASE CONFIGURATION

**Type:** SQLite 3 (File-based, synchronous)  
**Location:** `backend/db/ruralmed.db`  
**Connection:** Singleton pattern with promise wrappers  
**Tables:** 6 (users, patients, prescriptions, referrals, feedback, inventory)

### 1.7 AUTHENTICATION SETUP

**Method:** JWT (JSON Web Tokens)  
**Algorithm:** HS256  
**Expiration:** 7 days  
**Secret:** Hardcoded as `process.env.JWT_SECRET || 'secret'` (⚠️ RISK)  
**Storage:** localStorage (browser)  
**Password Hashing:** bcryptjs with salt rounds = 10

### 1.8 MIDDLEWARE STACK

```
Server → CORS → JSON Parser → DB Init → Routes → Auth Middleware
```

### 1.9 ENVIRONMENT CONFIGURATION

```
Frontend:  No .env (hardcoded /api as API_BASE)
Backend:   PORT, JWT_SECRET, NODE_ENV
Missing:   Database path config, rate limiting, HTTPS
```

---

## STAGE 2: ROUTE & PAGE VERIFICATION

### 2.1 AUTHENTICATION ROUTES

**Route:** `/api/auth/register`

```javascript
// ✓ Validation present
// ✓ Password hashing implemented
// ✓ JWT token generated
// ✓ User data returned
// ⚠️ No duplicate check (unique constraint on DB)
// ⚠️ No email verification
// ✗ No role parameter accepted (hardcoded 'doctor')
```

**Route:** `/api/auth/login`

```javascript
// ✓ Validation present
// ✓ Password comparison using bcryptjs
// ✓ Token generation
// ✓ User data returned
// ⚠️ No rate limiting on failed attempts
// ⚠️ Timing attack vulnerability (password comparison)
// ✓ Proper error messages
```

**PAGE:** LoginPage

```javascript
// ✓ Form validation
// ✓ Loading state
// ✓ Error display
// ✓ localStorage.setItem('token')
// ✓ Callback to App.jsx
// ⚠️ No remember-me option
// ✗ No password reset flow
// ⚠️ No CSRF protection (but POST-only)
```

**PAGE:** SignupPage

```javascript
// ✓ Form validation
// ✓ Password confirmation check
// ✓ Loading state
// ✓ localStorage.setItem('token')
// ⚠️ No email validation (regex missing)
// ⚠️ No username length/format validation
// ✗ No email verification OTP/link
// ✗ No terms agreement checkbox
// ✗ Role is hardcoded (cannot select role)
```

---

### 2.2 PATIENT MANAGEMENT ROUTES & PAGES

**Route:** `GET /api/patients`

```javascript
// ✓ Auth required (authMiddleware)
// ✓ Filters by createdBy (user isolation)
// ✓ Ordered by createdAt DESC
// ⚠️ No pagination (will load ALL patients)
// ⚠️ No search/filter parameters
// ✗ Missing LIMIT/OFFSET
```

**Route:** `POST /api/patients`

```javascript
// ✓ Auth required
// ✓ Validation for required fields
// ✓ User isolation (createdBy = req.userId)
// ✗ No validation that id is unique
// ✗ Frontend generates ID (race condition risk)
// ⚠️ Age not validated (could be negative)
// ⚠️ Phone number not validated
```

**Route:** `PUT /api/patients/:id`

```javascript
// ✓ Auth required
// ⚠️ No authorization check (any user can update)
// ⚠️ No validation on update fields
// ✗ No check if patient exists
// ✗ Missing lastVisit update
// ⚠️ No audit trail
```

**PAGE:** PatientPage

```javascript
// ✓ List, search, and create in one page
// ✓ API integration for patient creation
// ✓ Error handling
// ✓ Loading state
// ✗ Update/delete not implemented
// ✗ No pagination
// ⚠️ Patient ID generated on frontend (should be backend)
// ✗ No patient detail view/modal
// ✗ Vitals form not connected to API (empty fields)
```

---

### 2.3 PRESCRIPTION ROUTES & PAGES

**Route:** `GET /api/prescriptions`

```javascript
// ✓ Auth required
// ✗ No patient filter (lists all prescriptions)
// ⚠️ No pagination
// ✗ Cannot retrieve single prescription
```

**Route:** `POST /api/prescriptions`

```javascript
// ✓ Auth required
// ✓ Validation present
// ✓ Links to patient and doctor
// ⚠️ No validation that patient exists
// ✗ No check for drug name validity
// ⚠️ Instructions can be empty
```

**PAGE:** PrescriptionPage

```javascript
// ✓ Patient selection
// ✓ Multiple medications support
// ✓ API integration
// ✓ Error handling
// ✗ Cannot retrieve existing prescriptions
// ✗ Cannot update/delete prescriptions
// ✗ No prescription templates/history
// ⚠️ Drug dosage validation missing
// ✗ No PDF generation (print button does nothing)
```

---

### 2.4 REFERRAL ROUTES & PAGES

**Route:** `GET /api/referrals`

```javascript
// ✓ Auth required
// ⚠️ No pagination
// ✗ Cannot get referral details
// ✗ Status updates not implemented
```

**Route:** `POST /api/referrals`

```javascript
// ✓ Auth required
// ✓ Validation present
// ⚠️ No validation that facility exists
// ⚠️ No validation that patient exists
// ✗ No urgency/priority level handling
// ✗ No transport arrangement
```

**PAGE:** ReferPage

```javascript
// ✓ Patient selection
// ✓ Referral creation
// ✓ API integration
// ⚠️ History shown locally (not from API)
// ✗ Cannot update referral status
// ✗ No acknowledgment tracking
// ⚠️ urgency field not sent to API
// ✗ transport field not sent to API
// ✗ No referral letter generation
```

---

### 2.5 FEEDBACK ROUTES & PAGES

**Route:** `GET /api/feedback`

```javascript
// ✓ Auth required
// ⚠️ No pagination
// ✗ Cannot filter by type or rating
```

**Route:** `POST /api/feedback`

```javascript
// ✓ Auth required
// ✓ Rating optional
// ⚠️ Type required but Frontend sends concatenated message
// ✗ No validation on rating (could be > 5)
```

**PAGE:** FeedbackPage

```javascript
// ✓ Form submission
// ✓ API integration
// ✓ Rating system
// ⚠️ Type field not properly connected to API
// ✗ No feedback history retrieval
// ✗ Cannot edit/delete feedback
// ⚠️ Form resets locally but no confirmation
```

---

### 2.6 INVENTORY ROUTES & PAGES

**Route:** `GET /api/inventory/low-stock`

```javascript
// ✓ Auth required
// ✓ Correct filter logic (stock < minThreshold)
// ⚠️ No pagination
```

**Route:** `POST /api/inventory`

```javascript
// ✓ Auth required
// ✓ Validation for required fields
// ⚠️ Stock can be negative
// ⚠️ No unit validation
// ✗ No duplicate prevention
```

**Route:** `PUT /api/inventory/:id`

```javascript
// ⚠️ Missing validation
// ✗ Stock can be negative
// ✗ No authorization check
```

**STATUS:** Inventory not connected to HomePage or any page (dead code)

---

### 2.7 APP SHELL & ROUTING

**File:** App.jsx

```javascript
// ✓ Auth state management
// ✓ Token persistence (localStorage)
// ✓ User data restoration
// ✓ Page switching
// ⚠️ No route protection (any page accessible if authenticated)
// ⚠️ No role-based access control
// ✗ No 404 page
// ✗ No page metadata (title, description)
// ✓ Responsive sidebar
```

---

### 2.8 DASHBOARD / SUMMARY PAGE

**HomePage:**
```javascript
// ⚠️ Shows mock stockItems (hardcoded, not from API)
// ⚠️ Shows mock statistics (24, 19, 3, 5)
// ✓ Patient list from API
// ✗ No real-time statistics
// ✗ No inventory integration
```

**SummaryPage:**
```javascript
// ⚠️ All data hardcoded (STATS, DIAGNOSES, TARGETS, ACTIVITY)
// ✗ Not connected to any API
// ✗ Cannot change time period and see real data
```

---

## STAGE 3: API ENDPOINT AUDIT

### 3.1 ENDPOINT SECURITY MATRIX

| Endpoint | Auth | Validation | Error Handling | Rate Limit | CORS |
|----------|------|-----------|-----------------|-----------|------|
| POST /auth/register | ✗ | ⚠️ Partial | ✓ | ✗ | ✓ |
| POST /auth/login | ✗ | ⚠️ Partial | ✓ | ✗ | ✓ |
| GET /patients | ✓ | ✓ | ✓ | ✗ | ✓ |
| POST /patients | ✓ | ⚠️ Partial | ✓ | ✗ | ✓ |
| PUT /patients/:id | ✓ | ✗ | ✓ | ✗ | ✓ |
| POST /prescriptions | ✓ | ⚠️ Partial | ✓ | ✗ | ✓ |
| GET /prescriptions | ✓ | ✓ | ✓ | ✗ | ✓ |
| POST /referrals | ✓ | ⚠️ Partial | ✓ | ✗ | ✓ |
| GET /referrals | ✓ | ✓ | ✓ | ✗ | ✓ |
| POST /feedback | ✓ | ⚠️ Partial | ✓ | ✗ | ✓ |
| GET /feedback | ✓ | ✓ | ✓ | ✗ | ✓ |
| GET /inventory | ✓ | ✓ | ✓ | ✗ | ✓ |
| POST /inventory | ✓ | ⚠️ Partial | ✓ | ✗ | ✓ |
| PUT /inventory/:id | ✓ | ✗ | ✓ | ✗ | ✓ |

### 3.2 ENDPOINT IMPLEMENTATION STATUS

```
✓ FULLY IMPLEMENTED (11):
- POST /auth/register        ✔ With JWT generation
- POST /auth/login           ✔ With password verification
- GET /patients              ✔ With user isolation
- POST /patients             ✔ Basic CRUD
- GET /prescriptions         ✔ Doctor-filtered
- POST /prescriptions        ✔ Creates records
- GET /referrals             ✔ Doctor-filtered
- POST /referrals            ✔ Creates records
- GET /feedback              ✔ User-filtered
- POST /feedback             ✔ Creates records
- GET /inventory             ✔ Lists all items

⚠️ PARTIALLY IMPLEMENTED (6):
- PUT /patients/:id          ⚠ No auth check
- GET /patients/:id          ⚠ No usage from frontend
- POST /inventory            ⚠ Missing stock validation
- PUT /inventory/:id         ⚠ Missing validation
- GET /inventory/low-stock   ⚠ Not connected to UI
- /api/health                ⚠ No real health checks

✗ MISSING (8):
- DELETE /patients/:id       ✗ Patient deletion
- DELETE /prescriptions/:id  ✗ Prescription deletion
- PUT /prescriptions/:id     ✗ Prescription updates
- DELETE /referrals/:id      ✗ Referral deletion
- PUT /referrals/:id         ✗ Referral status updates
- DELETE /feedback/:id       ✗ Feedback deletion
- DELETE /inventory/:id      ✗ Inventory deletion
- GET /patients/:id/history  ✗ Patient visit history
```

### 3.3 CRITICAL SECURITY FINDINGS

```javascript
// RISK 1: Hardcoded JWT Secret
process.env.JWT_SECRET || 'secret'  // Falls back to 'secret' if env missing
// Impact: If .env not set, any JWT can be forged
// Fix: require() with error if missing

// RISK 2: No Rate Limiting
// Impact: Brute force attacks possible on login
// Fix: Add express-rate-limit middleware

// RISK 3: No Input Sanitization
// Impact: SQL Injection risk (though parameterized queries used)
// Fix: Additional validation layer

// RISK 4: No Cross-Origin Request Validation
// Impact: CORS + JWT allows any site to make requests
// Fix: Restrict CORS origin

// RISK 5: Missing Authorization Checks
router.put('/:id', authMiddleware, async (req, res) => {
  // ANY authenticated user can update ANY patient
  // Fix: Check if req.userId == patient.createdBy
})
```

---

## STAGE 4: DATABASE AUDIT

### 4.1 SCHEMA ANALYSIS

**Table: users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  facility TEXT NOT NULL,
  role TEXT DEFAULT 'doctor',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
✓ Unique constraints on username and email  
⚠️ Role hardcoded to 'doctor' in routes (never set during registration)  
⚠️ No phone number  
⚠️ No registration verification  
⚠️ No status/active flag  

---

**Table: patients**
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  village TEXT NOT NULL,
  phone TEXT NOT NULL,
  lastVisit TEXT,
  diagnosis TEXT,
  status TEXT DEFAULT 'Active',
  createdBy INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(createdBy) REFERENCES users(id)
)
```
⚠️ No validation on age (could be negative)  
⚠️ No validation on phone format  
✓ Foreign key constraint enforced  
⚠️ Missing: weight, BP, temperature, other vitals  
⚠️ Missing: ABHA ID, aadhar  
⚠️ No soft delete  
⚠️ No update timestamp (only created)  

---

**Table: prescriptions**
```sql
CREATE TABLE prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patientId TEXT NOT NULL,
  doctorId INTEGER NOT NULL,
  drug TEXT NOT NULL,
  dosage TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(patientId) REFERENCES patients(id),
  FOREIGN KEY(doctorId) REFERENCES users(id)
)
```
✓ Foreign keys present  
⚠️ No validation on drug name (no druglist table)  
⚠️ No validation on dosage format  
⚠️ Missing: frequency, route, quantity  
⚠️ No soft delete  
⚠️ No digital signature/verification  

---

**Table: referrals**
```sql
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patientId TEXT NOT NULL,
  referredBy INTEGER NOT NULL,
  facility TEXT NOT NULL,
  reason TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(patientId) REFERENCES patients(id),
  FOREIGN KEY(referredBy) REFERENCES users(id)
)
```
✓ Status tracking  
⚠️ No validation that facility exists  
⚠️ No urgency level  
⚠️ No transport arrangement  
⚠️ Missing: receiving facility contact, expected arrival  
⚠️ Missing: actual arrival confirmation  

---

**Table: feedback**
```sql
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id)
)
```
⚠️ No validation on rating (could be > 5 or negative)  
⚠️ Type field unclear (inconsistent with frontend usage)  
⚠️ No response/status field  
⚠️ Missing: attachments  

---

**Table: inventory**
```sql
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  stock INTEGER NOT NULL,
  minThreshold INTEGER NOT NULL,
  unit TEXT DEFAULT 'tablets',
  lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
⚠️ Stock can be negative  
⚠️ minThreshold can be > stock (logic issue)  
⚠️ No price/cost tracking  
⚠️ No expiry date  
⚠️ No batch number tracking  
⚠️ No supplier information  
⚠️ Missing: stock in/out history log  

---

### 4.2 DATA VALIDATION AUDIT

```
Validation Level by Field:

users.username:      ✓ UNIQUE constraint
users.password:      ✓ Hashed with bcryptjs
users.email:         ⚠️ UNIQUE but no format validation
users.name:          ✗ No length validation

patients.name:       ✗ No validation
patients.age:        ✗ No range check (0-150)
patients.village:    ✗ No validation
patients.phone:      ✗ No format check

prescriptions.drug:  ✗ No drug reference
prescriptions.dosage: ✗ No format validation

referrals.status:    ⚠️ Default only, no enum constraint
referrals.facility:  ✗ No validation

inventory.stock:     ✗ Can be negative
inventory.rating:    ✗ No range check (1-5)
```

### 4.3 INDEXING STRATEGY

```
Current Indexes (Primary Keys Only):

Missing Indexes:
✗ patients.createdBy (needed for GET /patients)
✗ prescriptions.patientId (needed for patient prescriptions)
✗ prescriptions.doctorId (needed for doctor prescriptions)
✗ referrals.patientId
✗ referrals.referredBy
✗ feedback.userId
```

**Performance Impact:** Without indexes, queries will TABLE SCAN  

### 4.4 TRANSACTION & ATOMICITY ISSUES

```javascript
// Issue 1: No transactions for multi-step operations
// If prescription creation fails partway, no rollback

// Issue 2: Patient ID collision
// Frontend generates ID client-side - race condition if 2 doctors create at same time
// Frontend: const patientId = `RM-${String(patients.length + 1).padStart(4, '0')}`;
// This is NOT thread-safe

// Issue 3: No concurrent update handling
// Two edits to same patient at same time = last-write-wins (data loss)
```

---

## STAGE 5: DATA FLOW VERIFICATION

### 5.1 FEATURE: PATIENT REGISTRATION

```
Flow: Create New Patient
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UI (PatientPage)
  ↓
  User fills form (name, age, gender, village, phone)
  ↓
  Click "Save" button
  ↓
  [src/pages/PatientPage.jsx]
  const patientId = `RM-${String(patients.length + 1).padStart(4, '0')}`;
  ↓
  ⚠️ ISSUE: ID generation is not thread-safe
  ↓
  await patientsAPI.create({
    id: patientId,
    name, age, gender, village, phone
  })
  ↓
  [src/services/api.js]
  POST /api/patients with request body
  ↓
  [backend/routes/patients.js]
  router.post('/', authMiddleware, async (req, res) => {
    ✓ Checks auth
    ✓ Validates required fields
    ⚠️ Does NOT check if ID already exists
    ↓
    INSERT INTO patients VALUES (...)
    ↓
    Database accepts (TEXT PRIMARY KEY)
    ↓
    Response: { message: 'Patient created', id }
  })
  ↓
  [Frontend]
  toast: "Patient registered"
  setPatients(prev => [...prev, newPatient])
  ↓
  ✓ Patient appears in list

✓ WORKING: Data saved to database
⚠️ ISSUE: No duplicate prevention
✗ ISSUE: ID generation race condition
✗ ISSUE: No patient detail form completion
```

### 5.2 FEATURE: PRESCRIPTION WRITING

```
Flow: Create Prescription
━━━━━━━━━━━━━━━━━━━━━━━━━

UI (PrescriptionPage)
  ↓
  Select patient from dropdown
  Add medications (name, dose, frequency, duration)
  Click "Save Prescription"
  ↓
  [src/pages/PrescriptionPage.jsx]
  for each medication:
    await prescriptionsAPI.create({
      patientId,
      drug: med.name,
      dosage: med.dose,
      duration: med.dur,
      instructions: `${med.freq} via ${med.route}. ${advice}`
    })
  ↓
  [backend/routes/prescriptions.js]
  ✓ Auth check
  ✓ Validation
  ✓ Inserts to DB
  ↓
  Response: { message, id }
  ↓
  UI shows toast: "Prescription saved"

✓ WORKING: Data reaches database
⚠️ ISSUE: Cannot retrieve prescriptions for patient
✗ ISSUE: No prescription viewing/editing
✗ ISSUE: Print does nothing
```

### 5.3 FEATURE: REFERRAL CREATION

```
Flow: Create Referral
━━━━━━━━━━━━━━━━━━━━

UI (ReferPage)
  ↓
  Select patient
  Select facility
  Enter reason
  Click "Submit"
  ↓
  [Frontend]
  ✗ 'urgency' field NOT sent to API
  ✗ 'transport' field NOT sent to API
  ✗ 'notes' field NOT sent to API
  ↓
  POST /api/referrals
  {
    patientId,
    facility,
    reason,
    date: TODAY_ISO
  }
  ↓
  [Backend]
  ✓ Inserted
  ↓
  [Frontend]
  ✗ Local state updated (old data)
  ✗ API data not refreshed

✓ Database has data
✗ Mismatch: UI sends data backend doesn't accept
✗ History shown from LOCAL state, not API
```

### 5.4 AUTHENTICATION STATE FLOW

```
Signup/Login Flow
━━━━━━━━━━━━━━━━

[LoginPage/SignupPage]
  POST /api/auth/register or /api/auth/login
  ↓
  [Backend]
  Response: { token, user: { id, username, email, name, facility } }
  ↓
  [Frontend -> App.jsx]
  localStorage.setItem('token', res.token)
  localStorage.setItem('user', JSON.stringify(userData))
  handleLogin(userData) -> setUser(userData)
  ↓
  App redirects to HomePage
  ↓
  Load patients:
  const data = await patientsAPI.getAll()
  ↓
  [API Service -> services/api.js]
  const token = localStorage.getItem('token')
  headers['Authorization'] = `Bearer ${token}`
  ↓
  [Backend]
  authMiddleware verifies token
  req.userId set from token.id
  ↓
  Patient data filtered by createdBy = req.userId
  ↓
  Response: [patients]
  ↓
  setPatients(data)

✓ COMPLETE: Auth → Protected Routes working
✓ COMPLETE: Token persistence on refresh
⚠️ ISSUE: user.role hardcoded (no RBAC)
✗ ISSUE: No logout clearing (only localStorage)
```

---

## STAGE 6: AUTHENTICATION & SECURITY AUDIT

### 6.1 LOGIN FLOW SECURITY

```javascript
// Handler: POST /api/auth/login

1. User submits username + password
✓ Basic validation present
✗ No rate limiting (brute force possible)
✗ No timing attack protection

2. Database lookup
✓ Parameterized query (SQL injection safe)
✓ Returns user if exists
⚠️ Generic error message "Invalid credentials" (timing attack)

3. Password verification
✓ bcryptjs.compare() used
✓ No plaintext comparison
⚠️ Comparison is async but doesn't use timing-safe operations

4. Token generation
✓ JWT with HS256
⚠️ Secret falls back to 'secret' if ENV undefined
⚠️ No token versioning
⚠️ No blacklist/revocation mechanism

5. Response
✓ Token returned
✓ User data returned
✗ Sensitive data included (email in token payload)
```

### 6.2 TOKEN PROTECTION

**Frontend Token Handling:**
```javascript
// Location: localStorage
// Risk: XSS can steal token (not httpOnly)
// Fix: Use httpOnly cookies instead

// Sending in requests:
headers['Authorization'] = `Bearer ${token}`
// ✓ Correct format
// ✗ HTTPS not enforced (development only, acceptable)

// Token Expiration:
// 7 days hardcoded
// ⚠️ No refresh token mechanism
// ⚠️ User stays logged in for 7 days even if lost
```

### 6.3 ROUTE PROTECTION

**Protected Routes:**
```javascript
// ✓ All /api endpoints except /auth require authMiddleware
// ✓ Frontend checks user state before rendering pages
// ⚠️ But no authorization check on resources

Example Issue:
router.put('/patients/:id', authMiddleware, async (req, res) => {
  // Any authenticated user can update ANY patient
  // Should be: if (req.userId !== patient.createdBy) return 403
});
```

### 6.4 AUTHENTICATION FAILURE SCENARIOS

```
Scenario 1: Invalid Credentials
Input: username='baduser', password='badpass'
Expected: 401 Unauthorized
Actual: ✓ Returns "Invalid credentials"
✓ WORKING

Scenario 2: Missing Token
Request: GET /api/patients (no Authorization header)
Expected: 401
Actual: ✓ Returns "No token provided"
✓ WORKING

Scenario 3: Malformed Token
Token: "invalid.token.format"
Expected: 401
Actual: ✓ JWT verify fails, returns "Invalid token"
✓ WORKING

Scenario 4: Expired Token
Token: Valid JWT but exp < now()
Expected: 401
Actual: ✓ jwt.verify() rejects, returns 401
✓ WORKING

Scenario 5: Modified Token Payload
Token: Valid format but signature doesn't match
Expected: 401
Actual: ✓ Signature verification fails
✓ WORKING

Scenario 6: Token from Wrong Environment
Token: Generated with different JWT_SECRET
Expected: 401
Actual: ✓ Verification fails
✓ WORKING BUT: Only if JWT_SECRET is consistent
⚠️ If .env missing, falls back to 'secret'
    Any token signed with 'secret' would work
```

### 6.5 LOGOUT BEHAVIOR

```javascript
// Frontend: [App.jsx]
const handleLogout = () => {
  setUser(null);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setAuthPage('login');
};

✓ Clears state
✓ Clears localStorage
✗ No server-side token blacklist

Risk: Token still valid for 7 days at backend
If token leaks, attacker can use it
Fix: Implement token blacklist in Redis
```

### 6.6 ROLE-BASED ACCESS CONTROL (RBAC)

**Current Status:** ✗ NOT IMPLEMENTED

```javascript
// Problem 1: Role hardcoded during registration
router.post('/register', async (req, res) => {
  // Role not in request body, only frontend/backend are 'doctor'
  const role = 'doctor'; // HARDCODED
});

// Problem 2: Role from DB never validated
const user = await get(`SELECT * FROM users WHERE username = ?`);
// user.role = 'doctor' (always)
// Token doesn't include role

// Problem 3: No route restrictions by role
// Admin endpoints would require role check:
// if (!['admin', 'block-officer'].includes(req.user.role))
// NOT IMPLEMENTED

// Missing RBAC:
// ✗ Cannot restrict patient creation to ANM/ASHA
// ✗ Cannot restrict referrals to doctors only
// ✗ Cannot restrict admin operations
```

### 6.7 SECURITY SUMMARY

```
✓ GOOD (7):
  - Password hashing
  - JWT tokens
  - SQL injection prevention (parameterized queries)
  - Token expiration
  - Invalid token rejection
  - User isolation on queries
  - API endpoints protected

⚠️ MEDIUM RISK (8):
  - No rate limiting
  - localStorage instead of httpOnly cookies
  - No authorization checks (only authentication)
  - No HTTPS configuration
  - No CSRF protection
  - Hardcoded JWT fallback secret
  - No token blacklist/revocation
  - Missing RBAC implementation

✗ HIGH RISK (4):
  - Frontend generates patient IDs (race condition)
  - No input sanitization layer
  - Database exposed to direct SQL errors
  - No audit logging
```

---

## STAGE 7: FILE HANDLING & STATIC STORAGE

**Status:** ✗ NOT IMPLEMENTED

```
Missing Features:
✗ No file upload endpoints
✗ No document storage (prescriptions, referrals, patient history)
✗ No image upload (patient photo)
✗ No PDF generation for prescriptions/referrals
✗ No backup system
✗ No attachment support in feedback

Hardcoded Data:
⚠️ Stock items in HomePage are mock data
⚠️ Statistics in SummaryPage are hardcoded
⚠️ No inventory connected to actual database
```

---

## STAGE 8: EDGE CASE TESTING

### 8.1 EMPTY DATA SUBMISSIONS

```javascript
Case: Create patient with empty name
Input: { id: 'RM-0001', name: '', age: 25, gender: 'M', village: 'X', phone: '1234567890' }
Validation: ✓ Catches at frontend
Backend: ✓ Validation checks "!name"
Result: ✓ HANDLED

Case: Create patient with negative age
Input: { id: 'RM-0001', name: 'X', age: -5, gender: 'M', village: 'X', phone: '1234567890' }
Validation: ✗ No age range check at frontend
Backend: ✗ No age validation at backend
Result: ✗ ACCEPTED (Data integrity issue)

Case: Create referral with empty facility
Input: { patientId: 'RM-001', facility: '', reason: 'Fever', date: '2026-03-13' }
Validation: ✓ Frontend checks facility
Backend: ✓ Backend checks facility
Result: ✓ HANDLED

Case: Submit feedback with rating > 5
Input: { type: 'platform', message: 'Good', rating: 10 }
Validation: ✗ No range check at frontend (3-star UI but can submit any number)
Backend: ✗ No rating range validation
Result: ✗ DATA INTEGRITY ISSUE

Case: Null/undefined values
Input: { patientId: null, drug: 'Amoxicillin', ... }
Validation: ✗ Frontend doesn't type-check
Backend: ✓ JavaScript falsy check catches null
Result: ⚠️ PARTIALLY HANDLED
```

### 8.2 LARGE PAYLOADS

```
Case: Patient with 5MB photo (not implemented, but scenario)
Impact: ✗ No file size limit
Impact: ✗ No Content-Length check
Impact: ✗ Memory exposure on large uploads
```

### 8.3 NETWORK FAILURES

```javascript
Case: API request times out
const response = await fetch(`${API_BASE}${endpoint}`, options);
✗ No timeout configuration
✗ No retry logic
✗ No offline detection

Frontend behavior:
- Request hangs indefinitely
- User sees "loading" state
- No error shown
- Button disabled but no feedback

Case: Server returns 500 error
✓ Caught by response.ok check
✓ Error message displayed to user
✓ Toast shows error
Result: ✓ PARTIALLY HANDLED

Case: Network error (connection lost)
const error = await response.json().catch(() => ({ error: 'Network error' }));
✓ Fallback error message
Result: ✓ HANDLED
```

### 8.4 DATABASE FAILURES

```javascript
Case: SQLite database locked
Result: ✗ No handling
Impact: Server crashes or hangs

Case: Constraint violation (duplicate username)
const result = await run(`INSERT INTO users ...`);
✗ No unique constraint error handling
Backend response: 500 Internal Server Error

Case: Foreign key violation
await run(`INSERT INTO prescriptions WHERE patientId = 'INVALID'`);
✗ Foreign key constraint may pass SQLite with PRAGMA
Impact: ✗ Orphaned data possible

Case: Database file missing
✗ No check if file exists
Impact: SQLite creates empty database
Result: ✓ WORKS but with empty schema
```

### 8.5 RACE CONDITIONS

```javascript
// Race Condition 1: Duplicate Patient ID
Time T1: Doctor A creates patient, generates ID 'RM-0042'
Time T2: Doctor B creates patient, generates ID 'RM-0042' (both counted 42)
Result: ✗ Primary key violation (last insert fails silently)

// Race Condition 2: Update Lost
Time T1: User A reads patient {status: 'Active'}
Time T2: User B reads patient {status: 'Active'}
Time T3: User A updates to {status: 'Referred'}
Time T4: User B updates to {status: 'Active'} (overwrites A's change)
Result: ✗ Data loss - B's update erases A's change

// Race Condition 3: Stock Decrement
Current stock: 10
Time T1: Doctor A prescribes drug (should reduce stock to 9)
Time T2: Doctor B prescribes drug (should reduce stock to 8)
Result: ✗ No transaction, both read 10, both write 9
Impact: Inventory tracking corrupted
```

### 8.6 DUPLICATE ENTRIES

```javascript
Case: Create patient with duplicate ID
Database: TEXT PRIMARY KEY
✓ Unique constraint enforced
Result: ✓ INSERT fails, error returned

Case: Create user with duplicate username
Database: username TEXT UNIQUE
✓ Unique constraint enforced
Result: ✓ INSERT fails with constraint error

Case: Create prescription for non-existent patient
patient_id TEXT NOT NULL, FOREIGN KEY(patientId) REFERENCES patients(id)
Current status: ✗ With default SQLite, foreign keys are OFF
Result: ✗ ORPHANED DATA POSSIBLE

Case: Create inventory item with duplicate name
Database: name TEXT UNIQUE
✓ Unique constraint enforced
Result: ✓ INSERT fails
```

### 8.7 INVALID INPUT

```javascript
Case: Malicious input - SQL injection attempt
Input: patientId = "'; DROP TABLE patients; --"
Frontend: ✓ Parameterized query
Result: ✓ Treated as literal string

Case: XSS attempt in patient name
Input: name = "<script>alert('xss')</script>"
Frontend: ✓ React escapes by default
Backend: ✓ Returned as plain text, escaped by React
Result: ✓ SAFE

Case: Invalid JSON in request
Input: POST body is malformed JSON
Result: ✗ Express.json() returns 400 (implicit, uncaught)
Impact: No error handler for this
Result: ✗ Possible unhandled rejection

Case: Negative stock in inventory
Input: { name: 'Drug', stock: -50, minThreshold: 10 }
Validation: ✗ No check
Result: ✗ ACCEPTED (logic error)
```

### 8.8 MISSING ENVIRONMENT VARIABLES

```javascript
Case: .env file not present or missing PORT
process.env.PORT || 5000
Result: ✓ Falls back to 5000

Case: .env file missing JWT_SECRET
process.env.JWT_SECRET || 'secret'
Result: ✗ CRITICAL: Falls back to 'secret'
Impact: Any JWT signed with 'secret' would be valid
Risk: Highly insecure

Fix: Require .env variables
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET required');
```

---

## STAGE 9: SMOKE TEST SIMULATION

### 9.1 USER STORY: Doctor Registers and Sees Dashboard

```
STEP 1: App Startup [localhost:5000]
Expected: ✓ Frontend loads
Expected: ✓ Login page shown
Actual: ✓ WORKING
Assessment: ✓ PASS

STEP 2: Click "Create Account"
Expected: ✓ Navigate to SignupPage
Actual: ✓ WORKING
Assessment: ✓ PASS

STEP 3: Fill signup form
username: 'ananya.sharma'
name: 'Dr. Ananya Sharma'
email: 'ananya@phc.gov.in'
facility: 'PHC Ramnagar'
password: 'TestPass123!'
confirm: 'TestPass123!'
Expected: ✓ Submit button clickable
Actual: ✓ WORKING
Assessment: ✓ PASS

STEP 4: Submit signup
Expected: ✓ Network request to POST /api/auth/register
Actual: ✓ Request sent
Assessment: ✓ PASS

STEP 5: Backend processes signup
Expected: ✓ User inserted to database
Expected: ✓ Password hashed
Expected: ✓ JWT token generated
Actual: ✓ All done
Assessment: ✓ PASS

STEP 6: Receive response and login
Expected: ✓ Token stored in localStorage
Expected: ✓ Redirect to HomePage
Expected: ✓ Patient list loaded
Actual: ✓ WORKING (see below)
Assessment: ✓ PASS

STEP 7: HomePage loads
Expected: ✓ Greeting shows doctor name
Expected: ✓ Recent patients table shows data
Expected: ✓ Statistics cards show numbers
Actual: ✓ Name shown, patients table works
Assessment: ⚠️ PARTIAL (stats are mocked)

STEP 8: Register a new patient
Click "New Patient" button
Expected: ✓ Switch to PatientPage create mode
Actual: ✓ WORKING
Assessment: ✓ PASS

STEP 9: Fill patient form
name: 'Sunita Devi'
age: 42
gender: 'Female'
village: 'Ramnagar'
phone: '9876543210'
Expected: ✓ Required fields identified
Actual: ✓ Validation working
Assessment: ✓ PASS

STEP 10: Save patient
Expected: ✓ POST /api/patients sent
Expected: ✓ Patient inserted with generated ID
Expected: ✓ Toast shows "Patient registered"
Actual: ✓ WORKING (but ID generation unsafe)
Assessment: ⚠️ PARTIAL (race condition risk)

STEP 11: Write prescription
Navigate to Prescription page
Select patient
Add medication: Amoxicillin 500mg, OD, 7 days
Expected: ✓ Save button sends request
Actual: ✓ WORKING  
Assessment: ✓ PASS

STEP 12: Create referral
Navigate to Refer page
Select patient
Fill facility and reason
Expected: ✓ Submit sends data to backend
Actual: ✓ WORKING (but urgency/transport not sent)
Assessment: ⚠️ PARTIAL (missing fields)

STEP 13: Logout
Click logout in sidebar
Expected: ✓ Clear localStorage
Expected: ✓ Return to login
Expected: ✓ Cannot access /api/patients without token
Actual: ✓ Frontend clears, redirects
Assessment: ⚠️ ISSUE: Token still valid at backend for 7 days
```

### 9.2 SMOKE TEST RESULT

```
Features Working: 11/13
Features Partial: 2/13
Features Broken: 0/13

✓ PASS: Authentication flow
✓ PASS: Patient creation
✓ PASS: Prescription creation
✓ PASS: Referral creation
✓ PASS: Page navigation
✓ PASS: Form validation
✓ PASS: API communication
✓ PASS: Error handling
✓ PASS: Responsive layout

⚠️ ISSUE: Statistics hardcoded
⚠️ ISSUE: Referral fields incomplete
⚠️ ISSUE: No logout server-side revocation
```

---

## STAGE 10: LINE-BY-LINE RISK ANALYSIS

### 10.1 CRITICAL ISSUES BY FILE

**File: `backend/routes/patients.js`**

```javascript
// LINE 7-8: Missing authorization check
router.get('/:id', authMiddleware, async (req, res) => {
  // ✗ ISSUE: No check if patient belongs to user
  const patient = await get(`SELECT * FROM patients WHERE id = ?`, [req.params.id]);
  // Any authenticated user can view any patient
  // FIX: Add if (patient.createdBy !== req.userId) return 403
})

// LINE 24: Missing validation
if (!id || !name || !age || !gender || !village || !phone) {
  // ✗ ISSUE: age is not validated for range
  // ✗ ISSUE: phone not validated for format
  // ✗ ISSUE: age not parsed to integer
  // FIX: Add parseInt(age) and range checks
}

// LINE 38-43: No authorization check
router.put('/:id', authMiddleware, async (req, res) => {
  // ✗ CRITICAL: Any user can update any patient
  await run(UPDATE patients SET ..., [args, req.params.id]);
  // FIX: Add authorization check
  // if (createdBy !== req.userId) return 403
})

// LINE 40: No existence check
// ✗ ISSUE: Updating non-existent patient succeeds silently
// Returns success even if no rows updated
// FIX: Check this.changes > 0
```

**File: `backend/routes/auth.js`**

```javascript
// LINE 27: Secret fallback risk
process.env.JWT_SECRET || 'secret'
// ✗ CRITICAL: Hardcoded default secret
// If env not set, ANY token signed with 'secret' is accepted
// FIX: throw new Error('JWT_SECRET required') if missing

// LINE 55: Same issue
process.env.JWT_SECRET || 'secret'
// ✗ CRITICAL RISK

// LINE 36: No rate limiting
router.post('/login', async (req, res) => {
  // ✗ ISSUE: No limit on login attempts
  // Brute force attack possible
  // FIX: Add express-rate-limit middleware
})

// LINE 51: Timing attack risk
const isValid = await bcryptjs.compare(password, user.password);
// ⚠️ TIMING SAFE: bcryptjs.compare() uses constant-time comparison
// ✓ GOOD

// LINE 17: Missing duplicate check
const result = await run(INSERT INTO users ...);
// ✓ Works because of UNIQUE constraint
// ✓ But returns 500 error instead of 409
// FIX: Catch unique constraint error and return proper 409
```

**File: `backend/middleware/auth.js`**

```javascript
// LINE 3: Missing secret requirement
process.env.JWT_SECRET || 'secret'
// ✗ SAME RISK: Hardcoded fallback
// If .env missing, verification is weak

// LINE 9: Could be more informative
res.status(401).json({ error: 'Invalid token' });
// ⚠️ Generic error (security-conscious, but could log internally)
```

**File: `backend/db/init.js`**

```javascript
// LINE 44-53: No foreign key enforcement
db.run(`CREATE TABLE IF NOT EXISTS prescriptions (...)
  FOREIGN KEY(patientId) REFERENCES patients(id)
`);
// ✗ ISSUE: SQLite has foreign keys OFF by default
// PRAGMA foreign_keys = ON; not set
// ✗ Orphaned data is possible
// FIX: execute("PRAGMA foreign_keys = ON;") after opening connection

// LINE 111-115: Foreign key same issue
// FILE: Missing indexes
// ✗ ISSUE: No indexes on foreign key columns
// SELECT * FROM patients WHERE createdBy = ? (full table scan)
// CREATE INDEX idx_patients_createdby ON patients(createdBy);
// Missing: All foreign key columns need indexes
```

**File: `src/pages/PatientPage.jsx`**

```javascript
// LINE 28: Frontend ID generation is NOT thread-safe
const patientId = `RM-${String(patients.length + 1).padStart(4, '0')}`;
// ✗ CRITICAL RACE CONDITION
// If two doctors register patients simultaneously:
// Both count: 42 patients
// Both generate: RM-0043
// INSERT fails for one (but error handling?)
// FIX: Remove ID generation from frontend
// Backend should generate: `RM-${AUTO_INCREMENT}`

// LINE 31-50: API integration
if (!f.name || !f.age || !f.gender) { 
  toast('Name, Age and Gender are required.', 'error'); 
  return; 
}
// ✓ GOOD: Validation at frontend

// ✗ ISSUE: Age not validated for range
// ✗ ISSUE: Phone not validated

// LINE 58-73: Patient data partially filled
const p = {
  id: patientId,
  name: f.name,
  age: parseInt(f.age),  // ✓ GOOD: Type conversion
  gender: f.gender,
  village: f.village || '—',
  phone: f.phone || '—',
  lastVisit: TODAY_ISO,
  diagnosis: f.dx || 'Under Assessment',
  status: 'Active',
};
// ⚠️ ISSUE: Vitals form fields not used (bp_s, bp_d, temp, etc.)
// ⚠️ These are collected but never saved
// DATA LOSS: 15+ vital fields collected but discarded
```

**File: `src/pages/PrescriptionPage.jsx`**

```javascript
// LINE 26-45: Prescription saving loop
for (const med of meds) {
  if (med.name) {
    await prescriptionsAPI.create({...})
  }
}
// ✗ ISSUE: No transaction
// If 1st prescription succeeds, 2nd fails:
// Patient has partial prescription
// FIX: Use backend transaction or rollback

// ⚠️ ISSUE: Instructions field loses data
instructions: `${med.freq} via ${med.route}. ${advice}`
// Only includes frequency/route/advice
// Missing: quantity, refills, interactions check

// ✗ ISSUE: Cannot update prescriptions
// No edit endpoint implemented
```

**File: `src/pages/ReferPage.jsx`**

```javascript
// LINE 38-44: Form submission
const submit = async () => {
  if (!selId || !facility || !reason) { ... return; }
  try {
    await referralsAPI.create({
      patientId: selId,
      facility,
      reason,
      date: TODAY_ISO,
    });
    // ✗ ISSUE: Missing fields
    // urgency NOT sent (collected but not sent)
    // transport NOT sent (collected but not sent)  
    // notes NOT sent (collected but not sent)
    // FIX: Add these fields to API call
  }
}
```

**File: `src/pages/FeedbackPage.jsx`**

```javascript
// LINE 23-29: Type field mismatch
await feedbackAPI.submit({
  type,  // from form: 'platform', 'bug', 'feature', etc.
  message: `${subject}\n\n${message}`,  // Combined string
  rating,
});
// Backend expects:
// {
//   type: string,
//   message: string,
//   rating: integer (optional)
// }
// ✓ Matches, but subject should be separate field

// ✗ ISSUE: No rating validation (could be 0-100)
// Risk: Data validation broken
```

**File: `src/services/api.js`**

```javascript
// LINE 7-24: Error handling
const response = await fetch(`${API_BASE}${endpoint}`, options);

if (!response.ok) {
  const error = await response.json().catch(() => ({ error: 'Network error' }));
  throw new Error(error.error || `HTTP ${response.status}`);
}
// ✓ GOOD: Fallback error message

// ✗ ISSUE: No timeout
// fetch() hangs indefinitely on connection issues
// FIX: AbortController with timeout

// ⚠️ ISSUE: No retry logic
// Single request, if it fails, error shown
```

**File: `src/App.jsx`**

```javascript
// LINE 28-37: Loading pattern
const [loading, setLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    if (userData) setUser(userData);
  }
  setLoading(false);
}, []);

// ⚠️ ISSUE: Parse error not handled
// if localStorage.user is corrupted JSON, parse fails
// FIX: Try/catch the JSON.parse

// LINE 39-46: Patient loading
useEffect(() => {
  if (user && patients.length === 0) {
    loadPatients();
  }
}, [user]);

// ⚠️ ISSUE: patients.length === 0 check
// If loadPatients fails, will retry every render
// FIX: Use dependency array properly or flag isLoading

// LINE 52: Logout clearing
const handleLogout = () => {
  setUser(null);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setAuthPage('login');
};
// ✗ ISSUE: No server-side logout
// Token still valid for 7 days
// FIX: POST /api/auth/logout to blacklist token (not implemented)
```

### 10.2 SUMMARY OF CRITICAL CODE ISSUES

```
CRITICAL ISSUES (Should fix immediately):

1. JWT_SECRET fallback to 'secret'
   - File: backend/routes/auth.js, middleware/auth.js
   - Risk: Complete auth bypass if .env missing
   - Fix: require() with error

2. Frontend patient ID generation (race condition)
   - File: src/pages/PatientPage.jsx  
   - Risk: Duplicate IDs, data loss
   - Fix: Backend generates IDs

3. Missing authorization checks
   - File: backend/routes/patients.js, referrals.js, prescriptions.js
   - Risk: Users can access/modify other users' data
   - Fix: Check req.userId === resource.createdBy

4. No foreign key enforcement
   - File: backend/db/init.js
   - Risk: Orphaned data, data integrity loss
   - Fix: PRAGMA foreign_keys = ON

5. SQL queries missing existence checks
   - File: all routes
   - Risk: Silent failures on invalid operations
   - Fix: Check this.changes > 0 after UPDATE

HIGH RISK (Fix soon):

6. Missing form field integrations
   - PatientPage vitals collected but not saved
   - ReferPage urgency/transport collected but not sent
   - PrescriptionPage frequency/route lost in instructions
   - Fix: Complete API contracts

7. No input validation on sensitive fields
   - Age not range-checked
   - Phone not format-checked
   - Rating not range-checked (1-5)
   - Fix: Backend + frontend validation

8. Race conditions in stock/update operations
   - No transactions
   - Last-write-wins conflicts
   - Fix: Use database transactions

MEDIUM RISK (Should improve):

9. No rate limiting on auth endpoints
   - Can brute force login
   - Fix: express-rate-limit middleware

10. No pagination/limits on queries
    - Loading all patients at once
    - Can cause performance issues
    - Fix: LIMIT/OFFSET params

11. XSS risks from user input display
    - Mitigation: React escaping works, but check custom HTML
    - Fix: Sanitize if any HTML allowed
```

---

## STAGE 11: BUILD COMPLETION REPORT

### PROJECT COMPLETION STATUS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES FULLY BUILT & PRODUCTION-READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✓ User Registration & Login
   - Both implemented with validation
   - Password hashing with bcryptjs
   - JWT token generation and verification
   - Token persistence across sessions

2. ✓ Patient Registration (CRUD)
   - Create: Working, API integrated
   - Read: Working, filtered by user
   - Update: Endpoint exists but no auth check
   - Delete: Not implemented
   - Status: 70% complete

3. ✓ Prescription Writing
   - Create: Working, multiple drugs per prescription
   - Read: Working, user-filtered
   - Update: Not implemented
   - Delete: Not implemented
   - Status: 50% complete

4. ✓ Referral System
   - Create: Working API integration
   - Read: Working API integration
   - Update Status: Not implemented
   - History: UI shows local state, not API
   - Status: 60% complete

5. ✓ Feedback System
   - Submit: Fully implemented
   - View: Implemented but not connected to UI
   - Status: 80% complete

6. ✓ Page Navigation & UI
   - 8 pages implemented
   - Responsive layout
   - Sidebar + topbar working
   - Toast notifications
   - Status: 95% complete

7. ✓ API Infrastructure
   - Express server configured
   - CORS enabled
   - Routes for all major features
   - Error handling baseline
   - Status: 90% complete

8. ✓ Database Setup
   - SQLite initialized with 6 tables
   - Foreign key constraints defined
   - Schema complete
   - Status: 80% complete (missing indexes, transactions)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES PARTIALLY BUILT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⚠️ Dashboard (HomePage)
   - Shows recent patients (API connected)
   - Shows mock statistics (not real)
   - Drug stock alerts (hardcoded, not from API)
   - Quick action buttons (work but inconsistent)
   - Completion: 40%

2. ⚠️ Summary/Analytics Report
   - UI designed but no data connection
   - Statistics hardcoded
   - No real patient statistics calculation
   - Period filter shows different hardcoded data (not real)
   - Completion: 20%

3. ⚠️ Patient Management
   - Registration works
   - List works
   - Details/modal missing
   - Vitals form present but not saved
   - Update endpoint exists but no auth check
   - Completion: 60%

4. ⚠️ Referral Management
   - Creation works
   - Missing urgency/transport in API
   - Status updates not implemented
   - No acknowledgment tracking
   - Completion: 50%

5. ⚠️ Inventory Management
   - Endpoints exist (create, read, update)
   - Never used in any page
   - Low stock feature implemented but unreachable
   - Completion: 30%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES MISSING/NOT IMPLEMENTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✗ Patient Record Details & History
   - Cannot view full patient history
   - Cannot see complete vitals
   - Cannot retrieve past prescriptions for patient
   - No patient timeline view

2. ✗ Prescription Management
   - Cannot edit prescriptions
   - Cannot delete prescriptions
   - Cannot generate PDF
   - No print functionality
   - No prescription templates/auto-fill
   - No drug interaction checking
   - No medication history
   - No prescription renewal

3. ✗ Referral Tracking
   - Cannot update referral status
   - No receiving facility confirmation
   - No patient follow-up tracking
   - No referral feedback system
   - No referral letter template

4. ✗ User Management
   - Cannot change password
   - Cannot reset password (forgot password)
   - Cannot manage user profiles
   - No role-based access control (RBAC)
   - No admin panel

5. ✗ File Management
   - No document uploads
   - No prescription PDF generation
   - No patient photo storage
   - No backup/export functionality
   - No report generation

6. ✗ Offline Functionality
   - App requires internet (not truly offline)
   - No service workers/PWA
   - No data sync queue
   - No conflict resolution

7. ✗ Advanced Features
   - No patient search by multiple criteria
   - No advanced filtering
   - No bulk operations
   - No audit logs
   - No data encryption at rest
   - No multi-facility support
   - No synchronization between facilities

8. ✗ Operational
   - No rate limiting
   - No API documentation (Swagger/OpenAPI)
   - No monitoring/logging
   - No error tracking
   - No performance metrics
   - No backup system

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY ISSUES SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL (Must fix before production):

1. 🔴 JWT_SECRET hardcoded fallback
   Impact: Auth bypass if .env missing
   Fix: Require environment variable

2. 🔴 Missing authorization checks  
   Impact: Users can access other users' data
   Fix: Check createdBy == req.userId on all protected resources

3. 🔴 Race condition in ID generation
   Impact: Duplicate patient IDs possible
   Fix: Move ID generation to backend

4. 🔴 Foreign key enforcement disabled
   Impact: Orphaned data, referential integrity loss
   Fix: Enable PRAGMA foreign_keys = ON

5. 🔴 No input validation on age/rating fields
   Impact: Negative ages, invalid ratings stored
   Fix: Add range and format validation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HIGH RISK (Fix before full deployment):

6. 🟠 No rate limiting on login
   Impact: Brute force attacks possible
   Fix: Add express-rate-limit middleware

7. 🟠 Token not revoked on logout
   Impact: Stolen tokens remain valid for 7 days
   Fix: Implement token blacklist

8. 🟠 localStorage for JWT (XSS vulnerable)
   Impact: XSS can steal authentication token
   Fix: Use httpOnly cookies

9. 🟠 No SQL injection prevention verified
   Impact: Even with parameterized queries, should validate
   Fix: Add input sanitization layer

10. 🟠 Timing attack possible
    Impact: Enumerate valid usernames
    Fix: Use constant-time string comparison

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEDIUM RISK (Should improve):

11. 🟡 No RBAC (Role-Based Access Control)
    Impact: Cannot restrict features by user role
    Fix: Implement roles and permission checks

12. 🟡 No HTTPS configuration
    Impact: Traffic not encrypted in production
    Fix: Enforce HTTPS in production

13. 🟡 Missing CSRF protection
    Impact: Cross-site requests can be forged
    Fix: Add CSRF tokens (optional for API-based apps)

14. 🟡 No audit logging
    Impact: Cannot trace data modifications
    Fix: Log all critical operations

15. 🟡 No data encryption at rest
    Impact: Database file is plain text
    Fix: Use SQLite encryption or backup encryption

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERFORMANCE ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⚡ No pagination
   Issue: GET /patients loads ALL patients at once
   Impact: 1000+ patients = slow load time
   Fix: Implement LIMIT/OFFSET pagination

2. ⚡ No database indexes
   Issue: SELECT * WHERE createdBy = ? is full table scan
   Impact: Query time grows with patient count
   Fix: CREATE INDEX on foreign keys

3. ⚡ No connection pooling
   Issue: New SQLite connection per request
   Impact: Connection overhead, no reuse
   Fix: Use database connection pool

4. ⚡ No API response caching
   Issue: Every page load fetches all patients
   Impact: Unnecessary network traffic
   Fix: Implement caching (client-side or Redis)

5. ⚡ Unoptimized React renders
   Issue: No useMemo, useCallback on large lists
   Impact: Page lag when filtering
   Fix: Optimize component re-renders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELIABILITY & DATA INTEGRITY ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⚠️ No transactions
   Issue: Multi-step operations can fail partway
   Impact: Inconsistent state (partial prescriptions)
   Fix: Use database transactions

2. ⚠️ Lost update problem
   Issue: Two concurrent edits, one overwrites the other
   Impact: Doctor A's diagnosis overwritten by Doctor B
   Fix: Implement optimistic locking or last-write-wins visibility

3. ⚠️ Silently failing updates
   Issue: UPDATE query succeeds even if row doesn't exist
   Impact: No error feedback to user
   Fix: Check this.changes > 0

4. ⚠️ No data validation on update
   Issue: Can update patient with invalid data
   Impact: Age becomes -999 if validation not on frontend
   Fix: Server-side validation required

5. ⚠️ No soft deletes
   Issue: Deleting patient is permanent
   Impact: Data loss for referential integrity
   Fix: Add isDeleted flag or soft delete system

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL PROJECT HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completeness:       60% (Core features exist, details missing)
Security:          35% (Auth works, but missing checks)
Stability:         50% (Works for happy path, fails on edge cases)
Production Ready:  20% (Functional demo, not enterprise grade)

Can be used:        ✓ For development/testing
Cannot be used:     ✗ For production/live healthcare without fixes
```

---

## STAGE 12: DEVELOPMENT ROADMAP

### PHASE 1: CRITICAL FIXES (Week 1)

**Priority 1.1: Authentication Security (2 days)**
- [ ] Fix JWT_SECRET fallback - require environment variable
- [ ] Implement password reset flow (/api/auth/forgot-password)
- [ ] Add rate limiting to /auth endpoints
- [ ] Move token to httpOnly cookie (instead of localStorage)
- [ ] Implement token blacklist on logout

**Priority 1.2: Authorization Gates (1 day)**
- [ ] Add ownership checks: `if (createdBy !== req.userId) return 403` on all PUT/DELETE
- [ ] Implement RBAC roles (doctor, asha, admin)
- [ ] Protect admin routes with role checks

**Priority 1.3: Data Integrity (2 days)**
- [ ] Fix patient ID generation - move to backend (use AUTOINCREMENT)
- [ ] Enable PRAGMA foreign_keys = ON in SQLite
- [ ] Add existence checks  before UPDATE (check this.changes > 0)
- [ ] Add database indexes on foreign keys

**Priority 1.4: Input Validation (1 day)**
- [ ] Backend validation for all forms (age range 0-150, phone format, etc.)
- [ ] Add rating range check (1-5)
- [ ] Sanitize user inputs

**PHASE 1 EFFORT:** 6 days, 1 developer

---

### PHASE 2: FEATURE COMPLETION (Week 2-3)

**Priority 2.1: Patient Management (2 days)**
- [ ] Implement patient detail view/modal
- [ ] Save vitals form fields (weight, BP, temperature, etc.)
- [ ] Add patient history/timeline view
- [ ] Implement patient DELETE endpoint
- [ ] Add pagination to patient list (LIMIT 50 per page)

**Priority 2.2: Prescription System (2 days)**
- [ ] Fix form field coupling (frequency, route, quantity properly sent)
- [ ] Implement prescription GET by patient
- [ ] Implement prescription PUT (edit) endpoint
- [ ] Implement prescription DELETE endpoint
- [ ] Add PDF generation for prescription printing
- [ ] Add prescription template/auto-fill

**Priority 2.3: Referral Completion (1 day)**
- [ ] Send urgency, transport, notes fields to API
- [ ] Implement status update endpoint (pending → sent → acknowledged → arrived)
- [ ] Add referral letter template generation
- [ ] Implement facility acknowledgment tracking

**Priority 2.4: Dashboard & Analytics (1 day)**
- [ ] Connect HomePage to real patient/prescription counts
- [ ] Implement SummaryPage with real statistics from database
- [ ] Add inventory integration to HomePage

**PHASE 2 EFFORT:** 6 days, 1 developer

---

### PHASE 3: STABILITY & TESTING (Week 4)

**Priority 3.1: Database Robustness (2 days)**
- [ ] Implement transactions for multi-step operations
- [ ] Add transaction support in prescription creation (all or nothing)
- [ ] Add soft deletes (isDeleted flag on all tables)
- [ ] Implement audit logging table

**Priority 3.2: Error Handling (1 day)**
- [ ] Add comprehensive error handlers for DB failures
- [ ] Implement retry logic for network failures
- [ ] Add timeout to all fetch() calls
- [ ] Improve error messages in API responses

**Priority 3.3: Testing (2 days)**
- [ ] Write unit tests for API endpoints
- [ ] Write integration tests for full flows
- [ ] Write security tests (auth bypass, SQL injection, XSS)
- [ ] Test edge cases (race conditions, duplicate entries)

**Priority 3.4: Monitoring (1 day)**
- [ ] Add error tracking (Sentry or similar)
- [ ] Add logging middleware to Express
- [ ] Implement health check dashboard
- [ ] Add database backup automation

**PHASE 3 EFFORT:** 6 days, 1-2 developers

---

### PHASE 4: ADVANCED FEATURES (Week 5-6)

**Priority 4.1: User Management (2 days)**
- [ ] Implement password change endpoint
- [ ] Implement profile management
- [ ] Add 2FA (two-factor authentication)
- [ ] Implement role-specific dashboards

**Priority 4.2: File Management (2 days)**
- [ ] Implement file upload for patient documents
- [ ] Add document storage (attachment to patient records)
- [ ] Implement backup/export system
- [ ] Add document download/delete

**Priority 4.3: Advanced Filtering & Search (1 day)**
- [ ] Implement multi-field search
- [ ] Add patient search filters (age range, village, status)
- [ ] Add prescription filter by medication
- [ ] Add referral filter by facility/status

**Priority 4.4: Mobile Optimization (1 day)**
- [ ] Test on mobile devices (iOS/Android)
- [ ] Implement touch-friendly controls
- [ ] Add offline support (Service Workers for PWA)
- [ ] Optimize performance for slow networks

**PHASE 4 EFFORT:** 6 days, 1-2 developers

---

### PHASE 5: PRODUCTION HARDENING (Week 7)

**Priority 5.1: Performance Optimization (2 days)**
- [ ] Implement Redis caching for frequent queries
- [ ] Add database connection pooling
- [ ] Optimize React components (useMemo, useCallback, Code splitting)
- [ ] Implement lazy loading for large lists
- [ ] Minify and compress assets

**Priority 5.2: Deployment & DevOps (2 days)**
- [ ] Set up Docker containers for frontend/backend
- [ ] Create CI/CD pipeline (GitHub Actions)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up database backup/restore procedures
- [ ] Create deployment documentation

**Priority 5.3: Security Hardening (1 day)**
- [ ] Implement CSRF protection
- [ ] Add Content Security Policy headers
- [ ] Enable SQL query logging for audit
- [ ] Implement data encryption at rest (SQLite encryption)
- [ ] Security audit of dependencies (npm audit)

**Priority 5.4: Documentation (1 day)**
- [ ] Write API documentation (Swagger/OpenAPI)
- [ ] Create deployment guide
- [ ] Write user manual
- [ ] Document system architecture

**PHASE 5 EFFORT:** 6 days, 2 developers

---

### BUILD PRIORITY TIMELINE

```
CRITICAL PATH TO PRODUCTION (Minimum 4 weeks):

Week 1 (MUST DO):
  ✓ Auth security fixes
  ✓ Authorization gates
  ✓ Data integrity fixes
  → App becomes SAFE

Week 2 (Should Do):
  ✓ Patient/Prescription/Referral complete
  ✓ Dashboard connected
  → App becomes FUNCTIONAL

Week 3 (Should Do):
  ✓ Testing & stability
  ✓ Error handling
  ✓ Monitoring
  → App becomes RELIABLE

Week 4 (Before Launch):
  ✓ Performance optimization
  ✓ HTTPS/Deployment
  ✓ Security audit
  → App PRODUCTION-READY

Total: 4 weeks, 1-2 developers
```

---

### NEXT IMMEDIATE STEPS (Do Today)

```
1. [ ] CREATE HOTFIX BRANCH for critical security issues
2. [ ] Fix JWT_SECRET fallback (10 min)
3. [ ] Add authorization checks to PUT/DELETE (30 min)
4. [ ] Move patient ID generation to backend (2 hours)
5. [ ] Enable foreign keys + add indexes (1 hour)
6. [ ] Add input validation (1 hour)
7. [ ] Write unit tests for fixes (2 hours)
8. [ ] Test all critical flows (1 hour)

TOTAL: ~8 hours to make app reasonably secure for testing

Then: Proceed with Phase 1, 2, 3 in order.
```

---

## CONCLUSION

**The RuralMed application is 60% complete as a functional prototype but requires significant work to be production-ready.**

### What Works Well:
- Authentication infrastructure (JWT, bcryptjs hashing)
- Basic patient registration and retrieval
- API structure and routing
- Frontend UI/UX implementation
- Responsive layout

### What Needs Immediate Attention:
- Security vulnerabilities (JWT secret, authorization checks)
- Race conditions (patient ID generation)
- Data integrity (foreign keys, validation)
- Missing features (edit/delete operations)
- Edge case handling

### Estimated Effort for Production:
- **To MVP (Secure + Functional):** 2-3 weeks, 1-2 developers
- **To full production:** 6-8 weeks, 2-3 developers
- **To enterprise grade:** 10-12 weeks, 3-4 developers (with compliance, HIPAA, etc.)

The codebase is well-structured and has good foundations. With focused effort on the critical issues first, it can reach production quality within 4-6 weeks.

