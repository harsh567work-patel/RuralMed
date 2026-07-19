import express from 'express';
import { run, get, all } from '../db/init.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validateInventory } from '../utils/validation.js';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/helpers.js';

const router = express.Router();

// Get all inventory items with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);

    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM inventory WHERE isDeleted = 0`
    );

    const items = await all(
      `SELECT * FROM inventory WHERE isDeleted = 0 ORDER BY name LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json(buildPaginatedResponse(items, countResult.total, page, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get low stock items
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const items = await all(
      `SELECT * FROM inventory WHERE stock < minThreshold AND isDeleted = 0 ORDER BY name`
    );
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single inventory item
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await get(
      `SELECT * FROM inventory WHERE id = ? AND isDeleted = 0`,
      [req.params.id]
    );

    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create inventory item
router.post('/', authMiddleware, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { name, stock, minThreshold, unit } = req.body;

    if (!name || stock === undefined || !minThreshold) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate data
    const validation = validateInventory(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const result = await run(
      `INSERT INTO inventory (name, stock, minThreshold, unit) VALUES (?, ?, ?, ?)`,
      [name, parseInt(stock), parseInt(minThreshold), unit || 'tablets']
    );

    const newItem = await get(`SELECT * FROM inventory WHERE id = ?`, [result.id]);
    res.status(201).json({ message: 'Inventory item created', data: newItem });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Item with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update inventory
router.put('/:id', authMiddleware, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { stock, minThreshold, unit } = req.body;

    // Get item to verify it exists
    const item = await get(`SELECT * FROM inventory WHERE id = ?`, [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    // Validate data
    const validation = validateInventory(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const result = await run(
      `UPDATE inventory SET stock = ?, minThreshold = ?, unit = ?, lastUpdated = CURRENT_TIMESTAMP WHERE id = ?`,
      [parseInt(stock), parseInt(minThreshold), unit || item.unit, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update inventory' });
    }

    const updated = await get(`SELECT * FROM inventory WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Inventory updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete inventory item (soft delete)
router.delete('/:id', authMiddleware, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const item = await get(`SELECT * FROM inventory WHERE id = ?`, [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    const result = await run(
      `UPDATE inventory SET isDeleted = 1 WHERE id = ?`,
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to delete inventory item' });
    }

    res.json({ message: 'Inventory item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
