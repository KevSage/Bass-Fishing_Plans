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

export function useMemberStatus() {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState<MemberStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/members/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
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
