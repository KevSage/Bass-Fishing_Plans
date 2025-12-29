import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
        {/* 404 Graphic */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: "clamp(6rem, 15vw, 10rem)",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.05)",
              margin: 0,
            }}
          >
            404
          </h1>
        </div>

        {/* Message */}
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            fontSize: "1.25rem",
            opacity: 0.7,
            marginBottom: 48,
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation Options */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
            borderRadius: 16,
            padding: 40,
            marginBottom: 40,
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: 24,
              color: "#4A90E2",
            }}
          >
            Try one of these:
          </h3>
          <div style={{ display: "grid", gap: 16 }}>
            {[
              {
                to: "/",
                title: "Home",
                desc: "Back to the main page",
              },
              {
                to: "/preview",
                title: "Get a Plan",
                desc: "Try a free sample plan",
              },
              {
                to: "/members",
                title: "Members",
                desc: "Generate your fishing plan",
              },
              {
                to: "/how-to-use",
                title: "How to Use",
                desc: "Learn about the platform",
              },
            ].map((link, i) => (
              <Link
                key={i}
                to={link.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  textDecoration: "none",
                  color: "inherit",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(74, 144, 226, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(74, 144, 226, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.08)";
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {link.title}
                  </div>
                  <div style={{ fontSize: "0.95rem", opacity: 0.6 }}>
                    {link.desc}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ opacity: 0.4, flexShrink: 0 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Search/Help */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: "0.95rem", opacity: 0.5, marginBottom: 16 }}>
            Still can't find what you're looking for?
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/faq"
              style={{
                color: "#4A90E2",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              View FAQ
            </Link>
            <span style={{ opacity: 0.3 }}>•</span>
            <a
              href="mailto:support@bassclarity.com"
              style={{
                color: "#4A90E2",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
