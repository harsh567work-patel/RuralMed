import express from 'express';
import { run, get, all } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateFeedback } from '../utils/validation.js';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/helpers.js';

const router = express.Router();

// Get all feedback
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);

    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM feedback WHERE userId = ? AND isDeleted = 0`,
      [req.userId]
    );

    const feedback = await all(
      `SELECT * FROM feedback WHERE userId = ? AND isDeleted = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    );

    res.json(buildPaginatedResponse(feedback, countResult.total, page, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single feedback
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const feedback = await get(
      `SELECT * FROM feedback WHERE id = ? AND isDeleted = 0`,
      [req.params.id]
    );

    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    // Authorization check
    if (feedback.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit feedback
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, message, rating } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate data
    const validation = validateFeedback(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const result = await run(
      `INSERT INTO feedback (userId, type, message, rating) VALUES (?, ?, ?, ?)`,
      [req.userId, type, message, rating || null]
    );

    const newFeedback = await get(`SELECT * FROM feedback WHERE id = ?`, [result.id]);
    res.status(201).json({ message: 'Feedback submitted', data: newFeedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update feedback
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { type, message, rating } = req.body;

    // Get feedback to check ownership
    const feedback = await get(`SELECT * FROM feedback WHERE id = ?`, [req.params.id]);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    // Authorization check
    if (feedback.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate data
    const validation = validateFeedback(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const result = await run(
      `UPDATE feedback SET type = ?, message = ?, rating = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [type, message, rating || null, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update feedback' });
    }

    const updated = await get(`SELECT * FROM feedback WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Feedback updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete feedback (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const feedback = await get(`SELECT * FROM feedback WHERE id = ?`, [req.params.id]);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    // Authorization check
    if (feedback.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await run(
      `UPDATE feedback SET isDeleted = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to delete feedback' });
    }

    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
