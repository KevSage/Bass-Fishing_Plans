// src/pages/Admin.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocationSearch } from "@/components/LocationSearch";

// --- DATA SOURCE ---
// Ensure this file exists at src/data/lakes.json
import existingLakesRaw from "@/data/lakes.json";

// --- CONFIG ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ADMIN_PASSWORD = "bass2025";
const PROXIMITY_ALERT_MILES = 50; // Increased to catch large lakes
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// --- TYPES ---
interface Coordinate {
  lat: number;
  lng: number;
}

// Internal Interface (Includes ID for React keys/logic)
interface InternalLakeEntry {
  id: string; // Temporary internal ID
  name: string;
  city?: string;
  state: string;
  latitude: number;
  longitude: number;
  acres?: number;
  tier: number;
  anchors?: Coordinate[];
  bbox?: [number, number, number, number];

  // Logic flags
  _isUpdate?: boolean;
  distance?: number;
  nameMatch?: boolean;
}

// Final Export Interface (Matches your lakes.json)
interface ExportLakeEntry {
  name: string;
  state: string;
  city?: string;
  latitude: number;
  longitude: number;
  acres?: number;
  tier: number;
  anchors?: Coordinate[];
  bbox?: [number, number, number, number];
}

// --- ICONS ---
const TrashIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const DownloadIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const UndoIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);
const CloseIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const CheckIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const TargetIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

// --- SUBSCRIBER TYPES ---
interface Subscriber {
  email: string;
  active: boolean;
  first_name: string | null;
  last_name: string | null;
  has_stripe: boolean;
  has_apple: boolean;
}

// --- SUBSCRIBER MANAGER COMPONENT ---
function SubscriberManager({ password }: { password: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = search
        ? `${API_BASE}/admin/subscribers?search=${encodeURIComponent(search)}`
        : `${API_BASE}/admin/subscribers`;
      const res = await fetch(url, {
        headers: { "X-Admin-Password": password },
      });
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch (e: any) {
      setError(e.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, [password, search]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleToggle = async (email: string, currentActive: boolean) => {
    setActionLoading(email);
    try {
      const res = await fetch(`${API_BASE}/admin/subscribers/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Password": password,
        },
        body: JSON.stringify({ email, active: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      // Update local state
      setSubscribers((prev) =>
        prev.map((s) => (s.email === email ? { ...s, active: !currentActive } : s))
      );
    } catch (e: any) {
      alert(e.message || "Failed to toggle");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setActionLoading("add");
    try {
      const res = await fetch(`${API_BASE}/admin/subscribers/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Password": password,
        },
        body: JSON.stringify({
          email: newEmail,
          first_name: newFirstName,
          last_name: newLastName,
          active: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to add subscriber");
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setShowAddForm(false);
      fetchSubscribers();
    } catch (e: any) {
      alert(e.message || "Failed to add");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          Subscriber Management
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: showAddForm ? "rgba(255,255,255,0.1)" : "#4A90E2",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showAddForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", color: "#888", fontSize: "0.8rem", marginBottom: 4 }}>
                Email *
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#888", fontSize: "0.8rem", marginBottom: 4 }}>
                First Name
              </label>
              <input
                type="text"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="John"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#888", fontSize: "0.8rem", marginBottom: 4 }}>
                Last Name
              </label>
              <input
                type="text"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="Doe"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={actionLoading === "add"}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: "#22c55e",
              color: "#fff",
              fontWeight: 700,
              cursor: actionLoading === "add" ? "not-allowed" : "pointer",
              opacity: actionLoading === "add" ? 0.6 : 1,
            }}
          >
            {actionLoading === "add" ? "Adding..." : "Add as Paid User"}
          </button>
        </form>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: "1rem",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 10,
            padding: 16,
            color: "#f87171",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", color: "#888", padding: 40 }}>Loading...</div>
      )}

      {/* Subscriber List */}
      {!loading && subscribers.length === 0 && (
        <div style={{ textAlign: "center", color: "#666", padding: 40 }}>
          {search ? "No subscribers match your search" : "No subscribers yet"}
        </div>
      )}

      {!loading && subscribers.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 80px 100px",
              gap: 12,
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              color: "#888",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            <div>Email</div>
            <div>Name</div>
            <div>Source</div>
            <div style={{ textAlign: "center" }}>Status</div>
          </div>

          {/* Rows */}
          {subscribers.map((sub) => (
            <div
              key={sub.email}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 80px 100px",
                gap: 12,
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: "#fff", fontSize: "0.9rem", wordBreak: "break-all" }}>
                  {sub.email}
                </div>
              </div>
              <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                {sub.first_name || sub.last_name
                  ? `${sub.first_name || ""} ${sub.last_name || ""}`.trim()
                  : "(unknown)"}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {sub.has_apple && (
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}
                  >
                    Apple
                  </span>
                )}
                {sub.has_stripe && (
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "#818cf8",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}
                  >
                    Stripe
                  </span>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => handleToggle(sub.email, sub.active)}
                  disabled={actionLoading === sub.email}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    background: sub.active
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(239, 68, 68, 0.15)",
                    color: sub.active ? "#4ade80" : "#f87171",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: actionLoading === sub.email ? "not-allowed" : "pointer",
                    opacity: actionLoading === sub.email ? 0.5 : 1,
                    minWidth: 70,
                  }}
                >
                  {actionLoading === sub.email
                    ? "..."
                    : sub.active
                    ? "Active"
                    : "Inactive"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, color: "#666", fontSize: "0.8rem", textAlign: "center" }}>
        Click status to toggle. Users must sign in first to appear here (or add manually).
      </div>
    </div>
  );
}

