import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocationSearch } from "@/components/LocationSearch";

const ADMIN_PASSWORD = "bass2025"; // TODO: Move to env variable

interface PlanParams {
  email: string;
  waterName: string;
  lat: string;
  lon: string;
  bypassRateLimit: boolean;
}

export function Admin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [params, setParams] = useState<PlanParams>({
    email: "",
    waterName: "",
    lat: "",
    lon: "",
    bypassRateLimit: true,
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSearchSelect = (result: {
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    setParams({
      ...params,
      waterName: result.name,
      lat: result.latitude.toString(),
      lon: result.longitude.toString(),
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Invalid password");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/plan/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(params.bypassRateLimit && {
              "X-Admin-Override": "true",
            }),
          },
          body: JSON.stringify({
            email: params.email,
            location_name: params.waterName,
            latitude: parseFloat(params.lat),
            longitude: parseFloat(params.lon),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to generate plan");
      }

      const data = await response.json();
      setSuccess(true);

      // Navigate to plan page
      if (data.token) {
        navigate(`/plan?token=${data.token}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom, #1a1a2e, #0f0f1e)",
        }}
      >
        <div className="card" style={{ maxWidth: 400, width: "100%" }}>
          <h1 style={{ fontSize: "2em", fontWeight: 700, marginBottom: 24 }}>
            Admin Access
          </h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <div className="label">Password</div>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            {loginError && (
              <div
                style={{
                  color: "#ff6b6b",
                  marginBottom: 16,
                  fontSize: "0.9em",
                }}
              >
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="btn primary"
              style={{ width: "100%" }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(238,242,246,0.10)",
          background: "rgba(10,10,10,0.95)",
        }}
      >
        <div
          className="container"
          style={{
            paddingTop: 20,
            paddingBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5em", fontWeight: 700, margin: 0 }}>
            🔧 Admin Panel
          </h1>
          <button
            onClick={() => setAuthed(false)}
            className="btn"
            style={{ padding: "8px 16px" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ paddingTop: 40, maxWidth: 700 }}>
        <div className="card">
          <h2 style={{ fontSize: "1.8em", fontWeight: 700, marginBottom: 8 }}>
            Manual Plan Generation
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Generate plans for any user with full control over parameters and
            rate limits.
          </p>

          <form onSubmit={handleGenerate}>
            {/* Lake Search */}
            <div style={{ marginBottom: 24 }}>
              <div className="label">Search for a Lake (Optional)</div>
              <LocationSearch
                onSelect={handleSearchSelect}
                placeholder="Lake Lanier, Lake Fork..."
              />
              <div style={{ fontSize: "0.85em", opacity: 0.6, marginTop: 6 }}>
                Or manually enter water name and coordinates below
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <div className="label">Email Address</div>
              <input
                type="email"
                className="input"
                value={params.email}
                onChange={(e) =>
                  setParams({ ...params, email: e.target.value })
                }
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Water Name */}
            <div style={{ marginBottom: 16 }}>
              <div className="label">Water Body Name</div>
              <input
                type="text"
                className="input"
                value={params.waterName}
                onChange={(e) =>
                  setParams({ ...params, waterName: e.target.value })
                }
                placeholder="Lake Lanier"
                required
              />
            </div>

            {/* Coordinates */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <div className="label">Latitude</div>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={params.lat}
                  onChange={(e) =>
                    setParams({ ...params, lat: e.target.value })
                  }
                  placeholder="34.188"
                  required
                />
              </div>
              <div>
                <div className="label">Longitude</div>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={params.lon}
                  onChange={(e) =>
                    setParams({ ...params, lon: e.target.value })
                  }
                  placeholder="-84.073"
                  required
                />
              </div>
            </div>

            {/* Bypass Rate Limit */}
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                background: "rgba(255, 230, 109, 0.1)",
                border: "1px solid rgba(255, 230, 109, 0.3)",
                borderRadius: 8,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={params.bypassRateLimit}
                  onChange={(e) =>
                    setParams({ ...params, bypassRateLimit: e.target.checked })
                  }
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Bypass Rate Limits
                  </div>
                  <div style={{ fontSize: "0.9em", opacity: 0.7 }}>
                    Generate plan regardless of user's cooldown status
                  </div>
                </div>
              </label>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: "rgba(255, 107, 107, 0.1)",
                  border: "1px solid rgba(255, 107, 107, 0.3)",
                  borderRadius: 8,
                  color: "#ff6b6b",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: "rgba(78, 205, 196, 0.1)",
                  border: "1px solid rgba(78, 205, 196, 0.3)",
                  borderRadius: 8,
                  color: "#4ecdc4",
                }}
              >
                ✓ Plan generated successfully! Redirecting...
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn primary"
              style={{ width: "100%", padding: "14px" }}
              disabled={generating}
            >
              {generating ? "Generating Plan..." : "Generate Plan"}
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: "1.2em", fontWeight: 600, marginBottom: 16 }}>
            Quick Actions
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            <a
              href="/members"
              className="btn"
              style={{ textDecoration: "none", textAlign: "center" }}
            >
              View Members Dashboard
            </a>
            <a
              href="/preview"
              className="btn"
              style={{ textDecoration: "none", textAlign: "center" }}
            >
              Open Preview Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
