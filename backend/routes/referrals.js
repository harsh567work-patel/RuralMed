import express from 'express';
import { run, get, all } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateReferral } from '../utils/validation.js';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/helpers.js';

const router = express.Router();

// Get all referrals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);

    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM referrals WHERE referredBy = ? AND isDeleted = 0`,
      [req.userId]
    );

    const referrals = await all(
      `SELECT * FROM referrals WHERE referredBy = ? AND isDeleted = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    );

    res.json(buildPaginatedResponse(referrals, countResult.total, page, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single referral
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const referral = await get(
      `SELECT * FROM referrals WHERE id = ? AND isDeleted = 0`,
      [req.params.id]
    );

    if (!referral) return res.status(404).json({ error: 'Referral not found' });

    // Authorization check
    if (referral.referredBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(referral);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create referral
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patientId, facility, reason, date, urgency, transport, notes } = req.body;

    if (!patientId || !facility || !reason || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate data
    const validation = validateReferral(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    // Verify patient exists and belongs to doctor
    const patient = await get(`SELECT createdBy FROM patients WHERE id = ?`, [patientId]);
    if (!patient) {
      return res.status(400).json({ error: 'Patient not found' });
    }
    if (patient.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Can only refer own patients' });
    }

    const result = await run(
      `INSERT INTO referrals (patientId, referredBy, facility, reason, date, urgency, transport, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientId, req.userId, facility, reason, date, urgency || 'Routine', transport || '', notes || '']
    );

    const newReferral = await get(`SELECT * FROM referrals WHERE id = ?`, [result.id]);
    res.status(201).json({ message: 'Referral created', data: newReferral });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update referral
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { facility, reason, urgency, transport, notes, status } = req.body;

    // Get referral to check ownership
    const referral = await get(`SELECT * FROM referrals WHERE id = ?`, [req.params.id]);
    if (!referral) return res.status(404).json({ error: 'Referral not found' });

    // Authorization check
    if (referral.referredBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate data if provided
    if (facility || reason || urgency) {
      const validation = validateReferral(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
      }
    }

    const result = await run(
      `UPDATE referrals SET facility = ?, reason = ?, urgency = ?, transport = ?, notes = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [facility || referral.facility, reason || referral.reason, urgency || referral.urgency, transport !== undefined ? transport : referral.transport, notes !== undefined ? notes : referral.notes, status || referral.status, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update referral' });
    }

    const updated = await get(`SELECT * FROM referrals WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Referral updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete referral (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const referral = await get(`SELECT * FROM referrals WHERE id = ?`, [req.params.id]);
    if (!referral) return res.status(404).json({ error: 'Referral not found' });

    // Authorization check
    if (referral.referredBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await run(
      `UPDATE referrals SET isDeleted = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to delete referral' });
    }

    res.json({ message: 'Referral deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
