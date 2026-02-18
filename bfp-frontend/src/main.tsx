import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "mapbox-gl/dist/mapbox-gl.css";
import "./complete-styles.css";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { isNativePlatform } from "./lib/platform";
import { NativeAuthProvider } from "./context/NativeAuthContext";
import { injectDemoCatches } from "./lib/demo-catches";

// Inject demo catches BEFORE React mounts (for App Store screenshots)
injectDemoCatches();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Debug logging for Clerk initialization
console.log("[Main] Starting app...");
console.log("[Main] Platform:", isNativePlatform() ? "native" : "web");
console.log("[Main] Clerk key present:", !!clerkPubKey);
console.log("[Main] Clerk key prefix:", clerkPubKey?.substring(0, 30));

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// Use BrowserRouter for web (real URLs), HashRouter for native (Capacitor)
const Router = isNativePlatform() ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <NativeAuthProvider>
      <Router>
        <App />
      </Router>
    </NativeAuthProvider>
  </ClerkProvider>,
);
