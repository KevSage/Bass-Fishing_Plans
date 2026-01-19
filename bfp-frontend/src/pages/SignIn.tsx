import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  // Define the destination dynamically
  // This produces "http://localhost:5173/members" or "https://bassclarity.com/members"
  const destination = `${window.location.origin}/members`;
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={destination}
        appearance={{
          elements: {
            rootBox: {
              width: "100%",
              maxWidth: "420px",
            },
            card: {
              background: "rgba(255, 255, 255, 0.98)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            },
          },
        }}
      />
    </div>
  );
}
