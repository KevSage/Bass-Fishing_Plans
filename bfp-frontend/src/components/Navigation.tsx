import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { MapOrb } from "./MapOrb";
import { SignedIn, SignedOut } from "./PlatformAuth";
import { usePlatformAuth, usePlatformUser } from "@/hooks/usePlatformAuth";
import { isNativePlatform, getApiBaseUrl } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";

// Define API Base for status check
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const location = useLocation();
  const { user } = usePlatformUser();
  const { getToken, isSignedIn, isLoaded, signOut } = usePlatformAuth();
  const nativeAuth = useNativeAuth();
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
    const checkStatus = async () => {
      if (isNativePlatform()) {
        // Native: Check via mobile-auth endpoint
        if (!nativeAuth.isSignedIn || !nativeAuth.userEmail || !nativeAuth.userId) {
          setIsPro(false);
          return;
        }

        try {
          const res = await fetch(`${getApiBaseUrl()}/mobile-auth/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: nativeAuth.userEmail,
              user_id: nativeAuth.userId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setIsPro(data.is_member);
          }
        } catch (e) {
          console.error("Nav status check failed", e);
        }
      } else {
        // Web: Check via Clerk JWT
        if (!isSignedIn) {
          setIsPro(false);
          return;
        }

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
      }
    };

    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, nativeAuth.isSignedIn]);

  const publicLinks = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/faq", label: "FAQ" },
    ],
    [],
  );

  const memberLinks = useMemo(
    () => [
      { to: "/insights", label: "Insights" },
      { to: "/journey", label: "Journey" },
      { to: "/lure-library", label: "Lure Library" },
      { to: "/account", label: "Account" },
    ],
    [],
  );
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
        // Account for iOS safe area + header height (56px)
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)",
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
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          {/* Public links (Home, About, FAQ) - Web only */}
          {!isNativePlatform() && publicLinks.map((link) => (
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
                width: "100%",
                textAlign: "center",
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
                  width: "100%",
                  textAlign: "center",
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

            {/* Upgrade CTA for non-Pro members */}
            {!isPro && (
              <Link
                to="/upgrade"
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "12px",
                  marginTop: 12,
                  borderRadius: 100,
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  boxShadow: "0 4px 12px rgba(74, 144, 226, 0.3)",
                }}
              >
                Upgrade to Pro
              </Link>
            )}

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

          {/* Web only: Show Sign Up/Sign In for signed out users */}
          {!isNativePlatform() && (
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
          )}
        </nav>
      </div>
    </div>
  ) : null;

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "linear-gradient(to bottom, rgba(20, 20, 25, 0.95) 0%, rgba(15, 15, 18, 0.9) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          transition: "all 0.3s ease",
          // iOS safe area for notch
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "12px 24px",
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

          {/* NAV CONTROLS - Orb + Avatar menu (unified for all screen sizes) */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Show Sign In button if not loaded OR if signed out (web only) */}
            {!isNativePlatform() && (!isLoaded || !isSignedIn) && (
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

            {/* Avatar menu button - replaces hamburger for iOS-native feel */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isSignedIn ? "rgba(255,255,255,0.08)" : "transparent",
                border: isSignedIn ? "1px solid rgba(255,255,255,0.15)" : "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Menu"
            >
              {isSignedIn ? (
                user?.firstName?.charAt(0) || nativeAuth.userEmail?.charAt(0).toUpperCase() || "U"
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
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
      `}</style>
    </>
  );
}
