const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    testPushNotification
} = require('../controllers/notificationController');

// Public diagnostic status endpoint (no auth required) to inspect Firebase Admin state on Render
router.get('/status', (req, res) => {
    const { getApps } = require('firebase-admin/app');
    res.json({
        status: 'ok',
        serverTime: new Date().toISOString(),
        gitCommit: process.env.RENDER_GIT_COMMIT || 'local',
        gitBranch: process.env.RENDER_GIT_BRANCH || 'local',
        firebaseAdmin: global.__firebaseDebug || {
            initialized: getApps().length > 0
        }
    });
});

router.use(verifyToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/test-push', testPushNotification);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
