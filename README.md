# RuralMed (Innoveda)

---

## 1. Problem Statement

Rural healthcare centers face:
- Limited or no internet connectivity
- High patient load with minimal staff
- Paper-based record inefficiencies
- Lack of real-time decision support
- Poor tracking of patient history and referrals

---

## 2. System Objectives

- Digitize patient records with minimal effort
- Ensure offline-first functionality
- Provide quick access to medical history
- Enable basic clinical decision support
- Improve operational efficiency in PHCs

---

## 3. Project Structure

The project is strictly organized into clean, focused directories:

```text
ruralmed/
├── frontend/             # React + Vite offline-first PWA client
│   ├── public/           # Static assets (favicons, icons)
│   ├── src/              # Components, Pages, Services, Hooks, Dexie DB
│   ├── package.json      # Frontend dependencies & build scripts
│   └── vite.config.js    # Vite configuration & PWA service worker settings
│
├── backend/              # Node.js + Express REST API
│   ├── controllers/      # Route controllers (prescriptions, etc.)
│   ├── middleware/       # Auth, rate limiting, logging, error handling
│   ├── routes/           # Express endpoints (auth, patients, inventory, etc.)
│   ├── services/         # Third-party integrations (Twilio, SMS, WhatsApp)
│   ├── utils/            # Validators, helpers, logger
│   ├── server.js         # Express server entrypoint
│   └── package.json      # Backend dependencies & scripts
│
├── database/             # Dedicated SQLite database module
│   ├── schema.sql        # Pure SQL schema (tables, foreign keys, indexes)
│   ├── init.js           # Database connection & schema migration manager
│   ├── seed.js           # Standalone seed runner for demo data
│   ├── ruralmed.db       # Primary SQLite database file
│   ├── package.json      # Database module configuration
│   └── README.md         # Database documentation & table reference
│
├── docs/                 # Architecture, specifications & audit guides
│   ├── system.md
│   ├── offline-first-architecture.md
│   ├── setup-guide.md
│   ├── quick-reference.md
│   └── audit-report.md
│
├── requirement.txt       # Unified system & dependency specifications
├── requirements.txt      # Convention alias for requirement.txt
├── vercel.json           # Vercel deployment configuration
└── README.md             # Project documentation
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                    │
│                  (NetworkStatusBar, Forms)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DATABASE (IndexedDB)                │
│                  via Dexie.js (Schema v1)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tables: patients, prescriptions, referrals,         │   │
│  │ inventory, syncQueue, conflictLog                   │   │
│  │ Each record: {id, uuid, synced, updatedAt,         │   │
│  │ deletedAt, data...}                                │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
         (Online Only)          (Can be Offline)
    ┌──────────────────┐    ┌──────────────────┐
    │  SYNC SERVICE    │◄──►│ NETWORK DETECTOR │
    │ (Background)     │    │  (Polling)       │
    └────────┬─────────┘    └──────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express)                     │
│           (SQLite Database, Auth, Validation)               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### CREATE Operation (Offline-First)

```
1. User fills form → Submit
2. patientService.createPatient(data)
   ├─ Generate UUID (client-side)
   ├─ Set synced = false
   ├─ Set updatedAt = now()
   └─ Save to IndexedDB
3. UI updates immediately (optimistic)
4. When online → Sync service detects unsynced records
5. POST /api/patients with {uuid, data, updatedAt}
6. Backend creates/updates record
7. Mark synced = true in local DB
```

### READ Operation (Always Local)

```
1. User requests patient list
2. patientService.getAllPatients()
   ├─ Query IndexedDB (instant)
   ├─ Sort by updatedAt
   └─ Return to UI
3. UI renders from local data
4. No network call needed!
```## 4. Functional Requirements

### 4.1 Authentication & User Management
- Login/logout
- Role-based access
- Session persistence

---

### 4.2 Patient Management
- Create, read, update patient records
- Search and filter functionality
- Store demographics and identifiers

---

### 4.3 Vitals & Medical Records
- Record BP, temperature, weight
- Store allergies and comorbidities
- Maintain visit history

---

### 4.4 Prescription System
- Create and store prescriptions
- Link prescriptions to patients
- View prescription history

---

### 4.5 Referral System
- Refer patients to higher centers
- Track referral details and urgency

---

### 4.6 Inventory Management
- Track drug stock levels
- Update inventory
- Display low stock alerts

---

### 4.7 Dashboard
- Overview metrics
- Recent activity
- Quick actions

---

### 4.8 Notifications
- Success/error messages
- Alerts for abnormal vitals
- System feedback

---


Still working over backend , in devolpment phase

---

## Deployment Guide

### Frontend: Vercel

This repository uses `frontend/` as the Vercel app root.

- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_BASE`

Set `VITE_API_BASE` to the backend URL, for example:

```text
https://your-backend-host.example.com/api
```

### Backend: separate host

The backend is an Express app with SQLite and should be hosted on a Node-friendly platform that supports a persistent filesystem.

Recommended hosts:
- Render
- Railway
- Fly.io
- DigitalOcean App Platform

Backend environment variables:

- `JWT_SECRET` = secure production secret
- `NODE_ENV` = `production`
- `PORT` = `5000` (or host-provided port)
- `DB_PATH` = optional path to the SQLite database file

The backend auto-creates `ruralmed.db` on startup by default and seeds demo data.

> Do not deploy the backend as a Vercel app. Vercel is best for static/front-end builds and serverless functions, not a persistent SQLite-based Express service.