// --- GEOMETRY HELPERS ---

function generateTempId() {
  return "temp_" + Math.random().toString(36).substr(2, 9);
}

function getDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCentroid(coords: Coordinate[]): Coordinate {
  if (coords.length === 0) return { lat: 0, lng: 0 };
  let latSum = 0;
  let lngSum = 0;
  coords.forEach((p) => {
    latSum += p.lat;
    lngSum += p.lng;
  });
  return { lat: latSum / coords.length, lng: lngSum / coords.length };
}

function getBBox(coords: Coordinate[]): [number, number, number, number] {
  if (coords.length === 0) return [0, 0, 0, 0];
  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;
  coords.forEach((p) => {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });
  return [minLng, minLat, maxLng, maxLat];
}

function calculateAcres(coords: Coordinate[]): number {
  if (coords.length < 3) return 0;
  const R = 6378137;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i];
    const p2 = coords[j];
    area +=
      ((p2.lng * Math.PI) / 180 - (p1.lng * Math.PI) / 180) *
      (2 +
        Math.sin((p1.lat * Math.PI) / 180) +
        Math.sin((p2.lat * Math.PI) / 180));
  }
  area = (Math.abs(area) * R * R) / 2.0;
  return Math.round(area * 0.000247105);
}

const INITIAL_LAKES: InternalLakeEntry[] = (existingLakesRaw as any[]).map(
  (l) => ({
    ...l,
    id: generateTempId(),
    anchors: l.anchors || [],
    bbox: l.bbox || undefined,
  }),
);

