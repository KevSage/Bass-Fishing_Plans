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
  const { getToken, isSignedIn } = useAuth();
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
        paddingTop: 68,
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
                // Updated Logic: Use 'showInsightsOrb' to style white/glass
                background: showInsightsOrb
                  ? "rgba(255, 255, 255, 0.05)" // Dim white tint
                  : "rgba(59, 130, 246, 0.1)", // Blue tint
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
              to="/subscribe"
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
              Start Free Trial
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
                fontWeight: 500,
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
          zIndex: 1000,
          width: "100%",
          height: 64,
          transition: "all 0.3s ease",
          background: scrolled || isOpen ? "rgba(5, 5, 5, 0.9)" : "transparent",
          backdropFilter: scrolled || isOpen ? "blur(16px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255, 255, 255, 0.06)"
            : "1px solid transparent",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
            paddingLeft: "max(24px, env(safe-area-inset-left))",
            paddingRight: "max(24px, env(safe-area-inset-right))",
          }}
        >
          {/* LOGO SECTION */}
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "inherit",
              zIndex: 10001,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                color: "#fff",
                textTransform: "uppercase",
              }}
            >
              Bass Clarity
            </div>

            {/* --- PRO BADGE --- */}
            {isPro && (
              <div
                style={{
                  marginLeft: 6,
                  padding: "2px 2px",
                  borderRadius: 4,
                  background: "rgba(74, 144, 226, 0.15)",
                  border: "1px solid rgba(74, 144, 226, 0.3)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#4A90E2",
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

            <SignedOut>
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
                to="/subscribe"
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
                Start Free Trial
              </Link>
            </SignedOut>
          </nav>

          {/* MOBILE CONTROLS */}
          <div
            className="mobile-controls"
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <SignedOut>
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
            </SignedOut>

            <SignedIn>
              {/* UPDATED: Removed the !isPlanPage check so orb appears on plan page too */}
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
