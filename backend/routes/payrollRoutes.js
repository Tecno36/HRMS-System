const express = require('express');
const router = express.Router();
const { generatePayroll, getEmployeePayslips } = require('../controllers/payrollController');
const verifyToken = require('../middleware/authMiddleware');
const verifyRole = require('../middleware/roleMiddleware');

router.post('/generate', verifyToken, verifyRole('Super Admin', 'HR'), generatePayroll);
router.get('/my-payslips', verifyToken, verifyRole('Employee'), getEmployeePayslips);

module.exports = router;