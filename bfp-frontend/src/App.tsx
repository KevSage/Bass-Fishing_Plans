import React from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut } from "./components/PlatformAuth";
import { isNativePlatform, configureStatusBar } from "./lib/platform";
import { usePlatformAuth } from "./hooks/usePlatformAuth";
import { useMemberStatus } from "./hooks/useMemberStatus";
import { Navigation } from "./components/Navigation";
import { Landing } from "./pages/Landing";
import { About } from "./pages/About";
import { Subscribe } from "./pages/Subscribe";
// import { PreviewEnhanced } from "./pages/Preview";
import { Members } from "./pages/Members";
import { Insights } from "./pages/Insights";
import { Journey } from "./pages/Journey";
// import { HowToUse } from "./pages/HowToUse";
import { FAQ } from "./pages/FAQ";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import { Admin } from "./pages/Admin";
// import { WhatsIncluded } from "./pages/Features";
import { Success } from "./pages/Success";
import { Account } from "./pages/Account";
import { NotFound } from "./pages/NotFound";
import { VerifyEmail } from "./pages/VerifyEmail";
import "./complete-styles.css";
import { LakeBuilder } from "./pages/LakeBuilder";
import { LureLibrary } from "./pages/LureLibrary";
import { Upgrade } from "./pages/Upgrade";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicy";
import { Terms } from "./pages/Terms";
import { SupportPage } from "./pages/Support";
import { RefundPolicyPage } from "./pages/RefundPolicy";

/**
 * Root route handler - redirects to sign-in on native platforms
 */
function RootRoute() {
  const { isSignedIn, isLoaded } = usePlatformAuth();
  const [timedOut, setTimedOut] = React.useState(false);

  // Timeout for Clerk loading on native (Clerk often fails in WebView)
  React.useEffect(() => {
    if (isNativePlatform() && !isLoaded) {
      const timer = setTimeout(() => {
        console.log("Clerk load timeout - redirecting to sign-in");
        setTimedOut(true);
      }, 3000); // 3 second timeout
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // On native platforms, skip landing and go to sign-in or members
  if (isNativePlatform()) {
    // If Clerk loaded successfully, check auth status
    if (isLoaded) {
      if (isSignedIn) {
        return <Navigate to="/members" replace />;
      }
      return <Navigate to="/sign-in" replace />;
    }
    // If timed out waiting for Clerk, go to sign-in anyway
    if (timedOut) {
      return <Navigate to="/sign-in" replace />;
    }
    // Still waiting for Clerk to load
    return null;
  }

  // On web, show the landing page
  return <Landing />;
}
import { PlanPage } from "./pages/PlanPage";
import { ScrollToTop } from "./components/ScrollToTop";

function TopBar() {
  return (
    <div style={{ borderBottom: "1px solid rgba(238,242,246,0.10)" }}>
      <div
        className="container"
        style={{
          paddingTop: 14,
          paddingBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", fontWeight: 600 }}>
          BFP
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            to="/about"
            style={{ textDecoration: "none" }}
            className="muted"
          >
            About
          </Link>
          <Link
            to="/members"
            style={{ textDecoration: "none" }}
            className="muted"
          >
            Members
          </Link>
          <Link to="/subscribe" className="btn">
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Refresh entitlement status on app launch (ensures Pro stays correct across reinstalls/renewals)
  const { refetch } = useMemberStatus();
  React.useEffect(() => {
    refetch();
  }, []);

  // Configure status bar on native platforms (light text for dark background)
  React.useEffect(() => {
    configureStatusBar();
  }, []);

  return (
    <>
      <Navigation />
      <ScrollToTop />
      {/* Main content area - padding for fixed nav. Members ignores this (position:fixed) */}
      <main style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)" }}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/about" element={<About />} />
        <Route path="/subscribe" element={<Subscribe />} />
        {/* <Route path="/preview" element={<PreviewEnhanced />} /> */}
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up/" element={<SignUpPage />} />
        <Route path="/sign-up/verify-email-address" element={<VerifyEmail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/journey" element={<Journey />} />

        <Route path="/lake-builder" element={<LakeBuilder />} />
        <Route path="/lure-library" element={<LureLibrary />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route
          path="/members"
          element={
            <>
              <SignedIn>
                <Members />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/what-your-plan-includes"
          // element={<WhatYourPlanIncludes />}
        />
        {/* <Route path="/how-to-use" element={<HowToUse />} /> */}
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/success" element={<Success />} />
        <Route
          path="/account"
          element={
            <>
              <SignedIn>
                <Account />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          }
        />
        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </main>
    </>
  );
}
