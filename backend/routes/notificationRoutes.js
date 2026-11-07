const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    testPushNotification,
    broadcastNotification
} = require('../controllers/notificationController');

// Public diagnostic status endpoint (no auth required) to inspect Firebase Admin state on Render
router.get('/status', (req, res) => {
    const { getApps } = require('firebase-admin/app');
    const systemKeys = new Set([
        'PATH', 'NODE_VERSION', 'PORT', 'HOME', 'PWD', 'HOSTNAME', 'SHLVL', 
        'LANG', 'LC_ALL', 'OLDPWD', 'USER', 'NODE_ENV', 'RENDER', 
        'RENDER_GIT_COMMIT', 'RENDER_GIT_BRANCH', 'RENDER_GIT_REPO_SLUG',
        'RENDER_SERVICE_ID', 'RENDER_SERVICE_NAME', 'RENDER_SERVICE_TYPE',
        'RENDER_INSTANCE_ID'
    ]);
    const customKeys = Object.keys(process.env).filter(k => !systemKeys.has(k));

    res.json({
        status: 'ok',
        serverTime: new Date().toISOString(),
        gitCommit: process.env.RENDER_GIT_COMMIT || 'local',
        gitBranch: process.env.RENDER_GIT_BRANCH || 'local',
        allCustomEnvKeysOnRender: customKeys,
        firebaseAdmin: global.__firebaseDebug || {
            initialized: getApps().length > 0
        }
    });
});

router.use(verifyToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/test-push', testPushNotification);
router.post('/broadcast', broadcastNotification);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
