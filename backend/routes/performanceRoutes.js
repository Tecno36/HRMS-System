const express = require('express');
const router = express.Router();
const { createPerformance, getPerformances, updatePerformance, deletePerformance } = require('../controllers/performanceController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/create', verifyToken, createPerformance);
router.get('/list', verifyToken, getPerformances);
router.put('/update/:id', verifyToken, updatePerformance);
router.delete('/delete/:id', verifyToken, deletePerformance);

module.exports = router;