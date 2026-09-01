const express = require('express');
const router = express.Router();
const { clockIn, clockOut, getTodayAttendance, getCompanyAttendance, verifyLiveness, getAttendanceHistory } = require('../controllers/attendanceController');
const verifyToken = require('../middleware/authMiddleware');
const verifyRole = require('../middleware/roleMiddleware');

router.post('/clock-in', verifyToken, verifyRole('Employee'), clockIn);
router.post('/clock-out', verifyToken, verifyRole('Employee'), clockOut);
router.post('/verify-liveness', verifyLiveness);
router.get('/today', verifyToken, verifyRole('Employee'), getTodayAttendance);
router.get('/company-report', verifyToken, verifyRole('Super Admin', 'HR'), getCompanyAttendance);
router.get('/history', verifyToken, verifyRole('Employee'), getAttendanceHistory);

module.exports = router;