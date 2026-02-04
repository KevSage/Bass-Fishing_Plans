/**
 * Platform detection utilities for Capacitor
 */
import { Capacitor } from '@capacitor/core';

// Production API URL (used on native platforms)
const PRODUCTION_API_URL = 'https://bassclarity.onrender.com';

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
 * On native platforms, use the production URL directly
 * On web, use the env variable (which may be a proxy path like /api)
 */
export function getApiBaseUrl(): string {
  if (isNativePlatform()) {
    // Native platforms need the full URL (no proxy)
    return PRODUCTION_API_URL;
  }
  // Web can use the proxy or env variable
  return import.meta.env.VITE_API_BASE_URL || PRODUCTION_API_URL;
}
