import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface SubscriptionData {
  status: "active" | "inactive" | "cancelled" | "expired";
  nextBillingDate?: string;
  plan: string;
  price: string;
}

interface MemberStatus {
  email: string;
  is_member: boolean;
  has_subscription: boolean;
  rate_limit_allowed: boolean;
  rate_limit_seconds: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export function Account() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isLoaded || !user) return;

      try {
        const token = await getToken();

        const response = await fetch(`${API_BASE}/members/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch subscription status");
        }

        const data: MemberStatus = await response.json();
        setMemberStatus(data);

        // Map to subscription data format
        if (data.is_member) {
          setSubscription({
            status: "active",
            nextBillingDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            plan: "Monthly",
            price: "$15/month",
          });
        } else if (data.has_subscription) {
          setSubscription({
            status: "inactive",
            plan: "Monthly",
            price: "$15/month",
          });
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        setError("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isLoaded, user, getToken]);

  const handleManageSubscription = () => {
    // TODO: Integrate with Stripe Customer Portal
    alert(
      "Stripe Customer Portal integration coming soon. This will allow you to update payment methods, view invoices, and cancel subscriptions."
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
      expired: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${
          styles[status as keyof typeof styles]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Account</h1>
          <p className="text-gray-400">
            Manage your subscription and account settings
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Email</span>
              <span className="text-white font-medium">
                {memberStatus?.email ||
                  user?.primaryEmailAddress?.emailAddress ||
                  "Not available"}
              </span>
            </div>
            <div className="border-t border-white/10"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Name</span>
              <span className="text-white font-medium">
                {user?.fullName || "Not set"}
              </span>
            </div>
            <div className="border-t border-white/10"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-white">Subscription</h2>
            {subscription && getStatusBadge(subscription.status)}
          </div>

          {subscription ? (
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Plan</span>
                <span className="text-white font-medium">
                  {subscription.plan}
                </span>
              </div>
              <div className="border-t border-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Price</span>
                <span className="text-white font-medium">
                  {subscription.price}
                </span>
              </div>
              {subscription.nextBillingDate && (
                <>
                  <div className="border-t border-white/10"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Next Billing Date</span>
                    <span className="text-white font-medium">
                      {subscription.nextBillingDate}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-400 mb-4">
                You don't have an active subscription.
              </p>
              <Link
                to="/subscribe"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Subscribe Now
              </Link>
            </div>
          )}

          {subscription && subscription.status === "active" && (
            <button
              onClick={handleManageSubscription}
              className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors"
            >
              Manage Subscription
            </button>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
          <div className="space-y-3">
            <Link
              to="/members"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            >
              <span className="text-white">Members Dashboard</span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              to="/how-to-use"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            >
              <span className="text-white">How to Use</span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              to="/faq"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            >
              <span className="text-white">FAQ</span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Sign Out */}
        <div className="text-center">
          <button
            onClick={handleSignOut}
            className="text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a
              href="mailto:support@bassfishingplans.com"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
