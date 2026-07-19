import express from 'express';
import { get, all } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/stats/dashboard
 * Returns dashboard statistics for the logged-in doctor
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Get patient count
    const patientCount = await get(
      `SELECT COUNT(*) as count FROM patients WHERE createdBy = ? AND isDeleted = 0`,
      [req.userId]
    );

    // Get prescription count
    const prescriptionCount = await get(
      `SELECT COUNT(*) as count FROM prescriptions WHERE doctorId = ? AND isDeleted = 0`,
      [req.userId]
    );

    // Get referral count
    const referralCount = await get(
      `SELECT COUNT(*) as count FROM referrals WHERE referredBy = ? AND isDeleted = 0`,
      [req.userId]
    );

    // Get pending referrals
    const pendingReferrals = await get(
      `SELECT COUNT(*) as count FROM referrals WHERE referredBy = ? AND status = 'Pending' AND isDeleted = 0`,
      [req.userId]
    );

    // Get low stock items
    const lowStockCount = await get(
      `SELECT COUNT(*) as count FROM inventory WHERE stock < minThreshold AND isDeleted = 0`
    );

    // Get recent patients (last 5)
    const recentPatients = await all(
      `SELECT id, name, age, village, lastVisit FROM patients WHERE createdBy = ? AND isDeleted = 0 ORDER BY createdAt DESC LIMIT 5`,
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        patients: patientCount.count,
        prescriptions: prescriptionCount.count,
        referrals: referralCount.count,
        pendingReferrals: pendingReferrals.count,
        lowStockItems: lowStockCount.count,
        recentPatients,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats/summary
 * Returns summary statistics for analytics/reports
 */
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    // Patient statistics
    const activePatients = await get(
      `SELECT COUNT(*) as count FROM patients WHERE createdBy = ? AND status = 'Active' AND isDeleted = 0`,
      [req.userId]
    );

    const referredPatients = await get(
      `SELECT COUNT(*) as count FROM patients WHERE createdBy = ? AND status = 'Referred' AND isDeleted = 0`,
      [req.userId]
    );

    // Referral statistics — these were missing, causing ReferenceError
    const pendingReferrals = await get(
      `SELECT COUNT(*) as count FROM referrals WHERE referredBy = ? AND status = 'Pending' AND isDeleted = 0`,
      [req.userId]
    );

    const sentReferrals = await get(
      `SELECT COUNT(*) as count FROM referrals WHERE referredBy = ? AND status = 'Sent' AND isDeleted = 0`,
      [req.userId]
    );

    const acknowledgedReferrals = await get(
      `SELECT COUNT(*) as count FROM referrals WHERE referredBy = ? AND status = 'Acknowledged' AND isDeleted = 0`,
      [req.userId]
    );

    const arrivedReferrals = await get(
      `SELECT COUNT(*) as count FROM referrals WHERE referredBy = ? AND status = 'Arrived' AND isDeleted = 0`,
      [req.userId]
    );

    // Prescription statistics — prescriptionCount was also missing
    const prescriptionCount = await get(
      `SELECT COUNT(*) as count FROM prescriptions WHERE doctorId = ? AND isDeleted = 0`,
      [req.userId]
    );

    const prescriptionsByDrug = await all(
      `SELECT drug, COUNT(*) as count FROM prescriptions WHERE doctorId = ? AND isDeleted = 0 GROUP BY drug ORDER BY count DESC LIMIT 10`,
      [req.userId]
    );

    // Feedback statistics
    const avgRating = await get(
      `SELECT AVG(rating) as average FROM feedback WHERE userId = ? AND rating IS NOT NULL AND isDeleted = 0`,
      [req.userId]
    );

    const feedbackCount = await get(
      `SELECT COUNT(*) as count FROM feedback WHERE userId = ? AND isDeleted = 0`,
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        patients: {
          active: activePatients.count,
          referred: referredPatients.count,
        },
        referrals: {
          pending: pendingReferrals.count,
          sent: sentReferrals.count,
          acknowledged: acknowledgedReferrals.count,
          arrived: arrivedReferrals.count,
        },
        prescriptions: {
          total: prescriptionCount.count,
          topDrugs: prescriptionsByDrug,
        },
        feedback: {
          count: feedbackCount.count,
          averageRating: avgRating.average ? parseFloat(avgRating.average.toFixed(2)) : null,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats/inventory
 * Returns inventory statistics
 */
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    // Get total inventory value
    const totalItems = await get(
      `SELECT COUNT(*) as count FROM inventory WHERE isDeleted = 0`
    );

    const lowStockItems = await get(
      `SELECT COUNT(*) as count FROM inventory WHERE stock < minThreshold AND isDeleted = 0`
    );

    // Get critical stock (stock < 2 * minThreshold)
    const criticalStock = await all(
      `SELECT name, stock, minThreshold FROM inventory WHERE stock < minThreshold AND isDeleted = 0 ORDER BY stock ASC`,
      []
    );

    res.json({
      success: true,
      data: {
        totalItems: totalItems.count,
        lowStockCount: lowStockItems.count,
        criticalStock,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
