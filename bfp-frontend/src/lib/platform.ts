/**
 * Platform detection utilities for Capacitor
 */
import { Capacitor } from '@capacitor/core';

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
