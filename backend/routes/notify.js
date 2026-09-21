/**
 * notify.js  – /api/notify
 * Thin route that exposes prescriptionController.dispatchPrescriptionAlert.
 * Used to test WhatsApp / SMS dispatch without touching the prescriptions CRUD flow.
 */

import express from 'express';
import { dispatchPrescriptionAlert } from '../controllers/prescriptionController.js';

const router = express.Router();

// POST /api/notify/dispatch
router.post('/dispatch', dispatchPrescriptionAlert);

export default router;
