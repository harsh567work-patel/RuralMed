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

Uses SQLite (ruralmed.db). Tables auto-created on startup.

## Auth

Uses JWT. Include token in header: `Authorization: Bearer <token>`
