const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const verifyToken = require('../middleware/authMiddleware');
const verifyRole = require('../middleware/roleMiddleware');

router.get('/', verifyToken, getSettings);
router.put('/', verifyToken, verifyRole('Super Admin'), updateSettings);

module.exports = router;