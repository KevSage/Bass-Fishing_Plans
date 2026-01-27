// src/hooks/useMemberStatus.ts

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

export interface MemberStatus {
  email: string;
  is_member: boolean;
  has_subscription: boolean;
  rate_limit_allowed: boolean;
  rate_limit_seconds: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

// 1. GLOBAL CACHE (Exists outside the hook)
// This persists as long as the browser tab is open
let globalCache: MemberStatus | null = null;

export function useMemberStatus() {
  const { getToken, isSignedIn } = useAuth();

  // 2. Initialize State with Cache (Instant Load)
  const [status, setStatus] = useState<MemberStatus | null>(globalCache);

  // 3. Smart Loading State:
  // Only show "loading" if we are signed in AND have no cached data.
  // If we have cache, we load instantly (loading = false).
  const [loading, setLoading] = useState(!globalCache && !!isSignedIn);

  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!isSignedIn) {
      setLoading(false);
      globalCache = null; // Clear cache on logout
      setStatus(null);
      return;
    }

    try {
      // Only block UI if we have no data
      if (!globalCache) setLoading(true);
      setError(null);

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

      const data = await response.json();

      // 4. Update Cache & State
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
  }, [isSignedIn]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    isActive: status?.is_member && status?.has_subscription,
    isLoading: loading,
  };
}
