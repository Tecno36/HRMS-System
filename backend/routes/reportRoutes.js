const express = require('express');
const router = express.Router();
const { getReportData } = require('../controllers/reportController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/:type', verifyToken, getReportData);

module.exports = router;