// src/components/WeatherOverlay.tsx

import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  WindIcon,
  EyeIcon,
  HumidityIcon,
  PrecipitationIcon,
} from "@/components/UnifiedIcons";
import { LURE_CATALOG, LureData } from "@/data/lures";
import { useMemberStatus } from "@/hooks/useMemberStatus";

// --- WIND COMPASS GAUGE ---
const WindCompassGauge = ({ direction, speed }: { direction: string; speed: number | null }) => {
  const rotation = useMemo(() => {
    const d = direction.toUpperCase();
    const map: Record<string, number> = {
      N: 180, NNE: 202.5, NE: 225, ENE: 247.5,
      E: 270, ESE: 292.5, SE: 315, SSE: 337.5,
      S: 0, SSW: 22.5, SW: 45, WSW: 67.5,
      W: 90, WNW: 112.5, NW: 135, NNW: 157.5,
    };
    return map[d] ?? 0;
  }, [direction]);

  return (
    <div style={{ position: "relative", width: 110, height: 110 }}>
      {/* Compass ring with tick marks */}
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
        {/* Outer ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

        {/* Tick marks */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="50"
            y1="8"
            x2="50"
            y2={angle % 90 === 0 ? "14" : "11"}
            stroke={angle % 90 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
            strokeWidth={angle % 90 === 0 ? "2" : "1"}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}

        {/* Cardinal labels */}
        <text x="50" y="22" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="800">N</text>
        <text x="86" y="53" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="700">E</text>
        <text x="50" y="86" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="700">S</text>
        <text x="14" y="53" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="700">W</text>

        {/* Direction arrow */}
        <g transform={`rotate(${rotation} 50 50)`}>
          <path
            d="M50 20 L54 40 L50 35 L46 40 Z"
            fill="#4A90E2"
          />
          <circle cx="50" cy="50" r="4" fill="#4A90E2" />
        </g>
      </svg>

      {/* Center speed display */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        marginTop: 2,
      }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
          {speed !== null ? Math.round(speed) : "--"}
        </div>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
          mph
        </div>
      </div>
    </div>
  );
};

// --- PRESSURE ARC GAUGE ---
const PressureArcGauge = ({ pressure }: { pressure: number | null }) => {
  // Convert mb to inHg: 1 mb = 0.02953 inHg
  const pressureInHg = pressure ? pressure * 0.02953 : null;

  // Gauge range: 29.0 to 31.0 inHg (covers typical fishing conditions)
  const minP = 29.0;
  const maxP = 31.0;
  const range = maxP - minP;

  // Calculate needle angle (-90 to 90 degrees for semicircle)
  const getNeedleAngle = (p: number) => {
    const clamped = Math.max(minP, Math.min(maxP, p));
    const normalized = (clamped - minP) / range;
    return -90 + (normalized * 180);
  };

  const needleAngle = pressureInHg ? getNeedleAngle(pressureInHg) : 0;

  // Sweet spot: 29.8 - 30.2 inHg (optimal bass fishing)
  const sweetSpotStart = ((29.8 - minP) / range) * 180 - 90;
  const sweetSpotEnd = ((30.2 - minP) / range) * 180 - 90;

  return (
    <div style={{ position: "relative", width: 120, height: 95, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 100 65" style={{ width: "100%", height: 70 }}>
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Sweet spot arc (green zone) */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="rgba(74, 222, 128, 0.4)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="31.4 125.6"
          strokeDashoffset={-((29.8 - minP) / range) * 125.6}
        />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => {
          const angle = -90 + (pos * 180);
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + 35 * Math.cos(rad);
          const y1 = 55 + 35 * Math.sin(rad);
          const x2 = 50 + 42 * Math.cos(rad);
          const y2 = 55 + 42 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        <text x="5" y="64" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700">Low</text>
        <text x="80" y="64" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700">High</text>

        {/* Needle */}
        {pressureInHg && (
          <g transform={`rotate(${needleAngle} 50 55)`}>
            <line x1="50" y1="55" x2="50" y2="22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="55" r="4" fill="#4A90E2" />
          </g>
        )}
      </svg>

      {/* Center value display */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
          {pressureInHg ? pressureInHg.toFixed(2) : "--"}
        </span>
        <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 3 }}>
          inHg
        </span>
      </div>
    </div>
  );
};

// --- LURE SELECTION LOGIC ---
const selectLuresForConditions = (
  temp: number | null,
  conditions: string[],
  windSpeed: number | null
): LureData[] => {
  const lures = Object.values(LURE_CATALOG);

  // Score each lure based on conditions
  const scored = lures.map((lure) => {
    let score = 0;

    // Temperature match (most important)
    if (temp !== null && lure.temp_range) {
      if (temp >= lure.temp_range.min && temp <= lure.temp_range.max) {
        score += 50; // Perfect temp match
        // Bonus for being in the sweet spot (middle of range)
        const mid = (lure.temp_range.min + lure.temp_range.max) / 2;
        const dist = Math.abs(temp - mid);
        const range = (lure.temp_range.max - lure.temp_range.min) / 2;
        score += Math.max(0, 20 - (dist / range) * 20);
      } else {
        // Partial credit for being close
        const minDist = Math.min(
          Math.abs(temp - lure.temp_range.min),
          Math.abs(temp - lure.temp_range.max)
        );
        if (minDist <= 5) score += 20 - minDist * 2;
      }
    }

    // Condition matches
    conditions.forEach((cond) => {
      if (lure.conditions.some((c) => c.toLowerCase() === cond.toLowerCase())) {
        score += 15;
      }
    });

    // Wind bonus for power baits
    if (windSpeed !== null && windSpeed >= 10) {
      if (lure.conditions.includes("Windy")) score += 10;
      if (!lure.finesse) score += 5;
    }

    // Calm bonus for finesse
    if (windSpeed !== null && windSpeed < 5) {
      if (lure.conditions.includes("Calm")) score += 10;
      if (lure.finesse) score += 5;
    }

    return { lure, score };
  });

  // Sort by score and return top 3
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.lure);
};

// Map weather conditions to lure condition tags
const mapWeatherToConditions = (sky: string, precip: number): string[] => {
  const conditions: string[] = [];
  const skyLower = sky.toLowerCase();

  if (skyLower.includes("cloud") || skyLower.includes("overcast")) {
    conditions.push("Overcast");
  }
  if (skyLower.includes("clear") || skyLower.includes("sunny")) {
    conditions.push("Sunny");
  }
  if (skyLower.includes("rain") || precip > 0) {
    conditions.push("Rain");
  }
  if (skyLower.includes("fog") || skyLower.includes("mist")) {
    conditions.push("Low Light");
  }

  return conditions;
};

// Get current fishing season based on month
const getCurrentSeason = (): string => {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "Pre-Spawn"; // Mar-May
  if (month === 5) return "Spawn"; // June
  if (month === 6) return "Post-Spawn"; // July
  if (month >= 7 && month <= 9) return "Summer"; // Aug-Oct
  if (month >= 10 || month <= 0) return "Fall"; // Nov-Jan
  return "Winter"; // Feb
};

// --- MAIN COMPONENT ---

type WeatherOverlayProps = {
  locationName: string;
  onClose: () => void;
  weatherData: any;
  showTip: boolean;
  lat?: number;
  lng?: number;
};

export function WeatherOverlay({
  locationName,
  onClose,
  weatherData,
}: WeatherOverlayProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [lureIndex, setLureIndex] = useState(0);
  const [showWaterTooltip, setShowWaterTooltip] = useState(false);
  const { isActive } = useMemberStatus();

  const handleUpgradeClick = () => {
    onClose();
    navigate("/upgrade");
  };

  const handleLureImageClick = (e: React.MouseEvent, lure: LureData) => {
    e.stopPropagation(); // Don't trigger card cycle
    onClose();
    navigate("/lure-library", { state: { selectedLureId: lure.id } });
  };

  // Page-level swipe handling (Weather ↔ Lure pages)
  const pageTouchStartX = useRef<number | null>(null);
  const handlePageTouchStart = (e: React.TouchEvent) => {
    pageTouchStartX.current = e.touches[0].clientX;
  };
  const handlePageTouchEnd = (e: React.TouchEvent) => {
    if (pageTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = pageTouchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPage === 0) {
        setCurrentPage(1);
      } else if (diff < 0 && currentPage === 1) {
        setCurrentPage(0);
      }
    }
    pageTouchStartX.current = null;
  };

  // Lure-level swipe handling (between 3 lure recommendations)
  const lureTouchStartX = useRef<number | null>(null);
  const handleLureTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation(); // Don't trigger page swipe
    lureTouchStartX.current = e.touches[0].clientX;
  };
  const handleLureTouchEnd = (e: React.TouchEvent) => {
    if (lureTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = lureTouchStartX.current - touchEndX;
    if (Math.abs(diff) > 40 && recommendedLures.length > 1) {
      if (diff > 0) {
        // Swipe left - next lure
        setLureIndex((prev) => (prev + 1) % recommendedLures.length);
      } else {
        // Swipe right - previous lure
        setLureIndex((prev) => (prev - 1 + recommendedLures.length) % recommendedLures.length);
      }
    }
    lureTouchStartX.current = null;
  };
  // 1. DATA NORMALIZATION
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
      tempHigh: weatherData.temp_high ?? null,
      tempLow: weatherData.temp_low ?? null,
      feelsLike: weatherData.feels_like_f ?? weatherData.temp_f ?? null,
      waterTemp: weatherData.estimated_water_temp_f ?? null,
      condition: weatherData.sky_condition ?? "Unknown",
      pressure: weatherData.pressure_mb ?? null,
      windSpeed: weatherData.wind_mph ?? null,
      windGust: weatherData.wind_gust_mph ?? null,
      windDir: weatherData.wind_direction ?? "N",
      humidity: weatherData.humidity ?? null,
      visibility: weatherData.visibility_miles ?? null,
      precipitation: weatherData.precipitation_1h ?? 0,
      localTime: local.time,
      date: local.date,
    };
  }, [weatherData]);

  // 2. LURE RECOMMENDATIONS
  const currentSeason = getCurrentSeason();
  const currentConditions = useMemo(() => {
    if (!data) return [];
    const conditions = mapWeatherToConditions(data.condition, data.precipitation);
    // Add wind/calm based on speed
    if (data.windSpeed !== null) {
      if (data.windSpeed >= 10) conditions.push("Windy");
      if (data.windSpeed < 5) conditions.push("Calm");
    }
    return conditions;
  }, [data]);

  const recommendedLures = useMemo(() => {
    if (!data) return [];
    return selectLuresForConditions(data.temp, currentConditions, data.windSpeed);
  }, [data, currentConditions]);

  const currentLure = recommendedLures[lureIndex] || null;

  // Get matching attributes for current lure
  const matchingSeasons = useMemo(() => {
    if (!currentLure) return [];
    return currentLure.season_affinity.filter(s => s === currentSeason);
  }, [currentLure, currentSeason]);

  const matchingConditions = useMemo(() => {
    if (!currentLure) return [];
    return currentLure.conditions.filter(c =>
      currentConditions.some(cc => cc.toLowerCase() === c.toLowerCase())
    );
  }, [currentLure, currentConditions]);

  // 3. HELPER
  const renderValue = (val: number | null) => {
    if (val === null || val === undefined) return "--";
    return Math.round(val);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Gust color coding
  const getGustClass = (gust: number | null, speed: number | null) => {
    if (gust === null || speed === null) return "";
    if (gust < speed + 5) return "";
    if (gust >= 20) return "danger";
    if (gust >= 12) return "warning";
    return "";
  };

  return (
    <div className="weather-modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="weather-modal-card"
        onTouchStart={handlePageTouchStart}
        onTouchEnd={handlePageTouchEnd}
      >
        {/* --- HEADER --- */}
        <div className="weather-header">
          <div className="header-text">
            <span className="weather-label">{currentPage === 0 ? "LIVE CONDITIONS" : "LURE SUGGESTIONS"}</span>
            {currentPage === 0 && (
              <>
                <h3 className="weather-title">{locationName}</h3>
                {data && <span className="local-date">{data.date}</span>}
                {data && <span className="local-time">{data.localTime}</span>}
              </>
            )}
          </div>
          <button onClick={onClose} className="weather-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {currentPage === 0 && data && <span className="condition-pill">{data.condition}</span>}
        </div>

        {/* --- LOADING STATE --- */}
        {!data ? (
          <div className="weather-status-box">
            <WindIcon size={32} color="rgba(255,255,255,0.4)" />
            <span className="pulse-text">Syncing Buoy Data...</span>
          </div>
        ) : (
          <div className="page-slider-container">
            <div
              className="page-slider-track"
              style={{ transform: `translateX(${-currentPage * 100}%)` }}
            >
              {/* PAGE 0: WEATHER */}
              <div className="page-slide">
                {/* TEMPERATURE SECTION */}
                <div className="temp-section">
                  <div className="temp-hero-stack">
                    <span className="hero-temp">{renderValue(data.temp)}°</span>
                    {data.waterTemp !== null && (
                      <div
                        className="water-temp-row"
                        onMouseEnter={() => setShowWaterTooltip(true)}
                        onMouseLeave={() => setShowWaterTooltip(false)}
                        onTouchStart={() => setShowWaterTooltip(true)}
                        onTouchEnd={() => setTimeout(() => setShowWaterTooltip(false), 2000)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#4A90E2">
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                        </svg>
                        <span className="water-temp-value">~{renderValue(data.waterTemp)}°</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        {showWaterTooltip && (
                          <div className="water-tooltip">
                            Water temp is estimated based on the past 5 days of air temperature trends
                            <div className="water-tooltip-arrow" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="temp-details">
                    <span className="temp-detail">H: {renderValue(data.tempHigh)}°</span>
                    <span className="temp-detail">L: {renderValue(data.tempLow)}°</span>
                    <span className="temp-detail feels">Feels: {renderValue(data.feelsLike)}°</span>
                  </div>
                </div>

                <div className="weather-divider" />

                {/* GAUGE CARDS */}
                <div className="gauge-grid">
                  {/* WIND CARD */}
                  <div className="gauge-card">
                    <div className="gauge-header">
                      <WindIcon size={18} />
                      <span className="gauge-title">WIND</span>
                    </div>
                    <div className="gauge-body">
                      <WindCompassGauge direction={data.windDir} speed={data.windSpeed} />
                      {data.windGust !== null && data.windSpeed !== null && data.windGust > data.windSpeed + 5 && (
                        <span className={`gust-label ${getGustClass(data.windGust, data.windSpeed)}`}>
                          Gusts: {Math.round(data.windGust)} mph
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PRESSURE CARD */}
                  <div className="gauge-card">
                    <div className="gauge-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" strokeLinecap="round" />
                      </svg>
                      <span className="gauge-title">PRESSURE</span>
                    </div>
                    <div className="gauge-body" style={{ paddingTop: 0 }}>
                      <PressureArcGauge pressure={data.pressure} />
                    </div>
                  </div>
                </div>

                {/* METRICS BAR */}
                <div className="metrics-bar">
                  <div className="metric-item">
                    <EyeIcon size={22} />
                    <span className="metric-label">VIS</span>
                    <span className="metric-value">{renderValue(data.visibility)} mi</span>
                  </div>
                  <div className="metric-item">
                    <HumidityIcon size={22} />
                    <span className="metric-label">HUM</span>
                    <span className="metric-value">{renderValue(data.humidity)}%</span>
                  </div>
                  <div className="metric-item">
                    <PrecipitationIcon size={22} />
                    <span className="metric-label">PRECIP</span>
                    <span className="metric-value">{data.precipitation > 0 ? `${data.precipitation.toFixed(1)}"` : '0"'}</span>
                  </div>
                </div>
              </div>

              {/* PAGE 1: LURE SUGGESTIONS */}
              <div className="page-slide">
                {/* Blur gate for free users */}
                {!isActive ? (
                  <div className="lure-blur-container">
                    <div className="lure-card blurred">
                      {currentLure && (
                        <>
                          <div className="lure-card-image">
                            <img
                              src={currentLure.image}
                              alt={currentLure.display_name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/lures/placeholder.png";
                              }}
                            />
                          </div>
                          <div className="lure-card-content">
                            <h3 className="lure-card-name">{currentLure.display_name}</h3>
                            <p className="lure-card-tagline">{currentLure.tagline}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="lure-upgrade-overlay" onClick={handleUpgradeClick}>
                      <div className="upgrade-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <span className="upgrade-text">Upgrade to Pro</span>
                      <span className="upgrade-subtext">Get condition-based lure suggestions</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="lure-slider-container"
                    onTouchStart={handleLureTouchStart}
                    onTouchEnd={handleLureTouchEnd}
                  >
                    {currentLure && (
                      <div className="lure-card">
                        {/* Image section - click to open lure library */}
                        <div
                          className="lure-card-image"
                          onClick={(e) => handleLureImageClick(e, currentLure)}
                        >
                          <img
                            src={currentLure.image}
                            alt={currentLure.display_name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/lures/placeholder.png";
                            }}
                          />
                          <span className="tap-hint">Tap for details</span>
                        </div>

                        {/* Content section */}
                        <div className="lure-card-content">
                          <h3 className="lure-card-name">{currentLure.display_name}</h3>
                          <p className="lure-card-description">{currentLure.description}</p>

                          {/* Metadata grid */}
                          <div className="lure-card-meta">
                            {currentLure.temp_range && (
                              <div className="meta-row">
                                <span className="meta-label">Temp:</span>
                                <span className="meta-value">{currentLure.temp_range.min}°–{currentLure.temp_range.max}°F</span>
                              </div>
                            )}
                            {currentLure.cover_type.length > 0 && (
                              <div className="meta-row">
                                <span className="meta-label">Cover:</span>
                                <span className="meta-value">{currentLure.cover_type.slice(0, 2).join(", ")}</span>
                              </div>
                            )}
                            {matchingSeasons.length > 0 && (
                              <div className="meta-row">
                                <span className="meta-label">Season:</span>
                                <span className="meta-value">{matchingSeasons.join(", ")}</span>
                              </div>
                            )}
                            {matchingConditions.length > 0 && (
                              <div className="meta-row">
                                <span className="meta-label">Conditions:</span>
                                <span className="meta-value">{matchingConditions.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lure breadcrumb dots */}
                    {recommendedLures.length > 1 && (
                      <div className="lure-dots">
                        {recommendedLures.map((_, i) => (
                          <div
                            key={i}
                            className={`lure-dot ${i === lureIndex ? "active" : ""}`}
                            onClick={() => setLureIndex(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PAGE INDICATOR - outside slider track */}
            <div className="page-indicator">
              <div className={`page-dot ${currentPage === 0 ? "active" : ""}`} onClick={() => setCurrentPage(0)} />
              <div className={`page-dot ${currentPage === 1 ? "active" : ""}`} onClick={() => setCurrentPage(1)} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .weather-modal-backdrop { position: fixed; inset: 0; z-index: 2000; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fade-in 0.2s ease-out; }
        .weather-modal-card { width: 100%; max-width: 340px; height: 620px; max-height: 90vh; background: rgba(18, 18, 24, 0.95); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 28px; padding: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.7); color: white; animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; }

        .weather-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 12px; position: relative; }
        .header-text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .weather-label { font-size: 0.65rem; color: #4A90E2; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .weather-title { font-size: 1rem; font-weight: 700; margin: 0; color: #fff; line-height: 1.2; max-width: 220px; }
        .local-date { font-size: 0.85rem; font-weight: 500; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .local-time { font-size: 0.85rem; font-weight: 600; color: #4A90E2; margin-top: 4px; }
        .condition-pill { position: absolute; bottom: 0; right: 0; font-size: 0.7rem; font-weight: 700; color: #4A90E2; background: rgba(74, 144, 226, 0.15); padding: 3px 8px; border-radius: 10px; border: 1px solid rgba(74, 144, 226, 0.3); }

        .weather-close-btn { background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.7); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .weather-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

        .weather-status-box { height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.02); border-radius: 20px; font-size: 0.9rem; font-weight: 500; }
        .pulse-text { animation: pulse 2s infinite; }

        /* HORIZONTAL PAGE SLIDER */
        .page-slider-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .page-slider-track { display: flex; flex: 1; min-height: 0; transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .page-slide { flex: 0 0 100%; width: 100%; display: flex; flex-direction: column; overflow: hidden; }

        .weather-content { animation: fade-in 0.3s ease-out; flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* TEMPERATURE SECTION */
        .temp-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .temp-hero-stack { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
        .hero-temp { font-size: 3.2rem; font-weight: 800; line-height: 1; letter-spacing: -0.04em; color: #fff; }
        .water-temp-row { position: relative; display: flex; align-items: center; gap: 5px; background: rgba(74, 144, 226, 0.12); border: 1px solid rgba(74, 144, 226, 0.25); padding: 4px 10px; border-radius: 10px; cursor: help; }
        .water-temp-value { font-size: 0.9rem; font-weight: 700; color: #4A90E2; }
        .water-tooltip { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.95); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px 14px; width: 200px; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,0.5); font-size: 0.7rem; color: rgba(255,255,255,0.9); line-height: 1.4; text-align: center; }
        .water-tooltip-arrow { position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 7px solid rgba(0, 0, 0, 0.95); }
        .temp-details { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .temp-detail { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.6); }
        .temp-detail.feels { color: rgba(255,255,255,0.8); margin-top: 2px; }

        .weather-divider { height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 20px; }

        /* GAUGE CARDS */
        .gauge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .gauge-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 10px 8px 12px; display: flex; flex-direction: column; align-items: center; }
        .gauge-header { display: flex; align-items: center; gap: 6px; color: #4A90E2; margin-bottom: 0; width: 100%; justify-content: center; }
        .gauge-title { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em; }
        .gauge-body { display: flex; flex-direction: column; align-items: center; gap: 6px; }

        .gust-label { font-size: 0.7rem; font-weight: 600; color: rgba(255,255,255,0.6); padding: 2px 8px; border-radius: 8px; background: rgba(255,255,255,0.05); }
        .gust-label.warning { color: #F59E0B; background: rgba(245, 158, 11, 0.15); }
        .gust-label.danger { color: #EF4444; background: rgba(239, 68, 68, 0.15); }

        /* METRICS BAR */
        .metrics-bar { display: flex; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px 14px; }
        .metric-item { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; color: rgba(255,255,255,0.6); }
        .metric-item svg { color: #4A90E2; }
        .metric-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
        .metric-value { font-size: 0.95rem; font-weight: 700; color: #fff; }

        /* PAGE INDICATOR DOTS */
        .page-indicator { display: flex; justify-content: center; gap: 6px; margin-top: auto; padding-top: 12px; flex-shrink: 0; }
        .page-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.25); transition: all 0.3s ease; cursor: pointer; }
        .page-dot:hover { background: rgba(255,255,255,0.4); }
        .page-dot.active { width: 18px; border-radius: 3px; background: #4A90E2; }

        /* LURE SLIDER CONTAINER */
        .lure-slider-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }

        /* LURE BREADCRUMB DOTS */
        .lure-dots { display: flex; justify-content: center; gap: 8px; padding: 12px 0 4px; flex-shrink: 0; }
        .lure-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.1); transition: all 0.25s ease; cursor: pointer; }
        .lure-dot:hover { background: rgba(255,255,255,0.35); }
        .lure-dot.active { background: #4A90E2; border-color: rgba(74, 144, 226, 0.5); box-shadow: 0 0 8px rgba(74, 144, 226, 0.4); }

        /* FULL-WIDTH LURE CARD */
        .lure-card { position: relative; width: 100%; flex: 1; min-height: 0; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease; display: flex; flex-direction: column; }
        .lure-card:hover { border-color: rgba(74, 144, 226, 0.3); }
        .lure-card:active { transform: scale(0.98); }

        .lure-card-image { position: relative; width: 100%; height: 140px; flex-shrink: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s ease; }
        .lure-card-image:hover { background: rgba(0,0,0,0.4); }
        .lure-card-image img { max-width: 90%; max-height: 120px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)); }
        .tap-hint { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 500; }

        .lure-card-content { padding: 12px 16px 14px; flex: 1; overflow-y: auto; min-height: 0; }

        .lure-card-name { font-size: 1rem; font-weight: 700; color: #fff; margin: 0 0 6px; line-height: 1.2; }
        .lure-card-description { font-size: 0.75rem; color: rgba(255,255,255,0.6); font-weight: 400; margin: 0 0 12px; line-height: 1.5; }

        .lure-card-meta { display: flex; flex-direction: column; gap: 6px; }
        .meta-row { display: flex; gap: 6px; font-size: 0.75rem; line-height: 1.3; }
        .meta-label { color: rgba(255,255,255,0.4); font-weight: 600; flex-shrink: 0; }
        .meta-value { color: rgba(255,255,255,0.8); font-weight: 500; }

        /* BLUR GATE FOR FREE USERS */
        .lure-blur-container { position: relative; width: 100%; flex: 1; min-height: 0; display: flex; flex-direction: column; }
        .lure-card.blurred { filter: blur(10px); pointer-events: none; opacity: 0.7; flex: 1; }

        .lure-upgrade-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: rgba(18, 18, 24, 0.4); border-radius: 20px; cursor: pointer; transition: background 0.2s ease; }
        .lure-upgrade-overlay:hover { background: rgba(18, 18, 24, 0.6); }
        .upgrade-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(74, 144, 226, 0.15); border: 1px solid rgba(74, 144, 226, 0.3); display: flex; align-items: center; justify-content: center; color: #4A90E2; margin-bottom: 12px; }
        .upgrade-text { font-size: 1rem; font-weight: 700; color: #4A90E2; margin-bottom: 4px; }
        .upgrade-subtext { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
