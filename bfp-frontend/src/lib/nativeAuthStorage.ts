/**
 * Native Auth Storage
 * Uses Capacitor Preferences for storing auth tokens on native platforms
 */
import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';

const STORAGE_KEYS = {
  SESSION_ID: 'clerk_session_id',
  USER_ID: 'clerk_user_id',
  TOKEN: 'clerk_token',
  TOKEN_EXPIRES: 'clerk_token_expires',
  USER_EMAIL: 'clerk_user_email',
};

export interface StoredAuth {
  sessionId: string | null;
  userId: string | null;
  token: string | null;
  tokenExpires: number | null;
  userEmail: string | null;
}

/**
 * Save authentication data
 */
export async function saveAuth(data: {
  sessionId: string;
  userId: string;
  token: string;
  userEmail?: string;
}): Promise<void> {
  if (!isNativePlatform()) {
    // On web, let Clerk SDK handle storage
    return;
  }

  console.log('[NativeAuth] Saving auth data for user:', data.userId);

  await Promise.all([
    Preferences.set({ key: STORAGE_KEYS.SESSION_ID, value: data.sessionId }),
    Preferences.set({ key: STORAGE_KEYS.USER_ID, value: data.userId }),
    Preferences.set({ key: STORAGE_KEYS.TOKEN, value: data.token }),
    Preferences.set({
      key: STORAGE_KEYS.TOKEN_EXPIRES,
      value: String(Date.now() + 55000), // Token expires in ~60s, refresh at 55s
    }),
    data.userEmail
      ? Preferences.set({ key: STORAGE_KEYS.USER_EMAIL, value: data.userEmail })
      : Promise.resolve(),
  ]);
}

/**
 * Get stored authentication data
 */
export async function getAuth(): Promise<StoredAuth> {
  if (!isNativePlatform()) {
    return {
      sessionId: null,
      userId: null,
      token: null,
      tokenExpires: null,
      userEmail: null,
    };
  }

  const [sessionId, userId, token, tokenExpires, userEmail] = await Promise.all([
    Preferences.get({ key: STORAGE_KEYS.SESSION_ID }),
    Preferences.get({ key: STORAGE_KEYS.USER_ID }),
    Preferences.get({ key: STORAGE_KEYS.TOKEN }),
    Preferences.get({ key: STORAGE_KEYS.TOKEN_EXPIRES }),
    Preferences.get({ key: STORAGE_KEYS.USER_EMAIL }),
  ]);

  return {
    sessionId: sessionId.value,
    userId: userId.value,
    token: token.value,
    tokenExpires: tokenExpires.value ? parseInt(tokenExpires.value, 10) : null,
    userEmail: userEmail.value,
  };
}

/**
 * Clear all authentication data
 */
export async function clearAuth(): Promise<void> {
  if (!isNativePlatform()) {
    return;
  }

  console.log('[NativeAuth] Clearing auth data');

  await Promise.all([
    Preferences.remove({ key: STORAGE_KEYS.SESSION_ID }),
    Preferences.remove({ key: STORAGE_KEYS.USER_ID }),
    Preferences.remove({ key: STORAGE_KEYS.TOKEN }),
    Preferences.remove({ key: STORAGE_KEYS.TOKEN_EXPIRES }),
    Preferences.remove({ key: STORAGE_KEYS.USER_EMAIL }),
  ]);
}

/**
 * Check if token needs refresh
 */
export async function needsTokenRefresh(): Promise<boolean> {
  const auth = await getAuth();
  if (!auth.tokenExpires) return true;
  return Date.now() > auth.tokenExpires;
}

/**
 * Update just the token
 */
export async function updateToken(token: string): Promise<void> {
  if (!isNativePlatform()) return;

  await Promise.all([
    Preferences.set({ key: STORAGE_KEYS.TOKEN, value: token }),
    Preferences.set({
      key: STORAGE_KEYS.TOKEN_EXPIRES,
      value: String(Date.now() + 55000),
    }),
  ]);
}
