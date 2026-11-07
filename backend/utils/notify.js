const Notification = require('../models/Notification');
const User = require('../models/User');
const { getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Universal Notification Dispatcher
 * Saves in-app notification to DB & triggers FCM push if recipient has fcmToken
 * 
 * @param {Object} params
 * @param {String|ObjectId} params.recipientId - User ID of the recipient
 * @param {String} params.companyName - Company identifier
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message body
 * @param {String} [params.type='General'] - 'Leave' | 'Attendance' | 'Payroll' | 'Performance' | 'General'
 * @param {String} [params.link=null] - App route to navigate when clicked
 */
const notifyUser = async ({ recipientId, companyName, title, message, type = 'General', link = null }) => {
    try {
        // 1. Create In-App Notification in DB
        const notification = new Notification({
            recipient: recipientId,
            companyName,
            title,
            message,
            type,
            link
        });
        await notification.save();

        // 2. Fetch User to check for FCM Token
        const user = await User.findById(recipientId).select('fcmToken name email');
        if (user && user.fcmToken) {
            const fcmPayload = {
                token: user.fcmToken,
                notification: {
                    title: title,
                    body: message
                },
                data: {
                    type: type,
                    route: link || '/dashboard'
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'hrms_notifications',
                        sound: 'default'
                    }
                }
            };

            try {
                // Ensure Firebase Admin is initialized before sending
                if (getApps().length > 0) {
                    const response = await getMessaging().send(fcmPayload);
                    console.log(`[Notification] FCM sent to ${user.name} (${user.email}): ${response}`);
                } else {
                    console.warn('[Notification] Firebase Admin not initialized, skipping push notification.');
                }
            } catch (fcmErr) {
                console.error(`[Notification] FCM dispatch error for ${user.email}:`, fcmErr.message);
            }
        }

        return notification;
    } catch (err) {
        console.error('[Notification] Failed to create notification:', err.message);
        return null;
    }
};

module.exports = notifyUser;
