const Notification = require('../models/Notification');
const User = require('../models/User');
const { getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

exports.testPushNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const token = req.body.token || user.fcmToken;

        if (getApps().length === 0) {
            return res.status(500).json({
                status: 'fail',
                message: 'Firebase Admin SDK is NOT initialized on this server.',
                debug: global.__firebaseDebug || {
                    initialized: false,
                    error: 'Firebase apps array is empty'
                }
            });
        }

        if (!token) {
            return res.status(400).json({
                status: 'fail',
                message: `User "${user.name}" (${user.email}) does NOT have an fcmToken in the database yet. Make sure to open the Android app and log in so the device token gets synced.`
            });
        }

        const message = {
            token: token,
            notification: {
                title: '🎉 Test Push Notification',
                body: `Hello ${user.name}! Firebase Push Notification is working on Render!`
            },
            data: {
                route: '/dashboard'
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'hrms_notifications',
                    sound: 'default'
                }
            }
        };

        const fcmResponse = await getMessaging().send(message);

        return res.status(200).json({
            status: 'success',
            message: 'Push notification dispatched successfully!',
            fcmResponse,
            sentTo: {
                name: user.name,
                email: user.email,
                fcmTokenPreview: token.slice(0, 25) + '...'
            }
        });
    } catch (error) {
        console.error('[Notification Test Error]:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message,
            code: error.code || 'FIREBASE_ERROR'
        });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments({ recipient: userId }),
            Notification.countDocuments({ recipient: userId, isRead: false })
        ]);

        res.status(200).json({
            status: 'success',
            data: notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await Notification.countDocuments({ recipient: userId, isRead: false });
        res.status(200).json({ status: 'success', unreadCount: count });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ status: 'fail', message: 'Notification not found' });
        }

        res.status(200).json({ status: 'success', data: notification });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
        res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndDelete({ _id: id, recipient: userId });
        if (!notification) {
            return res.status(404).json({ status: 'fail', message: 'Notification not found' });
        }

        res.status(200).json({ status: 'success', message: 'Notification removed' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
