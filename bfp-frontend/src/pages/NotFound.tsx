import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Graphic */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white/10">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-semibold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation Options */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Try one of these:
          </h3>
          <div className="grid gap-3">
            <Link
              to="/"
              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-left"
            >
              <div>
                <div className="text-white font-medium">Home</div>
                <div className="text-sm text-gray-400">
                  Back to the main page
                </div>
              </div>
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
              to="/members"
              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-left"
            >
              <div>
                <div className="text-white font-medium">Members</div>
                <div className="text-sm text-gray-400">
                  Generate your fishing plan
                </div>
              </div>
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
              to="/preview"
              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-left"
            >
              <div>
                <div className="text-white font-medium">Preview</div>
                <div className="text-sm text-gray-400">
                  Try a free sample plan
                </div>
              </div>
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
              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-left"
            >
              <div>
                <div className="text-white font-medium">How to Use</div>
                <div className="text-sm text-gray-400">
                  Learn about the platform
                </div>
              </div>
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

        {/* Search/Help */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Still can't find what you're looking for?
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/faq"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              View FAQ
            </Link>
            <span className="text-gray-600">•</span>
            <a
              href="mailto:support@bassfishingplans.com"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
