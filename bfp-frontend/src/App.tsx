import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigation } from "./components/Navigation";
import { Landing } from "./pages/Landing";
import { About } from "./pages/About";
import { Subscribe } from "./pages/Subscribe";
// import { PreviewEnhanced } from "./pages/Preview";
import { Members } from "./pages/Members";
// import { WhatYourPlanIncludes } from "./pages/WhatYourPlanIncludes";
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

import { PlanPage } from "./pages/PlanPage";
import { WeatherClarityPage } from "./pages/WeatherClarity";
import { PresentationClarityPage } from "./pages/PresentationClarity";
import { StrategicClarityPage } from "./pages/StrategicClarity";
import { LocationClarityPage } from "./pages/LocationClarity";
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
  return (
    <>
      <Navigation />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/subscribe" element={<Subscribe />} />
        {/* <Route path="/preview" element={<PreviewEnhanced />} /> */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/sign-up/verify-email-address" element={<VerifyEmail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/location" element={<LocationClarityPage />} />
        <Route path="/weather" element={<WeatherClarityPage />} />
        <Route path="/presentation" element={<PresentationClarityPage />} />
        <Route path="/strategy" element={<StrategicClarityPage />} />

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
    </>
  );
}
