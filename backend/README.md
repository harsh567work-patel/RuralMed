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

Uses **PostgreSQL** via connection pooling (`pg.Pool`). Configure `DATABASE_URL` (or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) in `.env`. Tables and performance indexes are automatically created on startup.

## Deployment

Recommended platforms:
- Render
- Railway
- Fly.io
- DigitalOcean App Platform / AWS / Supabase

Environment variables:
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL` (PostgreSQL connection URI)

### Initialize the Database

Run the database schema initializer:

```bash
cd backend
npm install
npm run db:init
```

## Auth

Uses JWT. Include token in header: `Authorization: Bearer <token>`.

### Security notes
- Passwords are hashed with bcrypt before persistence.
- Login and registration are protected by rate limiting.
- CSRF tokens are available from `GET /api/auth/csrf-token` for state-changing requests.
- Google OAuth can be enabled by setting `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
