// src/components/Navigation.tsx
// Mobile-first navigation with hamburger menu + Clerk
// Fixes overlay layering issues by rendering the mobile menu via a portal.

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser, useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { createPortal } from "react-dom";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Public links (shown to everyone)
  // NOTE: removed /preview in favor of subscribe/trial.
  const publicLinks = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/weather", label: "Weather" },
      { to: "/what-your-plan-includes", label: "What You Get" },
      { to: "/how-to-use", label: "How to Use" },
      { to: "/about", label: "About" },
      { to: "/faq", label: "FAQ" },
    ],
    []
  );

  // Member links (shown only when signed in)
  const memberLinks = useMemo(
    () => [
      { to: "/members", label: "Members" },
      { to: "/account", label: "Account" },
    ],
    []
  );

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setIsOpen(false);
    navigate("/");
  };

  // Close menus on route change (prevents stuck overlays)
  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const mobileOverlay = isOpen ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 10, 10, 0.98)",
        backdropFilter: "blur(12px)",
        zIndex: 10000, // IMPORTANT: above mapbox + members header layers
        padding: "78px 20px 24px", // space for sticky header height
        overflowY: "auto",
      }}
      onClick={() => setIsOpen(false)}
      aria-label="Mobile navigation overlay"
    >
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 720,
          margin: "0 auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Primary nav */}
        {publicLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setIsOpen(false)}
            style={{
              textDecoration: "none",
              color: isActive(link.to) ? "#fff" : "rgba(255, 255, 255, 0.78)",
              fontSize: "1.05rem",
              fontWeight: isActive(link.to) ? 700 : 500,
              padding: "14px 14px",
              borderRadius: 12,
              background: isActive(link.to)
                ? "rgba(255,255,255,0.06)"
                : "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {link.label}
          </Link>
        ))}

        {/* Member-only link */}
        <div style={{ height: 10 }} />
        {memberLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setIsOpen(false)}
            style={{
              textDecoration: "none",
              color: isActive(link.to) ? "#fff" : "rgba(255, 255, 255, 0.78)",
              fontSize: "1.05rem",
              fontWeight: isActive(link.to) ? 700 : 500,
              padding: "14px 14px",
              borderRadius: 12,
              background: isActive(link.to)
                ? "rgba(255,255,255,0.06)"
                : "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {link.label}
          </Link>
        ))}

        {/* Signed out CTA */}
        <SignedOut>
          <div style={{ height: 14 }} />
          <Link
            to="/subscribe"
            onClick={() => setIsOpen(false)}
            className="btn primary"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              padding: "14px 18px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Start Free Trial
          </Link>

          <Link
            to="/sign-in"
            onClick={() => setIsOpen(false)}
            style={{
              textDecoration: "none",
              color: "rgba(255, 255, 255, 0.78)",
              fontSize: "1rem",
              fontWeight: 500,
              padding: "14px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}
          >
            Sign In
          </Link>
        </SignedOut>
      </nav>
    </div>
  ) : null;

  return (
    <>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 11000, // Above overlay padding area; overlay itself is 10000 full-screen
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
            gap: 14,
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                opacity: 0.95,
                whiteSpace: "nowrap",
              }}
            >
              Bass Clarity
            </div>
          </Link>

          {/* Desktop Nav */}
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

            <SignedIn>
              {memberLinks.map((link) => (
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
                    fontWeight: 600,
                  }}
                  aria-label="Open account menu"
                >
                  {user?.firstName?.charAt(0) ||
                    user?.emailAddresses[0]?.emailAddress
                      ?.charAt(0)
                      .toUpperCase() ||
                    "U"}
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 8,
                      background: "rgba(20, 20, 20, 0.98)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 10,
                      minWidth: 220,
                      padding: 8,
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.95em" }}>
                        {user?.fullName || "Account"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85em",
                          color: "rgba(255, 255, 255, 0.6)",
                          marginTop: 4,
                        }}
                      >
                        {user?.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>

                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        textDecoration: "none",
                        color: "rgba(255, 255, 255, 0.9)",
                        borderRadius: 8,
                        fontSize: "0.95em",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.06)")
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
                        borderRadius: 8,
                        fontSize: "0.95em",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239, 68, 68, 0.12)")
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

            <SignedOut>
              <Link
                to="/subscribe"
                className="btn primary"
                style={{ padding: "8px 20px", textDecoration: "none" }}
              >
                Start Free Trial
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
            </SignedOut>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen((v) => !v)}
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

      {/* Mobile overlay rendered at document.body to avoid Mapbox/Safari z-index/compositor issues */}
      {mobileOverlay ? createPortal(mobileOverlay, document.body) : null}
    </>
  );
}
