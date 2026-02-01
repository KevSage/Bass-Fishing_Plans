import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function SignInPage() {
  const navigate = useNavigate();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/members");
      } else {
        console.log("Sign in status:", result.status);
        setError("Sign in incomplete. Please check your email.");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-header">
        <button onClick={() => navigate("/")} className="auth-back-btn">
          <span>← Back</span>
        </button>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">Welcome back to Bass Clarity</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/sign-up")}
                className="auth-link-btn"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page-container {
          background-image: url('/images/hero_bass.jpeg');
          min-height: 100vh;
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 80px;
          position: relative;
        }
        
        .auth-header {
          position: absolute;
          top: 40px;
          left: 20px;
          z-index: 10;
        }
        
        .auth-back-btn {
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          backdrop-filter: blur(10px);
        }
        
        .auth-back-btn:hover {
          background: rgba(0, 0, 0, 0.7);
        }
        
        .auth-content {
          width: 100%;
          max-width: 420px;
          padding: 0 20px;
        }
        
        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .auth-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 8px 0;
          text-align: center;
        }
        
        .auth-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0 0 32px 0;
          text-align: center;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .form-group input {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
          background: white;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
        
        .error-message {
          background: #fee;
          color: #c00;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid #fcc;
        }
        
        .auth-submit-btn {
          padding: 14px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 8px;
        }
        
        .auth-submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        
        .auth-submit-btn:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }
        
        .auth-footer {
          margin-top: 24px;
          text-align: center;
        }
        
        .auth-footer p {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .auth-link-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: 14px;
        }
        
        .auth-link-btn:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px;
          }
          
          .auth-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
