/**
 * Native Auth Context
 * Provides authentication state for native platforms using direct Clerk API
 * On web, this defers to Clerk's React SDK
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isNativePlatform } from '../lib/platform';
import {
  signInWithPassword,
  signUpWithPassword,
  signOut as apiSignOut,
  refreshToken,
  signInWithAppleAPI, // NEW: Import Apple Sign-In API function
} from '../lib/clerkDirectApi';
import {
  saveAuth,
  getAuth,
  clearAuth,
  needsTokenRefresh,
  updateToken,
} from '../lib/nativeAuthStorage';
import {
  initializePushNotifications,
  unregisterPushNotifications,
} from '../lib/pushNotifications';

interface NativeAuthContextType {
  // State
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  sessionId: string | null;

  // Methods
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  // NEW: Apple Sign-In method
  signInWithApple: (
    identityToken: string,
    email: string,
    firstName?: string,
    lastName?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const NativeAuthContext = createContext<NativeAuthContextType | null>(null);

export function NativeAuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialize auth state from storage
  useEffect(() => {
    async function initAuth() {
      if (!isNativePlatform()) {
        // On web, mark as loaded immediately - Clerk SDK handles auth
        setIsLoaded(true);
        return;
      }

      console.log('[NativeAuth] Initializing...');

      try {
        // Check stored auth
        const storedAuth = await getAuth();
        console.log('[NativeAuth] Stored auth:', {
          hasSession: !!storedAuth.sessionId,
          hasToken: !!storedAuth.token,
        });

        if (storedAuth.sessionId && storedAuth.token) {
          // Trust stored auth - API calls will fail if session is invalid
          console.log('[NativeAuth] Restoring session from storage');
          setSessionId(storedAuth.sessionId);
          setUserId(storedAuth.userId);
          setUserEmail(storedAuth.userEmail);
          setToken(storedAuth.token);
          setIsSignedIn(true);

          // Re-initialize push notifications for existing session
          if (storedAuth.userEmail && storedAuth.userId) {
            initializePushNotifications(storedAuth.userEmail, storedAuth.userId).catch((err) => {
              console.warn('[NativeAuth] Push notification re-init failed:', err);
            });
          }
        }
      } catch (err) {
        console.error('[NativeAuth] Init error:', err);
        await clearAuth();
      }

      setIsLoaded(true);
    }

    initAuth();
  }, []);

  // Token refresh interval
  useEffect(() => {
    if (!isNativePlatform() || !isSignedIn || !sessionId) return;

    const refreshInterval = setInterval(async () => {
      if (await needsTokenRefresh()) {
        console.log('[NativeAuth] Refreshing token...');
        const newToken = await refreshToken(sessionId);
        if (newToken) {
          setToken(newToken);
          await updateToken(newToken);
        }
      }
    }, 50000); // Check every 50 seconds

    return () => clearInterval(refreshInterval);
  }, [isSignedIn, sessionId]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[NativeAuth] Sign in attempt:', email);

    const result = await signInWithPassword(email, password);

    if (result.success && result.userId) {
      // Save to storage - use userId as sessionId if no sessionId provided
      await saveAuth({
        sessionId: result.sessionId || result.userId,
        userId: result.userId,
        token: result.token || '',
        userEmail: email,
      });

      // Update state
      setSessionId(result.sessionId || result.userId);
      setUserId(result.userId);
      setUserEmail(email);
      setToken(result.token || null);
      setIsSignedIn(true);

      // Initialize push notifications for mobile
      initializePushNotifications(email, result.userId).catch((err) => {
        console.warn('[NativeAuth] Push notification init failed:', err);
      });

      return { success: true };
    }

    return { success: false, error: result.error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    console.log('[NativeAuth] Sign up attempt:', email);

    const result = await signUpWithPassword(email, password);

    if (result.success && result.userId) {
      // Save to storage - use userId as sessionId if no sessionId provided
      await saveAuth({
        sessionId: result.sessionId || result.userId,
        userId: result.userId,
        token: result.token || '',
        userEmail: email,
      });

      // Update state
      setSessionId(result.sessionId || result.userId);
      setUserId(result.userId);
      setUserEmail(email);
      setToken(result.token || null);
      setIsSignedIn(true);

      // Initialize push notifications for mobile
      initializePushNotifications(email, result.userId).catch((err) => {
        console.warn('[NativeAuth] Push notification init failed:', err);
      });

      return { success: true };
    }

    return { success: false, error: result.error };
  }, []);
  
  // NEW: Sign in with Apple
  const signInWithApple = useCallback(
    async (identityToken: string, email: string, firstName?: string, lastName?: string) => {
      console.log('[NativeAuth] Sign in with Apple attempt:', email);

      // Call new API function for Apple Sign-In
      // This function will be defined in clerkDirectApi.ts
      const result = await signInWithAppleAPI(identityToken, email, firstName, lastName);

      if (result.success && result.userId) {
        // Use email from backend response (for returning users) or fallback to parameter
        const userEmailToSave = result.email || email;

        await saveAuth({
          sessionId: result.sessionId || result.userId,
          userId: result.userId,
          token: result.token || '',
          userEmail: userEmailToSave,
        });

        setSessionId(result.sessionId || result.userId);
        setUserId(result.userId);
        setUserEmail(userEmailToSave);
        setToken(result.token || null);
        setIsSignedIn(true);

        initializePushNotifications(userEmailToSave, result.userId).catch((err) => {
          console.warn('[NativeAuth] Push notification init failed:', err);
        });

        return { success: true };
      }

      return { success: false, error: result.error };
    },
    [],
  );

  const signOut = useCallback(async () => {
    console.log('[NativeAuth] Sign out');

    // Unregister push notifications before sign out
    await unregisterPushNotifications().catch((err) => {
      console.warn('[NativeAuth] Push unregister failed:', err);
    });

    if (sessionId) {
      await apiSignOut(sessionId);
    }

    await clearAuth();

    setSessionId(null);
    setUserId(null);
    setUserEmail(null);
    setToken(null);
    setIsSignedIn(false);
  }, [sessionId]);

  const getToken = useCallback(async () => {
    if (!isNativePlatform()) {
      // On web, return null - Clerk SDK handles tokens
      return null;
    }

    // Check if refresh needed
    if (sessionId && (await needsTokenRefresh())) {
      const newToken = await refreshToken(sessionId);
      if (newToken) {
        setToken(newToken);
        await updateToken(newToken);
        return newToken;
      }
    }

    return token;
  }, [sessionId, token]);

  const value: NativeAuthContextType = {
    isLoaded,
    isSignedIn,
    userId,
    userEmail,
    sessionId,
    signIn,
    signUp,
    signOut,
    getToken,
    // NEW: Include signInWithApple in the context value
    signInWithApple,
  };

  return (
    <NativeAuthContext.Provider value={value}>
      {children}
    </NativeAuthContext.Provider>
  );
}

/**
 * Hook to use native auth
 * Returns native auth on native platforms, or throws if used incorrectly
 */
export function useNativeAuth(): NativeAuthContextType {
  const context = useContext(NativeAuthContext);
  if (!context) {
    throw new Error('useNativeAuth must be used within a NativeAuthProvider');
  }
  return context;
}

/**
 * Platform-aware auth hook
 * Use this in components that need to work on both web and native
 */
export function usePlatformAuth() {
  const nativeAuth = useContext(NativeAuthContext);

  if (!isNativePlatform()) {
    // On web, return a stub - components should use Clerk hooks directly
    return {
      isNative: false,
      nativeAuth: null,
    };
  }

  return {
    isNative: true,
    nativeAuth,
  };
}
