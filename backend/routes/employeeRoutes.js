const express = require('express');
const router = express.Router();
const { createEmployee, getEmployeeList, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const verifyRole = require('../middleware/roleMiddleware');
const verifyToken = require('../middleware/authMiddleware');

router.post('/create-employee', verifyToken, verifyRole('Super Admin', 'HR'), createEmployee);
router.get('/employee-list', verifyToken, verifyRole('Super Admin', 'HR'), getEmployeeList);
router.put('/update-employee/:id', verifyToken, verifyRole('Super Admin', 'HR'), updateEmployee);
router.delete('/delete-employee/:id', verifyToken, verifyRole('Super Admin', 'HR'), deleteEmployee);

module.exports = router;