const express = require('express');
const router = express.Router();
const { createHR, getHRList, updateHR, deleteHR } = require('../controllers/hrController');
const verifyRole = require('../middleware/roleMiddleware');
const verifyToken = require('../middleware/authMiddleware');

router.post('/create-hr', verifyToken, verifyRole('Super Admin'), createHR);
router.get('/hr-list', verifyToken, verifyRole('Super Admin', 'HR'), getHRList);
router.put('/update-hr/:id', verifyToken, verifyRole('Super Admin'), updateHR);
router.delete('/delete-hr/:id', verifyToken, verifyRole('Super Admin'), deleteHR);

module.exports = router;