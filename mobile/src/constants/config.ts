/**
 * App Configuration
 * Environment variables and app-wide settings
 */

// API Configuration
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://bassclarity.onrender.com';

export const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://bassclarity.com';

// Clerk Configuration
export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

// Mapbox Configuration
export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

// App Settings
export const APP_CONFIG = {
  // Clerk loading timeout before showing warning (ms)
  clerkLoadingTimeout: 5000,

  // Minimum password length
  minPasswordLength: 8,

  // API request timeout (ms)
  apiTimeout: 30000,
} as const;
