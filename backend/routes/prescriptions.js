import express from 'express';
import { run, get, all } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { validatePrescription } from '../utils/validation.js';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/helpers.js';

const router = express.Router();

// Get all prescriptions with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);

    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM prescriptions WHERE doctorId = ? AND isDeleted = 0`,
      [req.userId]
    );

    const prescriptions = await all(
      `SELECT * FROM prescriptions WHERE doctorId = ? AND isDeleted = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    );

    res.json(buildPaginatedResponse(prescriptions, countResult.total, page, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get prescription by patient
router.get('/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const prescriptions = await all(
      `SELECT * FROM prescriptions WHERE patientId = ? AND doctorId = ? AND isDeleted = 0 ORDER BY createdAt DESC`,
      [req.params.patientId, req.userId]
    );

    // Verify patient belongs to doctor
    if (prescriptions.length > 0) {
      const patient = await get(`SELECT createdBy FROM patients WHERE id = ?`, [req.params.patientId]);
      if (!patient || patient.createdBy !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single prescription
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const prescription = await get(
      `SELECT * FROM prescriptions WHERE id = ? AND isDeleted = 0`,
      [req.params.id]
    );

    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    // Authorization check
    if (prescription.doctorId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create prescription
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patientId, drug, dosage, duration, frequency, route, quantity, instructions } = req.body;

    if (!patientId || !drug) {
      return res.status(400).json({ error: 'Missing required fields: patient and drug name' });
    }

    // Validate data (relaxed — only drug name is truly required)
    const validation = validatePrescription(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    // Verify patient exists and belongs to doctor
    const patient = await get(`SELECT createdBy FROM patients WHERE id = ?`, [patientId]);
    if (!patient) {
      return res.status(400).json({ error: 'Patient not found' });
    }
    if (patient.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Can only prescribe to own patients' });
    }

    const result = await run(
      `INSERT INTO prescriptions (patientId, doctorId, drug, dosage, duration, frequency, route, quantity, instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientId, req.userId, drug, dosage || '—', duration || '—', frequency || 'OD', route || 'Oral', quantity || null, instructions || '']
    );

    const newPrescription = await get(`SELECT * FROM prescriptions WHERE id = ?`, [result.id]);
    res.status(201).json({ message: 'Prescription created', data: newPrescription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update prescription
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { drug, dosage, duration, frequency, route, quantity, instructions } = req.body;

    // Get prescription to check ownership
    const prescription = await get(`SELECT * FROM prescriptions WHERE id = ?`, [req.params.id]);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    // Authorization check
    if (prescription.doctorId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate data
    const validation = validatePrescription(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const result = await run(
      `UPDATE prescriptions SET drug = ?, dosage = ?, duration = ?, frequency = ?, route = ?, quantity = ?, instructions = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [drug, dosage, duration, frequency || '', route || '', quantity || null, instructions || '', req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update prescription' });
    }

    const updated = await get(`SELECT * FROM prescriptions WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Prescription updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete prescription (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const prescription = await get(`SELECT * FROM prescriptions WHERE id = ?`, [req.params.id]);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    // Authorization check
    if (prescription.doctorId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await run(
      `UPDATE prescriptions SET isDeleted = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to delete prescription' });
    }

    res.json({ message: 'Prescription deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
