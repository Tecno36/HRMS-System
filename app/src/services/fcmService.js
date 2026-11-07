import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import axios from './axios';

export const syncFcmToken = async () => {
  try {
    const fcmToken = localStorage.getItem('fcmToken');
    const jwtToken = localStorage.getItem('token');
    if (fcmToken && jwtToken) {
      await axios.post('/auth/update-fcm', { fcmToken });
      console.log('[FCM] Successfully synced token to backend');
    }
  } catch (err) {
    console.warn('[FCM] Could not sync token to backend:', err?.message || err);
  }
};

export const initPushNotifications = async (presentToast, history) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[FCM] Push notifications only available on native mobile platforms.');
    return;
  }

  try {
    // 1. Create Android Notification Channel (Required for Android 8.0+)
    await PushNotifications.createChannel({
      id: 'hrms_notifications',
      name: 'HRMS Notifications',
      description: 'Alerts and updates for Leaves, Attendance, and Payroll',
      importance: 5,
      visibility: 1,
      sound: 'default',
      vibration: true
    });

    // 2. Request Permissions
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      console.warn('[FCM] Push notification permission not granted:', permStatus.receive);
      return;
    }

    // 3. Register with Apple / Google APNS / FCM
    await PushNotifications.register();

    // 4. Registration Success Listener
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[FCM] Device registered, token:', token.value);
      localStorage.setItem('fcmToken', token.value);
      await syncFcmToken();
    });

    // 5. Registration Error Listener
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[FCM] Registration error:', error);
    });

    // 6. Foreground Notification Received Listener
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      if (presentToast) {
        presentToast({
          message: `${notification.title || 'Notification'}: ${notification.body || ''}`,
          duration: 4000,
          position: 'top',
          color: 'light'
        });
      }
    });

    // 7. Notification Click / Action Listener
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification?.notification?.data;
      if (data && data.route && history) {
        history.push(data.route);
      }
    });

    // Attempt sync in case token was already stored from previous session
    await syncFcmToken();
  } catch (error) {
    console.error('[FCM] Initialization error:', error);
  }
};
