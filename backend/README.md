# RuralMed Backend

Node.js/Express API for RuralMed healthcare management system.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new doctor
- `POST /api/auth/login` - Login

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient

### Prescriptions
- `GET /api/prescriptions` - Get prescriptions
- `POST /api/prescriptions` - Create prescription

### Referrals
- `GET /api/referrals` - Get referrals
- `POST /api/referrals` - Create referral

### Feedback
- `GET /api/feedback` - Get feedback
- `POST /api/feedback` - Submit feedback

### Inventory
- `GET /api/inventory` - Get all items
- `GET /api/inventory/low-stock` - Get low stock items
- `POST /api/inventory` - Create item
- `PUT /api/inventory/:id` - Update stock

## Database

Uses SQLite (`ruralmed.db`). Tables auto-created on startup.

## Deployment

This backend should be hosted separately from Vercel on a Node-friendly service that supports a local filesystem.

Recommended platforms:
- Render
- Railway
- Fly.io
- DigitalOcean App Platform

Example deployment settings:

- Root folder: `backend/`
- Node version: `18` or later
- Install command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `JWT_SECRET`
  - `NODE_ENV=production`
  - `PORT=5000`
  - `DB_PATH` (optional, e.g. `/tmp/ruralmed.db`)

The backend creates `ruralmed.db` automatically by default. If your host uses an ephemeral filesystem, you should set `DB_PATH` to a writable path provided by the platform.

### Build the local database

Run the database initializer locally before deploying if you want a ready demo database:

```bash
cd backend
npm install
npm run db:init
```

This will create the SQLite database file and seed demo data.

## Auth

Uses JWT. Include token in header: `Authorization: Bearer <token>`.

### Security notes
- Passwords are hashed with bcrypt before persistence.
- Login and registration are protected by rate limiting.
- CSRF tokens are available from `GET /api/auth/csrf-token` for state-changing requests.
- Google OAuth can be enabled by setting `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
