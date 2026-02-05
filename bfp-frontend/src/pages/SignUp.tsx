import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { BackIcon } from "@/components/UnifiedIcons";

export default function SignUpPage() {
  return (
    <section
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Background Layers */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 20%, rgba(74, 144, 226, 0.08) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/hero_bass.png)",
          backgroundSize: "cover",
          backgroundPosition: "65% 45%",
          opacity: 1,
          filter: "brightness(0.85)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)",
          zIndex: 1,
        }}
      />

      {/* Back Button */}
      <div
        style={{
          position: "absolute",
          top: "max(20px, env(safe-area-inset-top))",
          left: 24,
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            color: "rgba(255,255,255,0.8)",
            textDecoration: "none",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.9rem",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            padding: "8px 16px",
            borderRadius: 100,
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.2s",
          }}
        >
          <BackIcon size={18} />
          <span>Back</span>
        </Link>
      </div>

      {/* Clerk SignUp Component */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/members"
          appearance={{
            elements: {
              rootBox: {
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
              },
              card: {
                background: "rgba(20, 20, 25, 0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
              },
              headerTitle: {
                color: "#ffffff",
              },
              headerSubtitle: {
                color: "rgba(255,255,255,0.6)",
              },
              formFieldLabel: {
                color: "rgba(255,255,255,0.7)",
              },
              formFieldInput: {
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
              },
              formButtonPrimary: {
                background: "#4A90E2",
              },
              footerActionLink: {
                color: "#4A90E2",
              },
              identityPreviewText: {
                color: "rgba(255,255,255,0.8)",
              },
              identityPreviewEditButton: {
                color: "#4A90E2",
              },
              formFieldInputShowPasswordButton: {
                color: "rgba(255,255,255,0.5)",
              },
            },
          }}
        />
      </div>
    </section>
  );
}
