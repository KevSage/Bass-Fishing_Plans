// src/lib/pushNotifications.ts
/**
 * Push notification service for Bass Clarity iOS app.
 * Handles Capacitor Push Notifications plugin integration.
 */

import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { isNativePlatform, getApiBaseUrl } from './platform';

// Track initialization state
let isInitialized = false;
let currentDeviceToken: string | null = null;

/**
 * Initialize push notifications for the iOS app.
 * Should be called after successful sign-in.
 */
export async function initializePushNotifications(
  email: string,
  userId: string
): Promise<boolean> {
  // Only initialize on native platforms
  if (!isNativePlatform()) {
    console.log('[Push] Web platform - skipping push setup');
    return false;
  }

  // Prevent double initialization
  if (isInitialized) {
    console.log('[Push] Already initialized');
    return true;
  }

  try {
    // Check current permission status
    const permStatus = await PushNotifications.checkPermissions();
    console.log('[Push] Current permission status:', permStatus.receive);

    // Request permission if not granted
    if (permStatus.receive !== 'granted') {
      const requestResult = await PushNotifications.requestPermissions();

      if (requestResult.receive !== 'granted') {
        console.log('[Push] Permission denied by user');
        return false;
      }
    }

    // Set up listeners before registration
    setupPushListeners(email, userId);

    // Register with APNs
    await PushNotifications.register();

    isInitialized = true;
    console.log('[Push] Registration initiated');
    return true;

  } catch (error) {
    console.error('[Push] Initialization failed:', error);
    return false;
  }
}

/**
 * Set up push notification event listeners.
 */
function setupPushListeners(email: string, userId: string): void {
  // Listen for successful registration
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('[Push] Token received:', token.value.substring(0, 20) + '...');
    currentDeviceToken = token.value;

    // Send token to backend
    await registerDeviceToken(email, userId, token.value);
  });

  // Listen for registration errors
  PushNotifications.addListener('registrationError', (error) => {
    console.error('[Push] Registration error:', error);
  });

  // Listen for push notifications received (app in foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('[Push] Notification received:', notification);

    // Handle the notification based on type
    handleNotificationReceived(notification);
  });

  // Listen for notification tap (app opened via notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('[Push] Notification action:', action);

    // Navigate to relevant screen based on notification data
    handleNotificationAction(action);
  });
}

/**
 * Register device token with backend.
 */
async function registerDeviceToken(
  email: string,
  userId: string,
  deviceToken: string
): Promise<void> {
  const apiUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiUrl}/mobile-auth/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        user_id: userId,
        device_token: deviceToken,
        platform: 'ios',
      }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Push] Device registered:', result);

  } catch (error) {
    console.error('[Push] Device registration failed:', error);
  }
}

/**
 * Handle notification received while app is in foreground.
 */
function handleNotificationReceived(notification: PushNotificationSchema): void {
  const { title, body, data } = notification;

  // For now, just log it - the system will show the notification banner
  console.log('[Push] In-app notification:', { title, body, data });

  // Could show a custom in-app toast here if desired
}

/**
 * Handle notification action (user tapped the notification).
 */
function handleNotificationAction(action: ActionPerformed): void {
  const { notification } = action;
  const data = notification.data as Record<string, unknown> | undefined;

  if (!data) {
    console.log('[Push] No data in notification action');
    return;
  }

  const notificationType = data.type as string;

  // Navigate based on notification type
  switch (notificationType) {
    case 'weather_alert':
      // Could navigate to members page or show weather details
      console.log('[Push] Weather alert tapped');
      break;

    case 'achievement_proximity':
      // Could navigate to journey page
      console.log('[Push] Achievement alert tapped:', data.achievement_id);
      break;

    default:
      console.log('[Push] Unknown notification type:', notificationType);
  }
}

/**
 * Unregister device from push notifications.
 * Should be called on sign-out.
 */
export async function unregisterPushNotifications(): Promise<void> {
  if (!isNativePlatform() || !currentDeviceToken) {
    return;
  }

  const apiUrl = getApiBaseUrl();

  try {
    await fetch(`${apiUrl}/mobile-auth/unregister-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_token: currentDeviceToken }),
    });

    console.log('[Push] Device unregistered');

    // Remove listeners
    await PushNotifications.removeAllListeners();

    isInitialized = false;
    currentDeviceToken = null;

  } catch (error) {
    console.error('[Push] Unregister failed:', error);
  }
}

/**
 * Get the current device token (if registered).
 */
export function getDeviceToken(): string | null {
  return currentDeviceToken;
}

/**
 * Check if push notifications are initialized.
 */
export function isPushInitialized(): boolean {
  return isInitialized;
}
