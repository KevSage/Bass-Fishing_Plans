import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  useUser,
  useClerk,
  useAuth,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import { createPortal } from "react-dom";
import { MapOrb } from "./MapOrb";

// Define API Base for status check
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const location = useLocation();
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded } = useAuth(); // Add isLoaded
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // --- CONTEXTUAL ORB LOGIC ---
  const isPlanPage = location.pathname.startsWith("/plan");
  const isMapPage = location.pathname === "/members";

  // LOGIC UPDATE: Show "White Insights Orb" on both Map AND Plan pages
  const showInsightsOrb = isMapPage || isPlanPage;

  const orbDestination = showInsightsOrb ? "/insights" : "/members";
  const orbTitle = showInsightsOrb ? "View Insights" : "Launch Map";

  // Use 'white' for Insights (Map/Plan), 'default' (Blue) for elsewhere
  const orbVariant = showInsightsOrb ? "white" : "default";

  // Scroll Listener for Glass Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check Pro Status on Mount
  useEffect(() => {
    if (isSignedIn) {
      const checkStatus = async () => {
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/members/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setIsPro(data.is_member);
          }
        } catch (e) {
          console.error("Nav status check failed", e);
        }
      };
      checkStatus();
    } else {
      setIsPro(false);
    }
  }, [isSignedIn, getToken]);

  const publicLinks = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/faq", label: "FAQ" },
    ],
    [],
  );

  const memberLinks = useMemo(() => [{ to: "/account", label: "Account" }], []);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setIsOpen(false);
    setIsPro(false);
    navigate("/");
  };

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // --- MOBILE MENU OVERLAY ---
  const mobileOverlay = isOpen ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(6px)",
        zIndex: 10000,
        // Account for iOS safe area + header height (68px base)
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 68px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          background: "#0a0a0a",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "20px 24px 32px",
          paddingLeft: "max(24px, env(safe-area-inset-left, 24px))",
          paddingRight: "max(24px, env(safe-area-inset-right, 24px))",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              style={{
                textDecoration: "none",
                color: isActive(link.to) ? "#fff" : "rgba(255, 255, 255, 0.5)",
                fontSize: "0.95rem",
                fontWeight: isActive(link.to) ? 500 : 400,
                letterSpacing: "0.02em",
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "color 0.2s",
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
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none",
                  color: isActive(link.to)
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.95rem",
                  fontWeight: isActive(link.to) ? 500 : 400,
                  letterSpacing: "0.02em",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {link.label}
              </Link>
            ))}

            <div style={{ height: 24 }} />

            {/* Mobile Menu Action Button */}
            <Link
              to={orbDestination}
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textDecoration: "none",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                padding: "12px",
                borderRadius: 8,
                background: showInsightsOrb
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(59, 130, 246, 0.1)",
                border: showInsightsOrb
                  ? "1px solid rgba(255, 255, 255, 0.15)"
                  : "1px solid rgba(59, 130, 246, 0.25)",
              }}
            >
              <MapOrb size={18} active={true} variant={orbVariant} />
              <span>{orbTitle}</span>
            </Link>

            <button
              onClick={handleSignOut}
              style={{
                width: "100%",
                textAlign: "center",
                padding: "14px",
                marginTop: 8,
                background: "transparent",
                border: "none",
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Sign Out
            </button>
          </SignedIn>

          <SignedOut>
            <div style={{ height: 20 }} />
            <Link
              to="/sign-up"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px",
                borderRadius: 100,
                textDecoration: "none",
                background: "#fff",
                color: "#000",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Sign Up
            </Link>
            <Link
              to="/sign-in"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px",
                marginTop: 12,
                borderRadius: 100,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Sign In
            </Link>
          </SignedOut>
        </nav>
      </div>
    </div>
  ) : null;

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 9999,
          background: scrolled
            ? "rgba(10, 10, 10, 0.85)"
            : "rgba(10, 10, 10, 0.5)",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid transparent",
          transition: "all 0.3s ease",
          // iOS safe area for notch
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            paddingLeft: "max(24px, env(safe-area-inset-left, 24px))",
            paddingRight: "max(24px, env(safe-area-inset-right, 24px))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            Bass Clarity
            {isPro && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                >
                  PRO
                </span>
              </div>
            )}
          </Link>

          {/* DESKTOP NAV */}
          <nav
            className="desktop-nav"
            style={{ display: "none", gap: 32, alignItems: "center" }}
          >
            {publicLinks.slice(1).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: "none",
                  color: isActive(link.to)
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.9rem",
                  fontWeight: isActive(link.to) ? 600 : 500,
                  letterSpacing: "0.01em",
                  transition: "color 0.2s",
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
                      : "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.9rem",
                    fontWeight: isActive(link.to) ? 600 : 500,
                    letterSpacing: "0.01em",
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                to={orbDestination}
                title={orbTitle}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                <MapOrb size={30} active={true} variant={orbVariant} />
              </Link>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {user?.firstName?.charAt(0) || "U"}
                </button>
                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "130%",
                      right: 0,
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      padding: 6,
                      minWidth: 140,
                      boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                    }}
                  >
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: "100%",
                        padding: "10px",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </SignedIn>

            {/* Show auth buttons if not loaded OR if signed out */}
            {(!isLoaded || !isSignedIn) && (
              <>
                <Link
                  to="/sign-in"
                  style={{
                    textDecoration: "none",
                    color: "#fff",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  style={{
                    textDecoration: "none",
                    background: "#fff",
                    color: "#000",
                    padding: "8px 18px",
                    borderRadius: 100,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* MOBILE CONTROLS */}
          <div
            className="mobile-controls"
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            {/* Show Sign In button if not loaded OR if signed out */}
            {(!isLoaded || !isSignedIn) && (
              <Link
                to="/sign-in"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  padding: "6px 14px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 100,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Sign In
              </Link>
            )}

            <SignedIn>
              <Link
                to={orbDestination}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                <MapOrb size={30} active={true} variant={orbVariant} />
              </Link>
            </SignedIn>

            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Menu"
            >
              {isOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M3 12h18M3 6h18M3 18h18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOverlay ? createPortal(mobileOverlay, document.body) : null}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          .mobile-controls { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}
