/**
 * Platform detection utilities for Capacitor
 */
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// API URLs
const PRODUCTION_API_URL = 'https://bassclarity.onrender.com';
const DEV_API_URL = 'http://localhost:8000';

// Toggle this to switch between dev and production for mobile testing
// Set to true when testing with local backend, false for production
const USE_DEV_SERVER = false;

/**
 * Check if running on native platform (iOS/Android via Capacitor)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Check if running in web browser
 */
export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web';
}

/**
 * Get the current platform
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Get the API base URL
 * On native platforms, use dev or production based on USE_DEV_SERVER toggle
 * On web, use the env variable (which may be a proxy path like /api)
 */
export function getApiBaseUrl(): string {
  if (isNativePlatform()) {
    // Native platforms need the full URL (no proxy)
    // Use dev server when testing locally, production otherwise
    return USE_DEV_SERVER ? DEV_API_URL : PRODUCTION_API_URL;
  }
  // Web can use the proxy or env variable
  return import.meta.env.VITE_API_BASE_URL || PRODUCTION_API_URL;
}

/**
 * Check if using dev server (for debugging)
 */
export function isUsingDevServer(): boolean {
  return isNativePlatform() && USE_DEV_SERVER;
}

/**
 * Configure status bar for native platforms
 * Sets light text (white) for dark backgrounds
 */
export async function configureStatusBar(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // Style.Dark = LIGHT/WHITE text (for dark backgrounds) - confusing naming!
    // Style.Light = DARK/BLACK text (for light backgrounds)
    await StatusBar.setStyle({ style: Style.Dark });

    // On Android, set background color (iOS handles this via the app)
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
    }
  } catch (err) {
    console.warn('StatusBar configuration failed:', err);
  }
}

/**
 * Get current GPS position using Capacitor Geolocation on native, web API on browser
 * Returns { latitude, longitude } or throws on failure
 */
export async function getCurrentPosition(options?: {
  timeout?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
}): Promise<{ latitude: number; longitude: number }> {
  const timeout = options?.timeout ?? 15000;
  const enableHighAccuracy = options?.enableHighAccuracy ?? true;
  const maximumAge = options?.maximumAge ?? 60000;

  if (isNativePlatform()) {
    // Use Capacitor Geolocation plugin for native platforms
    const { Geolocation } = await import('@capacitor/geolocation');

    // Check/request permissions first
    let perms = await Geolocation.checkPermissions();
    console.log('[Geolocation] Current permissions:', perms.location);

    if (perms.location === 'prompt' || perms.location === 'prompt-with-rationale') {
      console.log('[Geolocation] Requesting permissions...');
      perms = await Geolocation.requestPermissions();
      console.log('[Geolocation] After request:', perms.location);
    }

    if (perms.location !== 'granted') {
      throw new Error('Location permission denied');
    }

    console.log('[Geolocation] Getting position via Capacitor...');
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    console.log('[Geolocation] Success:', position.coords.latitude, position.coords.longitude);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } else {
    // Web browser - use navigator.geolocation
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          reject(new Error(err.message));
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }
}
