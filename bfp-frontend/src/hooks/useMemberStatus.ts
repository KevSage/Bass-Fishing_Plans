// src/hooks/useMemberStatus.ts

import { useEffect, useState } from "react";
import { usePlatformAuth } from "./usePlatformAuth";
import { isNativePlatform, getApiBaseUrl } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";

export interface MemberStatus {
  email: string;
  is_member: boolean;
  has_subscription: boolean;
  rate_limit_allowed: boolean;
  rate_limit_seconds: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plans_generated?: number; // Free tier: 5 plan limit
}

// 1. GLOBAL CACHE (Exists outside the hook)
// This persists as long as the browser tab is open
let globalCache: MemberStatus | null = null;

export function useMemberStatus() {
  const { getToken, isSignedIn } = usePlatformAuth();
  const nativeAuth = useNativeAuth();

  // 2. Initialize State with Cache (Instant Load)
  const [status, setStatus] = useState<MemberStatus | null>(() => globalCache);

  // 3. Smart Loading State
  const [loading, setLoading] = useState(() => {
    const signedIn = isNativePlatform() ? nativeAuth.isSignedIn : isSignedIn;
    return !globalCache && !!signedIn;
  });

  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    const signedIn = isNativePlatform() ? nativeAuth.isSignedIn : isSignedIn;

    if (!signedIn) {
      setLoading(false);
      globalCache = null; // Clear cache on logout
      setStatus(null);
      return;
    }

    try {
      // Only block UI if we have no data
      if (!globalCache) setLoading(true);
      setError(null);

      let data: MemberStatus;

      if (isNativePlatform()) {
        // Native: Use mobile-auth endpoint with email/user_id
        if (!nativeAuth.userEmail || !nativeAuth.userId) {
          throw new Error("Missing native auth credentials");
        }

        const response = await fetch(
          `${getApiBaseUrl()}/mobile-auth/status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: nativeAuth.userEmail,
              user_id: nativeAuth.userId,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        data = await response.json();
      } else {
        // Web: Use Clerk JWT
        const token = await getToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/members/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        data = await response.json();
      }

      // Update Cache & State
      globalCache = data;
      setStatus(data);
    } catch (err) {
      console.error("Member status check failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [isSignedIn, nativeAuth.isSignedIn]);

  const plansGenerated = status?.plans_generated ?? 0;
  const FREE_PLAN_LIMIT = 5;
  const plansRemaining = Math.max(0, FREE_PLAN_LIMIT - plansGenerated);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    isActive: status?.is_member && status?.has_subscription,
    isLoading: loading,
    plansGenerated,
    plansRemaining,
    FREE_PLAN_LIMIT,
  };
}
