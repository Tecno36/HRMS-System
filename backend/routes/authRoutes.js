const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    forgotPasswordOTP, 
    resetPassword, 
    getProfile, 
    updateProfile,
    setMpin,
    loginWithMpin,
    toggleBiometric,
    setupInitialPassword,
    changePassword,
    changeMpin
} = require('../controllers/authController');

const verifyToken = require('../middleware/authMiddleware');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password-otp', forgotPasswordOTP);
router.post('/reset-password', resetPassword);
router.post('/set-mpin', verifyToken, setMpin);
router.post('/login-mpin', loginWithMpin);
router.post('/toggle-biometric', verifyToken, toggleBiometric);
router.post('/setup-password', verifyToken, setupInitialPassword);
router.post('/change-password', verifyToken, changePassword);
router.post('/change-mpin', verifyToken, changeMpin);


router.get('/profile', verifyToken, getProfile);
router.put('/update-profile', verifyToken, updateProfile);

module.exports = router;