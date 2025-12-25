const express = require('express');
const JobApplication = require('../models/JobApplication');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const totalApplications = await JobApplication.countDocuments();
    res.json({ totalApplications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;