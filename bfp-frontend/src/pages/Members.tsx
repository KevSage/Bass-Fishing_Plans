import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import mapboxgl from "mapbox-gl";
import { generateMemberPlan } from "@/lib/api";
import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import type { PlanGenerateResponse } from "@/features/plan/types";
import { PlanDownloads } from "@/features/plan/PlanDownloads";
import { PlanScreen } from "@/features/plan/PlanScreen";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

/**
 * Members Generate Page - Full plan generation for active subscribers
 */
export function Members() {
  const { user } = useUser();
  const { isActive, isLoading: statusLoading } = useMemberStatus();

  const [waterName, setWaterName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [plan, setPlan] = useState<PlanGenerateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-84.073, 34.188], // Default to Lake Lanier area
      zoom: 9,
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  function handleSearchSelect(location: {
    name: string;
    latitude: number;
    longitude: number;
  }) {
    setWaterName(location.name);
    setLat(location.latitude);
    setLon(location.longitude);
    setShowSearch(false);

    // Update map
    if (map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 12,
        duration: 1500,
      });

      // Update marker
      if (marker.current) {
        marker.current.remove();
      }
      marker.current = new mapboxgl.Marker({ color: "#3b82f6" })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    }
  }

  async function onGenerate() {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setErr("Email not found");
      return;
    }
    if (!waterName || lat === null || lon === null) {
      setErr("Please select a lake");
      return;
    }

    setErr(null);
    setLoading(true);
    try {
      const payload = {
        email: user.primaryEmailAddress.emailAddress,
        water: { name: waterName, lat, lon },
      };
      const p = await generateMemberPlan(payload);
      setPlan(p);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = Boolean(waterName && lat !== null && lon !== null);

  // Show loading state while checking subscription
  if (statusLoading) {
    return (
      <div
        className="container"
        style={{ paddingTop: 100, textAlign: "center" }}
      >
        <div className="muted">Checking subscription status...</div>
      </div>
    );
  }

  // Show upgrade prompt if not subscribed
  if (!isActive) {
    return (
      <div
        className="container"
        style={{ paddingTop: 100, textAlign: "center" }}
      >
        <div className="kicker">Members Only</div>
        <h1 className="h2" style={{ marginTop: 10 }}>
          Active subscription required
        </h1>
        <p
          className="p"
          style={{ marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}
        >
          You need an active subscription to generate full fishing plans.
        </p>
        <a
          href="/subscribe"
          className="btn primary"
          style={{ marginTop: 24, display: "inline-block" }}
        >
          Subscribe Now
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <div className="kicker">Members</div>
      <h1 className="h2" style={{ marginTop: 10 }}>
        Generate Your Fishing Plan
      </h1>
      <p className="p" style={{ marginTop: 12 }}>
        Select a lake and generate a complete, AI-powered fishing plan.
      </p>

      {/* Map */}
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: 400,
          borderRadius: 12,
          marginTop: 24,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />

      {/* Lake Search */}
      <div className="card" style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div className="label">Selected Lake</div>
            <div style={{ marginTop: 6, fontSize: 15 }}>
              {waterName || <span className="muted">No lake selected</span>}
            </div>
          </div>
          <button
            className="btn"
            onClick={() => setShowSearch(true)}
            style={{ cursor: "pointer" }}
          >
            {waterName ? "Change Lake" : "Select Lake"}
          </button>
        </div>

        <button
          className="btn primary"
          style={{ marginTop: 18, cursor: "pointer", width: "100%" }}
          disabled={!canGenerate || loading}
          onClick={onGenerate}
        >
          {loading ? "Generating Plan..." : "Generate Full Plan"}
        </button>

        {err && (
          <div style={{ marginTop: 12, color: "rgba(255,160,160,0.95)" }}>
            {err}
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowSearch(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 500, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div className="label">Search for a lake</div>
              <button
                onClick={() => setShowSearch(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "1.5em",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <LocationSearch
              onSelect={handleSearchSelect}
              placeholder="Lake Lanier, Lake Fork..."
            />
          </div>
        </div>
      )}

      {/* Generated Plan */}
      {plan && (
        <div style={{ marginTop: 24 }}>
          <PlanDownloads response={plan} />
          <div style={{ height: 18 }} />
          <PlanScreen response={plan} />
        </div>
      )}
    </div>
  );
}
