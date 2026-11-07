import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import axios from './axios';

export const syncFcmToken = async () => {
  try {
    const fcmToken = localStorage.getItem('fcmToken');
    const jwtToken = localStorage.getItem('token');
    if (fcmToken && jwtToken) {
      const res = await axios.post('/auth/update-fcm', { fcmToken });
      localStorage.setItem('fcm_sync_status', 'synced');
      console.log('[FCM] Successfully synced token to backend:', res.data);
      return { success: true, message: 'FCM Token synced to server successfully!' };
    } else {
      const reason = !fcmToken ? 'No FCM token on device yet' : 'User not logged in';
      console.log('[FCM] Skip sync:', reason);
      return { success: false, message: reason };
    }
  } catch (err) {
    localStorage.setItem('fcm_sync_status', 'failed');
    const errMsg = err?.response?.data?.message || err?.message || 'Sync failed';
    console.warn('[FCM] Could not sync token to backend:', errMsg);
    return { success: false, message: errMsg };
  }
};

export const initPushNotifications = async (presentToast, history) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[FCM] Push notifications only available on native mobile platforms.');
    localStorage.setItem('fcm_platform', 'web');
    return;
  }
  localStorage.setItem('fcm_platform', 'native');

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
    localStorage.setItem('fcm_permission', permStatus.receive);

    if (permStatus.receive !== 'granted') {
      console.warn('[FCM] Push notification permission not granted:', permStatus.receive);
      return;
    }

    // 3. Register with Google FCM
    await PushNotifications.register();

    // 4. Registration Success Listener
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[FCM] Device registered, token:', token.value);
      localStorage.setItem('fcmToken', token.value);
      localStorage.setItem('fcm_registered_at', new Date().toISOString());
      await syncFcmToken();
    });

    // 5. Registration Error Listener
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[FCM] Registration error:', error);
      localStorage.setItem('fcm_registration_error', JSON.stringify(error));
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

    // Attempt sync in case token was already stored
    await syncFcmToken();
  } catch (error) {
    console.error('[FCM] Initialization error:', error);
    localStorage.setItem('fcm_init_error', error.message);
  }
};
