/**
 * Platform-aware authentication components
 * Replaces Clerk's SignedIn/SignedOut components to work on both web and native
 */
import React from "react";
import { SignedIn as ClerkSignedIn, SignedOut as ClerkSignedOut } from "@clerk/clerk-react";
import { isNativePlatform } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";

interface AuthComponentProps {
  children: React.ReactNode;
}

/**
 * Shows children only when user is signed in
 * Works on both web (via Clerk SDK) and native (via direct API)
 */
export function SignedIn({ children }: AuthComponentProps) {
  const nativeAuth = useNativeAuth();
  const isNative = isNativePlatform();

  if (isNative) {
    // On native, use our auth context
    if (!nativeAuth.isLoaded) {
      return null; // Still loading
    }
    return nativeAuth.isSignedIn ? <>{children}</> : null;
  }

  // On web, use Clerk's component
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

/**
 * Shows children only when user is signed out
 * Works on both web (via Clerk SDK) and native (via direct API)
 */
export function SignedOut({ children }: AuthComponentProps) {
  const nativeAuth = useNativeAuth();
  const isNative = isNativePlatform();

  if (isNative) {
    // On native, use our auth context
    if (!nativeAuth.isLoaded) {
      return null; // Still loading
    }
    return !nativeAuth.isSignedIn ? <>{children}</> : null;
  }

  // On web, use Clerk's component
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}
