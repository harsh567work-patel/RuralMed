import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST before importing routes
dotenv.config();

import { initDatabase, seedDemoData } from './db/init.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import prescriptionRoutes from './routes/prescriptions.js';
import referralRoutes from './routes/referrals.js';
import feedbackRoutes from './routes/feedback.js';
import inventoryRoutes from './routes/inventory.js';
import statsRoutes from './routes/stats.js';
import notifyRoutes from './routes/notify.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);

if (process.env.ENFORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (req.secure || forwardedProto === 'https') {
      return next();
    }
    return res.status(403).json({ error: 'HTTPS is required for this application' });
  });
}

// Apply general API rate limiter
app.use('/api/', apiLimiter);

// Initialize database and seed demo data (§8.7)
initDatabase();
seedDemoData();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notify', notifyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
