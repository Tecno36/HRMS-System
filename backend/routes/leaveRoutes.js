const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const { applyLeave, getEmployeeLeaves, getCompanyLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const verifyToken = require('../middleware/authMiddleware');
const verifyRole = require('../middleware/roleMiddleware');

router.post('/apply', verifyToken, verifyRole('Employee'), upload.single('document'), applyLeave);
router.get('/my-leaves', verifyToken, verifyRole('Employee'), getEmployeeLeaves);
router.get('/company-leaves', verifyToken, verifyRole('Super Admin', 'HR'), getCompanyLeaves);
router.put('/update-status/:id', verifyToken, verifyRole('Super Admin', 'HR'), updateLeaveStatus);

module.exports = router;