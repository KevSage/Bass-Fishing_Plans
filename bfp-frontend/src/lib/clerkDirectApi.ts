/**
 * Native Auth API
 * Routes auth through the backend to bypass Clerk's CORS restrictions for native apps.
 */

import { isNativePlatform, getApiBaseUrl } from './platform';

// Backend API URL for mobile auth
const API_BASE_URL = getApiBaseUrl();

console.log('[ClerkAPI] Platform:', isNativePlatform() ? 'NATIVE' : 'WEB');
console.log('[ClerkAPI] API Base URL:', API_BASE_URL);

export interface SignInResult {
  success: boolean;
  sessionId?: string;
  userId?: string;
  token?: string;
  email?: string;
  error?: string;
}

export interface SignUpResult {
  success: boolean;
  sessionId?: string;
  userId?: string;
  token?: string;
  error?: string;
  status?: string;
}

/**
 * Sign in with email and password via backend proxy
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    console.log('[ClerkAPI] Attempting sign-in via backend for:', email);
    console.log('[ClerkAPI] POST to:', `${API_BASE_URL}/mobile-auth/sign-in`);

    const response = await fetch(`${API_BASE_URL}/mobile-auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    console.log('[ClerkAPI] Sign-in response:', data);

    if (data.success) {
      return {
        success: true,
        sessionId: data.session_id,
        userId: data.user_id,
        token: data.token,
      };
    }

    return {
      success: false,
      error: data.error || 'Sign in failed',
    };
  } catch (err: any) {
    console.error('[ClerkAPI] Sign-in error:', err);
    return {
      success: false,
      error: err.message || 'Network error',
    };
  }
}

/**
 * Sign in with Apple via backend proxy
 */
export async function signInWithAppleAPI(
  identityToken: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<SignInResult> {
  try {
    console.log('[ClerkAPI] Attempting sign-in with Apple via backend for:', email);
    console.log('[ClerkAPI] POST to:', `${API_BASE_URL}/mobile-auth/apple-sign-in`);

    const response = await fetch(`${API_BASE_URL}/mobile-auth/apple-sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity_token: identityToken,
        email,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();
    console.log('[ClerkAPI] Apple Sign-in response:', data);

    if (data.success) {
      return {
        success: true,
        sessionId: data.session_id,
        userId: data.user_id,
        token: data.token,
        email: data.email,  // Backend returns the user's email (for returning users)
      };
    }

    return {
      success: false,
      error: data.error || 'Apple Sign-In failed',
    };
  } catch (err: any) {
    console.error('[ClerkAPI] Apple Sign-In error:', err);
    return {
      success: false,
      error: err.message || 'Network error',
    };
  }
}

/**
 * Sign up with email and password via backend proxy
 */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<SignUpResult> {
  try {
    console.log('[ClerkAPI] Attempting sign-up via backend for:', email);
    console.log('[ClerkAPI] POST to:', `${API_BASE_URL}/mobile-auth/sign-up`);

    const response = await fetch(`${API_BASE_URL}/mobile-auth/sign-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    console.log('[ClerkAPI] Sign-up response:', data);

    if (data.success) {
      return {
        success: true,
        status: 'complete',
        sessionId: data.session_id,
        userId: data.user_id,
        token: data.token,
      };
    }

    return {
      success: false,
      error: data.error || 'Sign up failed',
    };
  } catch (err: any) {
    console.error('[ClerkAPI] Sign-up error:', err);
    return {
      success: false,
      error: err.message || 'Network error',
    };
  }
}

/**
 * Sign out (currently just clears local state - backend handles session)
 */
export async function signOut(sessionId?: string): Promise<boolean> {
  // For now, just return true - the NativeAuthContext handles clearing local state
  // A full implementation would call a backend endpoint to invalidate the session
  console.log('[ClerkAPI] Sign out requested for session:', sessionId);
  return true;
}

/**
 * Refresh session token
 * Note: For backend-proxied auth, token refresh should go through the backend
 */
export async function refreshToken(sessionId: string): Promise<string | null> {
  console.log('[ClerkAPI] Token refresh requested for session:', sessionId);
  // For now, return null - the token from sign-in should be used
  // A full implementation would call a backend endpoint to refresh the token
  return null;
}
