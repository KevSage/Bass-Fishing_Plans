import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";

export function Success() {
  const { user } = useUser();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-12 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-semibold text-white mb-4">
            Welcome to Bass Fishing Plans
          </h1>

          {/* Subhead */}
          <p className="text-xl text-gray-300 mb-8">
            Your subscription is now active.
          </p>

          {/* Details */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8 text-left">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Account</span>
                <span className="text-white font-medium">
                  {email || "Loading..."}
                </span>
              </div>
              <div className="border-t border-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Plan</span>
                <span className="text-white font-medium">
                  $15/month • Unlimited plans
                </span>
              </div>
              <div className="border-t border-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Billing</span>
                <span className="text-white font-medium">
                  Monthly (auto-renews)
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Notice */}
          <p className="text-sm text-gray-400 mb-8">
            A confirmation email with your receipt has been sent to{" "}
            <span className="text-white">{email || "your email"}</span>
          </p>

          {/* Next Steps */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-white mb-3">
              Next Steps
            </h2>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">1.</span>
                <span>Navigate to your Members dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">2.</span>
                <span>Select your lake and fishing date</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">3.</span>
                <span>Generate your first lake-optimized strategy</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/members"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Members Dashboard
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center justify-center px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors"
            >
              View Account
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Questions or need help?{" "}
              <a
                href="mailto:support@bassfishingplans.com"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You can manage your subscription anytime from your{" "}
            <Link
              to="/account"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Account page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
