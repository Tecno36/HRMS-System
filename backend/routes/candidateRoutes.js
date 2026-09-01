const express = require('express');
const router = express.Router();
const { createCandidate, getCandidates, updateCandidate, deleteCandidate } = require('../controllers/candidateController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/create', verifyToken, createCandidate);
router.get('/list', verifyToken, getCandidates);
router.put('/update/:id', verifyToken, updateCandidate);
router.delete('/delete/:id', verifyToken, deleteCandidate);

module.exports = router;