// src/components/WeatherOverlay.tsx

import React, { useEffect, useState } from "react";
import { WindIcon, ActivityIcon } from "@/components/UnifiedIcons";

// The User's specific CloudIcon
const CloudIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.5"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type WeatherOverlayProps = {
  lat: number;
  lng: number;
  locationName: string;
  onClose: () => void;
};

type CurrentWeather = {
  temp: number | null;
  feelsLike: number | null;
  condition: string;
  pressure: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDir: string;
  humidity: number | null;
  visibility: number | null;
  localTime: string;
  date: string;
};

export function WeatherOverlay({
  lat,
  lng,
  locationName,
  onClose,
}: WeatherOverlayProps) {
  const [data, setData] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Helper: Format local time using the offset from backend
  const formatLocalTime = (offsetSecs: number) => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const lakeTime = new Date(utc + 1000 * offsetSecs);

    return {
      time: lakeTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      date: lakeTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    };
  };

  useEffect(() => {
    let mounted = true;
    async function fetchWeather() {
      if (!API_BASE_URL) {
        setLoading(false);
        return;
      }

      try {
        // Reset state on new coordinates to trigger loading spinner
        setLoading(true);
        setError(false);

        // FIX: Round coordinates to 4 decimal places (~11m precision).
        // This prevents cache misses and API errors caused by raw 15-digit GPS coords
        // common with custom pins/user location.
        const cleanLat = Number(lat).toFixed(4);
        const cleanLng = Number(lng).toFixed(4);

        const res = await fetch(
          `${API_BASE_URL}/weather/current?lat=${cleanLat}&lon=${cleanLng}`,
        );

        if (!res.ok) throw new Error("Weather fetch failed");

        const json = await res.json();

        if (mounted) {
          const local = formatLocalTime(json.timezone_offset || 0);

          setData({
            // Use NULL instead of 0 for missing data so UI can handle it gracefully
            temp: json.temp_f ?? null,
            feelsLike: json.feels_like_f ?? json.temp_f ?? null,
            condition: json.sky_condition ?? "Unknown",
            pressure: json.pressure_mb ?? null,
            windSpeed: json.wind_mph ?? null,
            windGust: json.wind_gust_mph ?? null,
            windDir: json.wind_direction ?? "Var",
            humidity: json.humidity ?? null,
            visibility: json.visibility_miles ?? null,
            localTime: local.time,
            date: local.date,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Weather Fetch Error:", err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    // Only fetch if we have valid coordinates
    if (lat && lng) {
      fetchWeather();
    } else {
      setLoading(false);
      setError(true);
    }

    return () => {
      mounted = false;
    };
  }, [lat, lng]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Helper to render value or placeholder
  const renderValue = (val: number | null, unit: string) => {
    // If null or undefined, show placeholder
    if (val === null || val === undefined) return "--";

    // Sanity check: Pressure of 0 MB is physically impossible, so treat as missing
    if (unit === "MB" && val < 800) return "--";

    return Math.round(val);
  };

  return (
    <div className="weather-modal-backdrop" onClick={handleBackdropClick}>
      <div className="weather-modal-card">
        {/* Header */}
        <div className="weather-header">
          <div className="header-text">
            <span className="weather-label">LIVE CONDITIONS</span>
            <div className="title-row">
              <h3 className="weather-title">{locationName}</h3>
            </div>
            {data && <span className="local-date">{data.date}</span>}
            <div className="title-row">
              {data && <span className="local-time">{data.localTime}</span>}
            </div>
          </div>
          <button onClick={onClose} className="weather-close-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="weather-status-box">
            <CloudIcon size={32} />
            <span className="pulse-text">Syncing Buoy Data...</span>
          </div>
        ) : error || !data ? (
          <div className="weather-status-box">
            <span>Weather data unavailable.</span>
          </div>
        ) : (
          <div className="weather-content">
            {/* Hero Temp */}
            <div className="weather-hero">
              <span className="hero-temp">{renderValue(data.temp, "°")}°</span>
              <div className="hero-meta">
                <span className="condition-pill">{data.condition}</span>
                <span className="feels-like">
                  Feels {renderValue(data.feelsLike, "°")}°
                </span>
              </div>
            </div>

            <div className="weather-divider" />

            {/* Tactical Grid */}
            <div className="weather-grid">
              {/* Wind Card */}
              <div className="grid-item">
                <div className="grid-header">
                  <WindIcon size={18} />
                  <span className="grid-title">WIND</span>
                </div>
                <div className="grid-body">
                  <div className="value-row">
                    <span className="grid-value">
                      {renderValue(data.windSpeed, "MPH")}
                    </span>
                    <span className="grid-unit">MPH</span>
                  </div>
                  <div className="sub-row">
                    <span className="grid-detail highlight">
                      {data.windDir}
                    </span>
                    {/* Only show gust if we have valid speed data AND gust is higher */}
                    {data.windGust !== null &&
                      data.windSpeed !== null &&
                      data.windGust > data.windSpeed && (
                        <span
                          className={`grid-detail ${
                            data.windGust >= 20
                              ? "danger" // Red: 20+ is dangerous for kayaks
                              : data.windGust >= 12
                                ? "warning" // Yellow: 12-19 is "Whitecap/Drift" territory
                                : ""
                          }`}
                        >
                          Gust {Math.round(data.windGust)}
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* Pressure Card */}
              <div className="grid-item">
                <div className="grid-header">
                  <ActivityIcon size={18} />
                  <span className="grid-title">PRESSURE</span>
                </div>
                <div className="grid-body">
                  <div className="value-row">
                    <span className="grid-value">
                      {renderValue(data.pressure, "MB")}
                    </span>
                    <span className="grid-unit">MB</span>
                  </div>
                  <div className="sub-row">
                    <span className="grid-detail">
                      Vis {renderValue(data.visibility, "mi")}mi
                    </span>
                    <span className="grid-detail">
                      Hum {renderValue(data.humidity, "%")}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .weather-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fade-in 0.2s ease-out;
        }

        .weather-modal-card {
          width: 100%;
          max-width: 340px;
          background: rgba(18, 18, 24, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.7);
          color: white;
          transform-origin: center;
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .weather-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .header-text { display: flex; flex-direction: column; }
        .weather-label { font-size: 0.65rem; color: #4A90E2; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 6px; }
        
        .title-row { display: flex; align-items: baseline; gap: 8px; }
        .weather-title { font-size: 1rem; font-weight: 700; margin: 0; color: #fff; line-height: 1.1; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .local-time { font-size: 0.9rem; font-weight: 500; color: #4A90E2; font-variant-numeric: tabular-nums; }
        .local-date { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.4); margin-top: 2px; font-weight: 500; }

        .weather-close-btn {
          background: rgba(255,255,255,0.06);
          border: none;
          color: rgba(255,255,255,0.7);
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .weather-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

        .weather-status-box {
          height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.02);
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .pulse-text { animation: pulse 2s infinite; }

        .weather-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .hero-temp { font-size: 3.5rem; font-weight: 800; line-height: 1; letter-spacing: -0.04em; color: #fff; }
        .hero-meta { display: flex; flex-direction: column; alignItems: flex-end; gap: 6px; }
        .condition-pill { font-size: 0.75rem; font-weight: 700; color: #4A90E2; background: rgba(74, 144, 226, 0.15); padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(74, 144, 226, 0.3); }
        .feels-like { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.6); }

        .weather-divider { height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 24px; }

        .weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .grid-item { 
          background: rgba(255,255,255,0.03); 
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; 
          padding: 16px; 
          display: flex; 
          flex-direction: column; 
          gap: 10px;
        }
        .grid-header { display: flex; align-items: center; gap: 8px; color: #4A90E2; }
        .grid-title { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; opacity: 0.8; }
        
        .grid-body { display: flex; flex-direction: column; gap: 4px; }
        .value-row { display: flex; align-items: baseline; gap: 4px; }
        .grid-value { font-size: 1.6rem; font-weight: 700; color: #fff; line-height: 1; letter-spacing: -0.02em; }
        .grid-unit { font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.4); }
        
        .sub-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .grid-detail { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.7); }
        .grid-detail.highlight { color: #fff; font-weight: 700; }
        .grid-detail.warning { color: #F59E0B; }
        .grid-detail.danger { color: #F32013; }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
