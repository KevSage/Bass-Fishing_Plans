// src/components/Navigation.tsx
// Final Version: "Stealth Luxury" Design
// Features: Minimalist fonts, no blocky backgrounds, functional Map Orb.

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser, useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { createPortal } from "react-dom";
import { MapOrb } from "./MapOrb";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const isPlanPage = location.pathname.startsWith("/plan");

  // Scroll Listener for Glass Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const publicLinks = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/faq", label: "FAQ" },
    ],
    []
  );

  const memberLinks = useMemo(() => [{ to: "/account", label: "Account" }], []);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setIsOpen(false);
    navigate("/");
  };

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // --- MOBILE MENU OVERLAY (Stealth Luxury) ---
  const mobileOverlay = isOpen ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.4)", // Subtle dimmer
        backdropFilter: "blur(6px)",
        zIndex: 10000,
        paddingTop: 68, // Pushes menu below the header
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          background: "#0a0a0a", // Deep solid black
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "20px 24px 32px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Public Links - Sleek Text Only */}
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
                borderBottom: "1px solid rgba(255,255,255,0.04)", // Hairline divider
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

            {/* Mobile Drawer Map Launcher */}
            <Link
              to="/members"
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
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
              }}
            >
              <MapOrb size={18} active={true} />
              <span>Launch Map</span>
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

  // --- MAIN HEADER ---
  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          height: 64, // Sleek height
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
          {/* Logo */}
          <Link
            to="/"
            style={{ textDecoration: "none", color: "inherit", zIndex: 10001 }}
          >
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#fff",
                textTransform: "uppercase",
              }}
            >
              Bass Clarity
            </div>
          </Link>

          {/* Desktop Nav */}
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

              {/* Desktop Orb */}
              <Link
                to="/members"
                title="Map"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                <MapOrb size={30} active={!isActive("/members")} />
              </Link>

              {/* Minimal User Avatar */}
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

          {/* MOBILE CONTROLS (Right Side) */}
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

            {/* Mobile Orb */}
            <SignedIn>
              {!isPlanPage && (
                <Link
                  to="/members"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  <MapOrb size={30} active={!isActive("/members")} />
                </Link>
              )}
            </SignedIn>

            {/* Hamburger */}
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
