import express from 'express';
import { run, get, all } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { validatePatient } from '../utils/validation.js';
import { generatePatientId, parsePaginationParams, buildPaginatedResponse } from '../utils/helpers.js';

const router = express.Router();

// Get all patients with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);

    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM patients WHERE createdBy = ? AND isDeleted = 0`,
      [req.userId]
    );

    // Get paginated results
    const patients = await all(
      `SELECT * FROM patients WHERE createdBy = ? AND isDeleted = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    );

    res.json(buildPaginatedResponse(patients, countResult.total, page, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single patient
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await get(
      `SELECT * FROM patients WHERE id = ? AND isDeleted = 0`,
      [req.params.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Authorization check: can only view own patients
    if (patient.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create patient
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, age, gender, village, phone, diagnosis, weight, bpSystolic, bpDiastolic, temperature, notes } = req.body;

    // Validate required fields
    if (!name || !age || !gender || !village || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate input
    const validation = validatePatient(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    // Generate patient ID on backend (NOT frontend)
    const countResult = await get(`SELECT COUNT(*) as total FROM patients`);
    const patientId = generatePatientId(countResult.total);

    await run(
      `INSERT INTO patients (id, name, age, gender, village, phone, diagnosis, weight, bpSystolic, bpDiastolic, temperature, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientId, name, parseInt(age), gender, village, phone, diagnosis || '', weight || null, bpSystolic || null, bpDiastolic || null, temperature || null, notes || '', req.userId]
    );

    const newPatient = await get(`SELECT * FROM patients WHERE id = ?`, [patientId]);
    res.status(201).json({ message: 'Patient created', data: newPatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update patient
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, age, gender, village, phone, diagnosis, weight, bpSystolic, bpDiastolic, temperature, status, notes } = req.body;

    // Get patient to check ownership
    const patient = await get(`SELECT * FROM patients WHERE id = ?`, [req.params.id]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Authorization check: can only update own patients
    if (patient.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate update data
    const validation = validatePatient(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const result = await run(
      `UPDATE patients SET name = ?, age = ?, gender = ?, village = ?, phone = ?, diagnosis = ?, weight = ?, bpSystolic = ?, bpDiastolic = ?, temperature = ?, status = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, parseInt(age), gender, village, phone, diagnosis || '', weight || null, bpSystolic || null, bpDiastolic || null, temperature || null, status || 'Active', notes || '', req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update patient' });
    }

    const updated = await get(`SELECT * FROM patients WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Patient updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete patient (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Get patient to check ownership
    const patient = await get(`SELECT * FROM patients WHERE id = ?`, [req.params.id]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Authorization check
    if (patient.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await run(
      `UPDATE patients SET isDeleted = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to delete patient' });
    }

    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
