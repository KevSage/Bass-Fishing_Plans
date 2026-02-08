/**
 * Platform-aware authentication hook
 * Uses Clerk SDK on web, direct API on native platforms
 */
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-react";
import { useNativeAuth } from "@/context/NativeAuthContext";
import { isNativePlatform } from "@/lib/platform";

export interface PlatformAuthState {
  // State
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null | undefined;

  // Methods
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

export interface PlatformUserState {
  user: {
    id: string | null;
    primaryEmailAddress: {
      emailAddress: string | null;
    } | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  isLoaded: boolean;
}

/**
 * Platform-aware replacement for useAuth
 */
export function usePlatformAuth(): PlatformAuthState {
  const clerkAuth = useClerkAuth();
  const nativeAuth = useNativeAuth();
  const isNative = isNativePlatform();

  if (isNative) {
    return {
      isLoaded: nativeAuth.isLoaded,
      isSignedIn: nativeAuth.isSignedIn,
      userId: nativeAuth.userId,
      getToken: nativeAuth.getToken,
      signOut: nativeAuth.signOut,
    };
  }

  // Web - use Clerk SDK
  return {
    isLoaded: clerkAuth.isLoaded,
    isSignedIn: clerkAuth.isSignedIn ?? false,
    userId: clerkAuth.userId,
    getToken: async () => {
      const token = await clerkAuth.getToken();
      return token;
    },
    signOut: async () => {
      await clerkAuth.signOut();
    },
  };
}

/**
 * Platform-aware replacement for useUser
 */
export function usePlatformUser(): PlatformUserState {
  const clerkUser = useClerkUser();
  const nativeAuth = useNativeAuth();
  const isNative = isNativePlatform();

  if (isNative) {
    return {
      isLoaded: nativeAuth.isLoaded,
      user: nativeAuth.isSignedIn
        ? {
            id: nativeAuth.userId,
            primaryEmailAddress: {
              emailAddress: nativeAuth.userEmail,
            },
            firstName: null, // Not stored in native auth currently
            lastName: null,
          }
        : null,
    };
  }

  // Web - use Clerk SDK
  return {
    isLoaded: clerkUser.isLoaded,
    user: clerkUser.user
      ? {
          id: clerkUser.user.id,
          primaryEmailAddress: clerkUser.user.primaryEmailAddress
            ? {
                emailAddress: clerkUser.user.primaryEmailAddress.emailAddress,
              }
            : null,
          firstName: clerkUser.user.firstName,
          lastName: clerkUser.user.lastName,
        }
      : null,
  };
}
