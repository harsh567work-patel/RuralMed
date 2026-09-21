# RuralMed Database

RuralMed uses **PostgreSQL** for robust, scalable relational data persistence on the backend, coupled with offline-first clinical workflows on the frontend.

## Directory Contents

| File | Purpose |
|------|---------|
| `schema.sql` | Pure DDL SQL script defining all PostgreSQL tables, relations, and indexes |
| `init.js` | Node.js connection manager (`pg.Pool`), query translator, and schema initialization module |
| `seed.js` | Standalone schema initialization runner |

## Tables Overview

1. **`users`**: Healthcare staff accounts (doctors, nurses, administrators), passwords (bcrypt hashed), facility assignment, role-based access.
2. **`patients`**: Patient demographics (name, age, gender, phone, village), clinical vitals (blood pressure, temperature, weight, respiratory rate), latest diagnosis, active status.
3. **`prescriptions`**: Drug orders, dosage, frequency (OD/BD/TDS/SOS), duration, route (Oral/Inhalation/etc.), linked to patient and prescribing doctor.
4. **`referrals`**: Escalation tracking to tertiary centers, facility name, urgency level, transport mode, and status (`Pending`, `Completed`).
5. **`inventory`**: PHC essential drug supplies, available stock, minimum threshold alerts, unit of measurement.
6. **`feedback`**: Provider and patient feedback ratings and notes.
7. **`audit_logs`**: Clinical change logs with timestamps, actions, and user tracking.

## Performance Indexes

- `idx_patients_createdby` on `patients(createdBy)`
- `idx_patients_status` on `patients(status)`
- `idx_prescriptions_patientid` on `prescriptions(patientId)`
- `idx_prescriptions_doctorid` on `prescriptions(doctorId)`
- `idx_referrals_patientid` on `referrals(patientId)`
- `idx_referrals_referredby` on `referrals(referredBy)`
- `idx_feedback_userid` on `feedback(userId)`
- `idx_audit_logs_userid` on `audit_logs(userId)`
- `idx_audit_logs_timestamp` on `audit_logs(timestamp)`

## How to Initialize Schema

Ensure PostgreSQL is running and your `DATABASE_URL` or `PG*` environment variables are configured in `backend/.env`.

From the project root:

```bash
node database/seed.js
```

Or from the backend:

```bash
cd backend
npm run db:init
```
