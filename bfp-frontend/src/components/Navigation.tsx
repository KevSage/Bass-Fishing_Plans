// src/components/Navigation.tsx
// Mobile-first navigation with hamburger menu and auth integration

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser, useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Public links (shown to everyone)
  const publicLinks = [
    { to: "/", label: "Home" },
    { to: "/whats-included", label: "Features" },
    { to: "/what-your-plan-includes", label: "What You Get" },
    { to: "/how-to-use", label: "How to Use" },
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
  ];

  // Member links (shown only when signed in)
  const memberLinks = [{ to: "/members", label: "Members" }];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                letterSpacing: "0.04em", // 👈 important
                textTransform: "uppercase",
                opacity: 0.95,
              }}
            >
              Bass Clarity
            </div>
          </Link>

          {/* Desktop Nav - hidden on mobile */}
          <nav
            style={{
              display: "none",
              gap: 24,
              alignItems: "center",
            }}
            className="desktop-nav"
          >
            {publicLinks.slice(1).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: "none",
                  color: isActive(link.to)
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.95em",
                  fontWeight: isActive(link.to) ? 600 : 400,
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Signed In: Show Members + User Menu */}
            <SignedIn>
              <Link
                to="/members"
                style={{
                  textDecoration: "none",
                  color: isActive("/members")
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.95em",
                  fontWeight: isActive("/members") ? 600 : 400,
                }}
              >
                Members
              </Link>

              {/* User Menu */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "0.9em",
                    fontWeight: 500,
                  }}
                >
                  {user?.firstName?.charAt(0) ||
                    user?.emailAddresses[0]?.emailAddress
                      ?.charAt(0)
                      .toUpperCase() ||
                    "U"}
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 8,
                      background: "rgba(20, 20, 20, 0.98)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 8,
                      minWidth: 200,
                      padding: 8,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    {/* User Info */}
                    <div
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.95em",
                          marginBottom: 4,
                        }}
                      >
                        {user?.fullName || "User"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85em",
                          color: "rgba(255, 255, 255, 0.6)",
                        }}
                      >
                        {user?.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        textDecoration: "none",
                        color: "rgba(255, 255, 255, 0.9)",
                        borderRadius: 4,
                        fontSize: "0.95em",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      Account
                    </Link>

                    <button
                      onClick={handleSignOut}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        borderRadius: 4,
                        fontSize: "0.95em",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239, 68, 68, 0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </SignedIn>

            {/* Signed Out: Show Subscribe + Sign In */}
            <SignedOut>
              <Link
                to="/preview"
                style={{
                  textDecoration: "none",
                  color: isActive("/preview")
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.95em",
                  fontWeight: isActive("/preview") ? 600 : 400,
                }}
              >
                Get a Plan
              </Link>
              <Link
                to="/sign-in"
                style={{
                  textDecoration: "none",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.95em",
                }}
              >
                Sign In
              </Link>
              <Link
                to="/subscribe"
                className="btn primary"
                style={{ padding: "8px 20px" }}
              >
                Subscribe
              </Link>
            </SignedOut>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: 8,
            }}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              // Close icon
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 57, // Below header
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 10, 10, 0.98)",
            backdropFilter: "blur(10px)",
            zIndex: 999,
            padding: "20px",
            overflowY: "auto",
          }}
          onClick={() => setIsOpen(false)}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {publicLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none",
                  color: isActive(link.to)
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.8)",
                  fontSize: "1.1em",
                  fontWeight: isActive(link.to) ? 600 : 400,
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Signed In: Show Members + Account */}
            <SignedIn>
              <Link
                to="/members"
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none",
                  color: isActive("/members")
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.8)",
                  fontSize: "1.1em",
                  fontWeight: isActive("/members") ? 600 : 400,
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                Members
              </Link>
              <Link
                to="/account"
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none",
                  color: isActive("/account")
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.8)",
                  fontSize: "1.1em",
                  fontWeight: isActive("/account") ? 600 : 400,
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                Account
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                style={{
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "1.1em",
                  fontWeight: 400,
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </SignedIn>

            {/* Signed Out: Show Get a Plan, Sign In, Subscribe */}
            <SignedOut>
              <Link
                to="/preview"
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none",
                  color: isActive("/preview")
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.8)",
                  fontSize: "1.1em",
                  fontWeight: isActive("/preview") ? 600 : 400,
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                Get a Plan
              </Link>
              <Link
                to="/sign-in"
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none",
                  color: isActive("/sign-in")
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.8)",
                  fontSize: "1.1em",
                  fontWeight: isActive("/sign-in") ? 600 : 400,
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                Sign In
              </Link>
              <Link
                to="/subscribe"
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  fontSize: "1.1em",
                  fontWeight: 600,
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                Subscribe
              </Link>
            </SignedOut>
          </nav>
        </div>
      )}

      {/* CSS for desktop nav */}
      <style>{`
        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none !important;
          }
          .desktop-nav {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