// ==========================================
// MAIN COMPONENT
// ==========================================
export function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Invalid password");
    }
  };

  const [activeTab, setActiveTab] = useState<"lakes" | "subscribers">("subscribers");

  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <div
          className="glass-deck"
          style={{
            maxWidth: 400,
            width: "100%",
            padding: 32,
            display: "block",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: 24,
              color: "#fff",
              textAlign: "center",
            }}
          >
            Admin Access
          </h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                className="glass-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                style={{ width: "100%" }}
              />
            </div>
            {loginError && (
              <div
                style={{
                  color: "#ff6b6b",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="generate-btn"
              style={{ width: "100%" }}
            >
              Login
            </button>
          </form>
        </div>
        <StyleBlock />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Tab Navigation */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(10, 10, 10, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveTab("subscribers")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "subscribers" ? "#4A90E2" : "rgba(255,255,255,0.1)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Subscribers
          </button>
          <button
            onClick={() => setActiveTab("lakes")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "lakes" ? "#4A90E2" : "rgba(255,255,255,0.1)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Lakes
          </button>
        </div>
        <button
          onClick={() => setAuthed(false)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div style={{ paddingTop: 60 }}>
        {activeTab === "subscribers" && <SubscriberManager password={password} />}
        {activeTab === "lakes" && <AdminWorkstation onLogout={() => setAuthed(false)} />}
      </div>
      <StyleBlock />
    </div>
  );
}

// ==========================================
// WORKSTATION (The State Machine)
// ==========================================
type Mode = "SEARCH" | "VERIFY" | "DRAW" | "METADATA";

function AdminWorkstation({ onLogout }: { onLogout: () => void }) {
  // --- STATE ---
  const [mode, setMode] = useState<Mode>("SEARCH");

  // Mode Ref (Fixes Stale Closures)
  const modeRef = useRef<Mode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Batch Management
  const [batchQueue, setBatchQueue] = useState<InternalLakeEntry[]>([]);
  const [showBatchDrawer, setShowBatchDrawer] = useState(false);

  // Current "Work in Progress" Lake
  const [currentLake, setCurrentLake] =
    useState<Partial<InternalLakeEntry> | null>(null);
  const [nearbyLakes, setNearbyLakes] = useState<InternalLakeEntry[]>([]);
  const [coordsInput, setCoordsInput] = useState(""); // For manual coordinate entry

  // Drawing State
  const [pins, setPins] = useState<Coordinate[]>([]);
  const [calcAcres, setCalcAcres] = useState(0);

  // Map Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const anchorMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-86.7816, 33.5186],
      zoom: 5,
      attributionControl: false,
    });

    // 1. ADD NAVIGATION + GEOLOCATE CONTROLS
    const nav = new mapboxgl.NavigationControl({ showCompass: false });
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });

    map.current.addControl(nav, "top-right");
    map.current.addControl(geolocate, "top-right");

    map.current.on("click", (e) => {
      const currentMode = modeRef.current;
      if (currentMode === "SEARCH") {
        // Pass 'preserveZoom: true' on map click so we don't jar the user
        startVerification(e.lngLat.lat, e.lngLat.lng, undefined, true);
      } else if (currentMode === "DRAW") {
        setPins((prev) => [...prev, { lat: e.lngLat.lat, lng: e.lngLat.lng }]);
      }
    });
  }, []);

  // --- MAP RENDER LOOP ---
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const render = () => {
      if (!m.getSource("current-draw-source")) {
        m.addSource("current-draw-source", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        m.addLayer({
          id: "current-draw-fill",
          type: "fill",
          source: "current-draw-source",
          paint: { "fill-color": "#4A90E2", "fill-opacity": 0.3 },
        });
        m.addLayer({
          id: "current-draw-line",
          type: "line",
          source: "current-draw-source",
          paint: {
            "line-color": "#4A90E2",
            "line-width": 2,
            "line-dasharray": [2, 1],
          },
        });
      }

      const coords = pins.map((p) => [p.lng, p.lat]);
      if (pins.length >= 3) coords.push(coords[0]);

      (m.getSource("current-draw-source") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: coords.length > 0 ? [coords] : [],
        },
      });

      markersRef.current.forEach((mk) => mk.remove());
      markersRef.current = [];

      pins.forEach((p, idx) => {
        const el = document.createElement("div");
        el.className = "pin-marker";
        el.innerText = (idx + 1).toString();
        el.onclick = (e) => {
          e.stopPropagation();
          if (modeRef.current === "DRAW")
            setPins((prev) => prev.filter((_, i) => i !== idx));
        };
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .addTo(m);
        markersRef.current.push(marker);
      });
    };

    if (m.isStyleLoaded()) render();
    else m.on("load", render);
  }, [pins, mode]);

  // ==========================================
  // LOGIC
  // ==========================================

  const startVerification = async (
    lat: number,
    lng: number,
    manualName?: string,
    preserveZoom = false,
  ) => {
    let city = "",
      state = "";
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
      );
      const data = await res.json();
      const ctx = data.features?.[0]?.context || [];
      city = ctx.find((c: any) => c.id.startsWith("place"))?.text || "";
      state =
        ctx
          .find((c: any) => c.id.startsWith("region"))
          ?.short_code?.replace("US-", "") || "";
    } catch (e) {
      console.error("Geocode failed", e);
    }

    // Check both INITIAL_LAKES and current batch queue for nearby matches
    const allLakes = [
      ...INITIAL_LAKES,
      ...batchQueue.map((b) => ({ ...b, id: b.id })),
    ];

    // FIX: Normalize search name for matching
    const searchNameLower = manualName?.toLowerCase().trim();

    const matches = allLakes
      .map((lake) => {
        const dist = getDistanceMiles(lat, lng, lake.latitude, lake.longitude);
        const nameMatch =
          !!searchNameLower &&
          lake.name.toLowerCase().includes(searchNameLower);
        return {
          ...lake,
          distance: dist,
          nameMatch,
        };
      })
      // FIX: Proximity check expanded + Name match override
      .filter((l) => l.nameMatch || l.distance! < PROXIMITY_ALERT_MILES)
      .sort((a, b) => {
        // Prioritize Name Match, then Distance
        if (a.nameMatch && !b.nameMatch) return -1;
        if (!a.nameMatch && b.nameMatch) return 1;
        return a.distance! - b.distance!;
      });

    setCurrentLake({
      name: manualName || "",
      city,
      state,
      latitude: lat,
      longitude: lng,
    });
    setNearbyLakes(matches);

    if (anchorMarkerRef.current) anchorMarkerRef.current.remove();
    const el = document.createElement("div");
    el.className = "orb-marker-map";
    anchorMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map.current!);

    // Zoom Logic
    if (map.current) {
      const currentZoom = map.current.getZoom();
      const targetZoom = preserveZoom ? Math.max(currentZoom, 14) : 15;
      map.current.flyTo({ center: [lng, lat], zoom: targetZoom });
    }

    if (matches.length > 0) setMode("VERIFY");
    else {
      setCurrentLake((prev) => ({
        ...prev,
        id: generateTempId(),
        _isUpdate: false,
      }));
      setMode("DRAW");
    }
  };

  const handleSearchSelect = (loc: {
    latitude: number;
    longitude: number;
    name: string;
  }) => {
    startVerification(loc.latitude, loc.longitude, loc.name);
  };

  const handleManualCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse input like "33.518, -86.781"
    const parts = coordsInput.split(",").map((s) => s.trim());
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (!isNaN(lat) && !isNaN(lng)) {
      startVerification(lat, lng, "Coordinates");
      setCoordsInput("");
    } else {
      alert("Invalid format. Use: Lat, Lng (e.g., 33.123, -84.123)");
    }
  };

  const handleFinishDraw = () => {
    if (pins.length < 3) return alert("Need at least 3 points.");
    setCalcAcres(calculateAcres(pins));
    setMode("METADATA");
  };

  const handleAddToBatch = () => {
    if (!currentLake) return;

    const safeId = currentLake.id || generateTempId();
    const centroid = getCentroid(pins);

    const finalEntry: InternalLakeEntry = {
      id: safeId,
      name: currentLake.name || "Unnamed Water",
      city: currentLake.city || "",
      state: currentLake.state || "",
      latitude: centroid.lat || Number(currentLake.latitude),
      longitude: centroid.lng || Number(currentLake.longitude),
      acres: Number(calcAcres),
      tier: Number(currentLake.tier || 3),
      anchors: pins,
      bbox: getBBox(pins),
      _isUpdate: currentLake._isUpdate,
    };

    setBatchQueue((prev) => [
      ...prev.filter((i) => i.id !== finalEntry.id),
      finalEntry,
    ]);

    setMode("SEARCH");
    setPins([]);
    setCurrentLake(null);
    setNearbyLakes([]);
    if (anchorMarkerRef.current) anchorMarkerRef.current.remove();
    setShowBatchDrawer(true);
  };

  const handleDownloadJson = () => {
    // 1. STAGE 1: Merge by ID (Handles renames/updates within current session)
    // Keys are random temp_ids assigned at load. This ensures that if I update "Lake A",
    // the original "Lake A" entry is overwritten.
    const idMap = new Map<string, InternalLakeEntry>();
    INITIAL_LAKES.forEach((l) => idMap.set(l.id, l));
    batchQueue.forEach((item) => {
      idMap.set(item.id, item);
    });

    // 2. STAGE 2: Merge by Name+State (Collapses duplicates in the file)
    // This cleans up your file. If "Lake Okeechobee" appears 3 times, they will collide here
    // and only the last one (or the one from batch) will survive.
    const uniqueMap = new Map<string, ExportLakeEntry>();

    Array.from(idMap.values()).forEach((l) => {
      const key = `${l.name.trim().toLowerCase()}|${l.state
        .trim()
        .toLowerCase()}`;

      const entry: ExportLakeEntry = {
        name: l.name,
        state: l.state,
        latitude: l.latitude,
        longitude: l.longitude,
        tier: l.tier,
      };
      if (l.city) entry.city = l.city;
      if (l.acres) entry.acres = l.acres;
      if (l.bbox) entry.bbox = l.bbox;
      if (l.anchors && l.anchors.length > 0) entry.anchors = l.anchors;

      // Overwrite: This effectively deletes duplicates
      uniqueMap.set(key, entry);
    });

    const finalArray = Array.from(uniqueMap.values());

    const dataStr = JSON.stringify(finalArray, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "lakes.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(
      `Cleaned & Exported: Collapsed ${idMap.size} raw entries into ${finalArray.length} unique lakes.`,
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        background: "#0a0a0a",
      }}
    >
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* --- TOP LEFT: BATCH DRAWER TRIGGER --- */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 50 }}>
        <button
          onClick={() => setShowBatchDrawer(!showBatchDrawer)}
          className="glass-btn"
          style={{ padding: "8px 16px", gap: 8 }}
        >
          <span
            style={{
              fontWeight: 700,
              color: batchQueue.length > 0 ? "#4A90E2" : "#fff",
            }}
          >
            Batch ({batchQueue.length})
          </span>
        </button>
      </div>

      {/* --- TOP RIGHT: LOGOUT --- */}
      <div style={{ position: "absolute", top: 20, right: 60, zIndex: 50 }}>
        <button
          onClick={onLogout}
          className="glass-btn"
          style={{ padding: "8px 16px" }}
        >
          Logout
        </button>
      </div>

      {/* --- BATCH DRAWER OVERLAY --- */}
      {showBatchDrawer && (
        <div
          className="glass-panel"
          style={{
            position: "absolute",
            top: 70,
            left: 20,
            width: 300,
            zIndex: 60,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, color: "#fff" }}>Batch Queue</span>
            <button
              onClick={() => setShowBatchDrawer(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <CloseIcon />
            </button>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {batchQueue.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "#666",
                  fontSize: "0.8rem",
                }}
              >
                Queue is empty
              </div>
            )}
            {batchQueue.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#888" }}>
                    {item.city}, {item.state}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setBatchQueue((q) => q.filter((x) => x.id !== item.id))
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: 12,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <button
              onClick={handleDownloadJson}
              disabled={batchQueue.length === 0}
              className="generate-btn"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "0.9rem",
                opacity: batchQueue.length === 0 ? 0.5 : 1,
              }}
            >
              <DownloadIcon /> Download lakes.json
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN BOTTOM DECK --- */}
      <div className="members-navigation-container">
        <div className="glass-deck" style={{ padding: "20px 24px" }}>
          {/* MODE: SEARCH */}
          {mode === "SEARCH" && (
            <div style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h2
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  Find Water to Map
                </h2>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#4A90E2",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Step 1/4
                </span>
              </div>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <style>{`.location-search-dropdown { top: auto !important; bottom: 100% !important; margin-bottom: 8px !important; max-height: 200px !important; }`}</style>
                <LocationSearch
                  onSelect={handleSearchSelect}
                  placeholder="Search lake name..."
                />
              </div>

              {/* 2. MANUAL COORDINATE INPUT */}
              <form
                onSubmit={handleManualCoordSubmit}
                style={{ display: "flex", gap: 8, marginTop: 8 }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    className="glass-input"
                    placeholder="Jump to Lat, Lng"
                    value={coordsInput}
                    onChange={(e) => setCoordsInput(e.target.value)}
                    style={{ paddingLeft: 30 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#666",
                    }}
                  >
                    <TargetIcon size={14} />
                  </div>
                </div>
                <button
                  type="submit"
                  className="glass-btn"
                  style={{
                    padding: "0 16px",
                    background: "rgba(74, 144, 226, 0.2)",
                    color: "#4A90E2",
                    fontWeight: 600,
                  }}
                >
                  Go
                </button>
              </form>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                Or tap any water body on the map
              </p>
            </div>
          )}

          {/* MODE: VERIFY */}
          {mode === "VERIFY" && (
            <div style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h2
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  Match Found?
                </h2>
                <button
                  onClick={() => setMode("SEARCH")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                  }}
                >
                  Cancel
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  maxHeight: "150px",
                  overflowY: "auto",
                  marginBottom: 16,
                }}
              >
                {nearbyLakes.map((lake) => (
                  <button
                    key={lake.id}
                    onClick={() => {
                      setCurrentLake({ ...lake, _isUpdate: true });
                      if (lake.anchors && lake.anchors.length > 0)
                        setPins(lake.anchors);
                      setMode("DRAW");
                    }}
                    className="glass-btn"
                    style={{
                      justifyContent: "space-between",
                      padding: "12px",
                      textAlign: "left",
                      width: "100%",
                      border: lake.nameMatch
                        ? "1px solid #4A90E2"
                        : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div>
                      <div style={{ color: "#fff", fontWeight: 600 }}>
                        {lake.name}
                      </div>
                      <div style={{ color: "#888", fontSize: "0.7rem" }}>
                        {lake.distance?.toFixed(1)} mi • {lake.city}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#4A90E2",
                        fontWeight: 700,
                      }}
                    >
                      UPDATE
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setCurrentLake((prev) => ({
                    ...prev,
                    id: generateTempId(),
                    _isUpdate: false,
                  }));
                  setMode("DRAW");
                }}
                className="generate-btn"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                No Match - Create New
              </button>
            </div>
          )}

          {/* MODE: DRAW */}
          {mode === "DRAW" && (
            <div style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    Draw Boundary
                  </h2>
                  <div style={{ fontSize: "0.8rem", color: "#4A90E2" }}>
                    {pins.length} Points
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPins((p) => p.slice(0, -1))}
                    className="glass-btn"
                    style={{ padding: "8px" }}
                  >
                    <UndoIcon />
                  </button>
                  <button
                    onClick={() => setPins([])}
                    className="glass-btn"
                    style={{ padding: "8px" }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
              <button
                onClick={handleFinishDraw}
                disabled={pins.length < 3}
                className="generate-btn"
                style={{ width: "100%", opacity: pins.length < 3 ? 0.5 : 1 }}
              >
                Finish Shape
              </button>
              <button
                onClick={() => {
                  setMode("SEARCH");
                  setPins([]);
                  setCurrentLake(null);
                  setNearbyLakes([]);
                  if (anchorMarkerRef.current) anchorMarkerRef.current.remove();
                }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* MODE: METADATA */}
          {mode === "METADATA" && currentLake && (
            <div style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  Lake Details
                </h2>
                <button
                  onClick={() => setMode("DRAW")}
                  style={{
                    color: "#4A90E2",
                    background: "transparent",
                    border: "none",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  Edit Shape
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Name</label>
                  <input
                    className="glass-input"
                    value={currentLake.name}
                    onChange={(e) =>
                      setCurrentLake({ ...currentLake, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">City</label>
                  <input
                    className="glass-input"
                    value={currentLake.city}
                    onChange={(e) =>
                      setCurrentLake({ ...currentLake, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">State</label>
                  <input
                    className="glass-input"
                    value={currentLake.state}
                    onChange={(e) =>
                      setCurrentLake({ ...currentLake, state: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">Acres (Calc)</label>
                  <input
                    className="glass-input"
                    type="number"
                    value={calcAcres}
                    onChange={(e) => setCalcAcres(Number(e.target.value))}
                    style={{ color: "#4A90E2", fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label className="input-label">Tier</label>
                  <select
                    className="glass-input"
                    value={currentLake.tier || 3}
                    onChange={(e) =>
                      setCurrentLake({
                        ...currentLake,
                        tier: Number(e.target.value),
                      })
                    }
                    style={{ appearance: "none" }}
                  >
                    <option value={1} style={{ color: "#000" }}>
                      Tier 1 (Premium)
                    </option>
                    <option value={2} style={{ color: "#000" }}>
                      Tier 2
                    </option>
                    <option value={3} style={{ color: "#000" }}>
                      Tier 3 (Basic)
                    </option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddToBatch}
                className="generate-btn"
                style={{ width: "100%" }}
              >
                <CheckIcon /> Add to Batch
              </button>
              <button
                onClick={() => {
                  setMode("SEARCH");
                  setPins([]);
                  setCurrentLake(null);
                  setNearbyLakes([]);
                  if (anchorMarkerRef.current) anchorMarkerRef.current.remove();
                }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      <StyleBlock />
    </div>
  );
}

// --- SHARED STYLES ---
function StyleBlock() {
  return (
    <style>{`
      .members-navigation-container { position: fixed; bottom: calc(env(safe-area-inset-bottom, 0px) + 30px); left: 50%; transform: translateX(-50%); z-index: 1000; width: 92%; max-width: 480px; }
      .glass-deck { background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; align-items: center; color: #fff; }
      .glass-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .glass-btn:hover { background: rgba(255, 255, 255, 0.1); }
      .glass-panel { background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
      .glass-input { width: 100%; padding: 12px 14px; border-radius: 10px; font-size: 0.95rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; outline: none; }
      .glass-input:focus { border-color: #4A90E2; }
      .input-label { display: block; font-size: 0.7rem; font-weight: 700; opacity: 0.6; margin-bottom: 6px; text-transform: uppercase; color: #fff; }
      .generate-btn { background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); color: #fff; border: none; border-radius: 12px; font-weight: 700; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3); transition: transform 0.1s; }
      .generate-btn:active { transform: scale(0.98); }
      .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .pin-marker { width: 24px; height: 24px; background: white; border: 2px solid #4A90E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: #4A90E2; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
      .orb-marker-map { width: 24px; height: 24px; background: radial-gradient(circle at 30% 30%, #EF4444, #B91C1C); border-radius: 50%; border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
    `}</style>
  );
}
