// src/components/WeatherOverlay.tsx

import React, { useMemo } from "react";
import {
  WindIcon,
  ActivityIcon,
  TargetIcon,
  CloudIcon,
} from "@/components/UnifiedIcons";
import { getMapTargetRecommendation } from "@/lib/map-target-logic";

// --- SUB-COMPONENT: ROTATING WIND ARROW (UI ONLY) ---
const WindDirectionArrow = ({ dir }: { dir: string }) => {
  const rotation = useMemo(() => {
    const d = dir.toUpperCase();
    const map: Record<string, number> = {
      N: 0,
      NNE: 22.5,
      NE: 45,
      ENE: 67.5,
      E: 90,
      ESE: 112.5,
      SE: 135,
      SSE: 157.5,
      S: 180,
      SSW: 202.5,
      SW: 225,
      WSW: 247.5,
      W: 270,
      WNW: 292.5,
      NW: 315,
      NNW: 337.5,
    };
    return map[d] ?? 0;
  }, [dir]);

  return (
    <div
      style={{
        display: "inline-flex",
        transform: `rotate(${rotation}deg)`,
        transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
        marginLeft: 6,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4A90E2"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </div>
  );
};

// --- MAIN COMPONENT ---

type WeatherOverlayProps = {
  locationName: string;
  onClose: () => void;
  weatherData: any; // Raw API data passed from parent
  showTip: boolean; // Controls "Tactical Insight" section
  lat?: number; // Optional legacy prop
  lng?: number; // Optional legacy prop
};

export function WeatherOverlay({
  locationName,
  onClose,
  weatherData,
  showTip,
}: WeatherOverlayProps) {
  // 1. DATA NORMALIZATION (Safe Parsing)
  const data = useMemo(() => {
    if (!weatherData) return null;

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

    const local = formatLocalTime(weatherData.timezone_offset || 0);

    return {
      temp: weatherData.temp_f ?? null,
      feelsLike: weatherData.feels_like_f ?? weatherData.temp_f ?? null,
      condition: weatherData.sky_condition ?? "Unknown",
      pressure: weatherData.pressure_mb ?? null,
      windSpeed: weatherData.wind_mph ?? null,
      windGust: weatherData.wind_gust_mph ?? null,
      windDir: weatherData.wind_direction ?? "N",
      humidity: weatherData.humidity ?? null,
      visibility: weatherData.visibility_miles ?? null,
      localTime: local.time,
      date: local.date,
    };
  }, [weatherData]);

  // 2. INSIGHT LOGIC (Conditional)
  const insight = useMemo(() => {
    if (!showTip || !weatherData) return null;
    return getMapTargetRecommendation(weatherData);
  }, [showTip, weatherData]);

  // 3. HELPER RENDERER
  const renderValue = (val: number | null, unit: string = "") => {
    if (val === null || val === undefined) return "--";
    if (unit === "MB" && val < 800) return "--";
    return Math.round(val);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="weather-modal-backdrop" onClick={handleBackdropClick}>
      <div className="weather-modal-card">
        {/* --- HEADER --- */}
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

        {/* --- LOADING STATE --- */}
        {!data ? (
          <div className="weather-status-box">
            <CloudIcon size={32} color="rgba(255,255,255,0.4)" />
            <span className="pulse-text">Syncing Buoy Data...</span>
          </div>
        ) : (
          /* --- CONTENT --- */
          <div className="weather-content animate-in fade-in zoom-in-95 duration-300">
            {/* HERO TEMP */}
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

            {/* TACTICAL GRID */}
            <div className="weather-grid">
              {/* WIND CARD (Restored to Clean Layout) */}
              <div className="grid-item">
                <div className="grid-header">
                  <WindIcon size={18} />
                  <span className="grid-title">WIND</span>
                </div>

                <div className="grid-body">
                  <div className="value-row">
                    <span className="grid-value">
                      {renderValue(data.windSpeed)}
                    </span>
                    <span className="grid-unit">MPH</span>
                  </div>
                  <div className="sub-row">
                    <span
                      className="grid-detail highlight"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {data.windDir}
                      {/* ✅ DIRECTION ARROW */}
                      <WindDirectionArrow dir={data.windDir} />
                    </span>
                    {/* Gust Warning */}
                    {data.windGust !== null &&
                      data.windSpeed !== null &&
                      data.windGust > data.windSpeed + 5 && (
                        <span
                          className={`grid-detail ${data.windGust >= 20 ? "danger" : data.windGust >= 12 ? "warning" : ""}`}
                        >
                          Gust {Math.round(data.windGust)}
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* PRESSURE CARD */}
              <div className="grid-item">
                <div className="grid-header">
                  <ActivityIcon size={18} />
                  <span className="grid-title">PRESSURE</span>
                </div>
                <div className="grid-body">
                  <div className="value-row">
                    <span className="grid-value">
                      {renderValue(data.pressure)}
                    </span>
                    <span className="grid-unit">MB</span>
                  </div>
                  <div className="sub-row">
                    <span className="grid-detail">
                      Vis {renderValue(data.visibility)}mi
                    </span>
                    <span className="grid-detail">
                      Hum {renderValue(data.humidity)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- TACTICAL INSIGHT (Delayed Reveal) --- */}
            {insight && (
              <div className="tactical-section animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div
                  className="weather-divider"
                  style={{ margin: "20px 0 16px" }}
                />
                <div className="tactical-header">
                  <div className="tactical-icon-bg">
                    <TargetIcon size={16} color="#4A90E2" />
                  </div>
                  <span className="tactical-title">TACTICAL INSIGHT</span>
                </div>
                <h4 className="tactical-headline">{insight.headline}</h4>
                <p className="tactical-body">{insight.subtext}</p>
                <div className="tactical-tags">
                  {insight.targets.slice(0, 3).map((t, i) => (
                    <span key={i} className="tactical-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .weather-modal-backdrop { position: fixed; inset: 0; z-index: 2000; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fade-in 0.2s ease-out; }
        .weather-modal-card { width: 100%; max-width: 340px; background: rgba(18, 18, 24, 0.95); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 28px; padding: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.7); color: white; transform-origin: center; animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        
        .weather-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .header-text { display: flex; flex-direction: column; }
        .weather-label { font-size: 0.65rem; color: #4A90E2; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 6px; }
        .title-row { display: flex; align-items: baseline; gap: 8px; }
        .weather-title { font-size: 1rem; font-weight: 700; margin: 0; color: #fff; line-height: 1.1; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .local-time { font-size: 0.9rem; font-weight: 500; color: #4A90E2; font-variant-numeric: tabular-nums; }
        .local-date { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.4); margin-top: 2px; }
        
        .weather-close-btn { background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.7); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .weather-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
        
        .weather-status-box { height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.02); border-radius: 20px; font-size: 0.9rem; font-weight: 500; }
        .pulse-text { animation: pulse 2s infinite; }
        
        .weather-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .hero-temp { font-size: 3.5rem; font-weight: 800; line-height: 1; letter-spacing: -0.04em; color: #fff; }
        .hero-meta { display: flex; flex-direction: column; alignItems: flex-end; gap: 6px; }
        .condition-pill { font-size: 0.75rem; font-weight: 700; color: #4A90E2; background: rgba(74, 144, 226, 0.15); padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(74, 144, 226, 0.3); }
        .feels-like { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.6); }
        
        .weather-divider { height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 24px; }
        
        .weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
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

        .tactical-section { margin-top: 4px; }
        .tactical-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .tactical-icon-bg { width: 28px; height: 28px; border-radius: 50%; background: rgba(74, 144, 226, 0.15); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(74, 144, 226, 0.2); }
        .tactical-title { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; color: #4A90E2; }
        .tactical-headline { margin: 0 0 6px 0; font-size: 0.95rem; font-weight: 700; color: #fff; }
        .tactical-body { margin: 0 0 12px 0; font-size: 0.85rem; line-height: 1.5; color: rgba(255, 255, 255, 0.7); }
        .tactical-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tactical-tag { font-size: 0.7rem; font-weight: 600; color: #E2E8F0; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); padding: 4px 10px; border-radius: 6px; text-transform: capitalize; }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
