// src/pages/Insights.tsx

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InsightsLoadingScreen } from "@/components/InsightsLoadingScreen";
import {
  ArrowLeftIcon,
  TrophyIcon,
  CalendarIcon,
  FishIcon,
  XIcon,
  MapPinIcon,
  ClockIcon,
} from "@/components/UnifiedIcons";

import { useMemberStatus } from "@/hooks/useMemberStatus";

import {
  useCatchLog,
  CatchEntry,
  LURE_OPTIONS,
  CatchDetailView,
  CatchLogModal,
  apiRecordToEntry,
  type ActiveLake,
  CatchFormView,
} from "@/components/CatchLog";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Helper to capitalize each word for display
const capitalize = (str: string) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

// =============================================================================
// ICONS & MODALS
// =============================================================================

// FIXED: Added 'style' to props type and passed it to the svg
const LockIcon = ({
  size = 12,
  className = "",
  style = {},
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UploadImageIcon = ({ size = 24 }: { size?: number }) => (
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
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

function UpgradeModal({
  isOpen,
  onClose,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div
      className="stats-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="stats-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 320,
          padding: 32,
          textAlign: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(74, 144, 226, 0.15)",
            color: "#4A90E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <LockIcon size={30} />
        </div>

        <h3
          style={{
            margin: "0 0 10px 0",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Pro Feature
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            opacity: 0.7,
            lineHeight: 1.5,
            fontSize: "0.95rem",
            color: "#fff",
          }}
        >
          {message}
        </p>

        <button
          onClick={() => navigate("/account")}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
            border: "none",
            borderRadius: 16,
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(74, 144, 226, 0.3)",
          }}
        >
          Upgrade to Unlock
        </button>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            marginTop: 16,
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Not Now
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER: CountUp Animation Hook
// =============================================================================
function useCountUp(end: number, duration: number = 2500, delay: number = 600) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;
    let timeoutId: NodeJS.Timeout;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;
      const ease = (t: number) => 1 - Math.pow(1 - t, 4);
      const percentage = Math.min(progress / duration, 1);
      const currentCount = Math.floor(ease(percentage) * end);
      setCount(currentCount);
      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    if (end > 0) {
      timeoutId = setTimeout(() => {
        animationFrame = requestAnimationFrame(animate);
      }, delay);
    } else {
      setCount(0);
    }

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrame);
    };
  }, [end, duration, delay]);

  return count;
}

// =============================================================================
// STATS CALCULATOR
// =============================================================================
type ViewMode =
  | "total"
  | "lakes"
  | "best_day"
  | "pbs"
  | "confidence"
  | "techniques";

type StatCalculation = {
  totalCount: number;
  lakes: {
    name: string;
    count: number;
    lat: number;
    lng: number;
    topLures: string[];
  }[];
  pbs: Record<string, CatchEntry | null>;
  bestDay: {
    date: string;
    weight: number;
    count: number;
    displayDate: string;
    lures: string[];
  } | null;
  topTechniques: { category: string; count: number }[];
  topLures: { lure: string; count: number }[];
};

function calculateStats(entries: CatchEntry[]): StatCalculation {
  if (!entries.length) {
    return {
      totalCount: 0,
      lakes: [],
      pbs: { largemouth: null, smallmouth: null, spotted: null },
      bestDay: null,
      topTechniques: [],
      topLures: [],
    };
  }

  const lakeMap: Record<
    string,
    { count: number; lat: number; lng: number; lures: Record<string, number> }
  > = {};
  const dayMap: Record<
    string,
    { weight: number; count: number; lures: Set<string> }
  > = {};
  const pbMap: Record<string, CatchEntry | null> = {
    largemouth: null,
    smallmouth: null,
    spotted: null,
  };
  const techMap: Record<string, number> = {};
  const lureMap: Record<string, number> = {};

  entries.forEach((e) => {
    // Lakes
    const lName = e.lakeName || "Unknown Water";
    if (!lakeMap[lName]) {
      lakeMap[lName] = {
        count: 0,
        lat: e.lakeLat || e.catchLat,
        lng: e.lakeLng || e.catchLng,
        lures: {},
      };
    }
    lakeMap[lName].count++;
    lakeMap[lName].lures[e.lure] = (lakeMap[lName].lures[e.lure] || 0) + 1;

    // Days
    const date = e.caughtAt.split("T")[0];
    if (!dayMap[date]) dayMap[date] = { weight: 0, count: 0, lures: new Set() };
    dayMap[date].weight += e.weight || 0;
    dayMap[date].count++;
    dayMap[date].lures.add(e.lure);

    // PBs
    const species = (e.species || "largemouth").toLowerCase();
    if (species in pbMap) {
      const current = pbMap[species];
      if (
        !current ||
        (e.weight && (!current.weight || e.weight > current.weight))
      ) {
        pbMap[species] = e;
      }
    }

    // Techniques/Lures
    lureMap[e.lure] = (lureMap[e.lure] || 0) + 1;
    const opt = LURE_OPTIONS.find((o) => o.value === e.lure);
    const cat = opt?.category || "Other";
    techMap[cat] = (techMap[cat] || 0) + 1;
  });

  // Process Lakes
  const lakes = Object.entries(lakeMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      lat: data.lat,
      lng: data.lng,
      topLures: Object.entries(data.lures)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((l) => l[0]),
    }))
    .sort((a, b) => b.count - a.count);

  // Process Best Day
  let bestDay = null;
  if (Object.keys(dayMap).length > 0) {
    const bestDateKey = Object.keys(dayMap).reduce((a, b) => {
      if (dayMap[a].weight === dayMap[b].weight)
        return dayMap[a].count > dayMap[b].count ? a : b;
      return dayMap[a].weight > dayMap[b].weight ? a : b;
    });
    bestDay = {
      date: bestDateKey,
      ...dayMap[bestDateKey],
      lures: Array.from(dayMap[bestDateKey].lures),
      displayDate: new Date(bestDateKey).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  }

  return {
    totalCount: entries.length,
    lakes,
    pbs: pbMap,
    bestDay,
    topTechniques: Object.entries(techMap)
      .map(([c, n]) => ({ category: c, count: n }))
      .sort((a, b) => b.count - a.count),
    topLures: Object.entries(lureMap)
      .map(([l, n]) => ({ lure: l, count: n }))
      .sort((a, b) => b.count - a.count),
  };
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const EmptyPBCard = ({ species }: { species: string }) => (
  <div className="pb-card-empty">
    <div className="pb-empty-icon">
      <FishIcon size={32} />
    </div>
    <div className="pb-empty-info">
      <span className="pb-empty-title">{species}</span>
      <span className="pb-empty-subtitle">No catches logged yet</span>
    </div>
    <style>{`
      .pb-card-empty {
        background: rgba(255, 255, 255, 0.03);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        height: 120px;
      }
      .pb-empty-icon {
        width: 60px; height: 60px;
        background: rgba(255,255,255,0.05);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: rgba(255,255,255,0.3);
      }
      .pb-empty-info { display: flex; flex-direction: column; gap: 4px; }
      .pb-empty-title { font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.9rem; }
      .pb-empty-subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.4); }
    `}</style>
  </div>
);

const FullPBCard = ({
  entry,
  onClick,
}: {
  entry: CatchEntry;
  onClick: () => void;
}) => {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="pb-card-full" onClick={onClick}>
      {/* Background Image Layer */}
      <div className="pb-bg-image">
        {entry.photoUrl || entry.imageData ? (
          <img src={entry.photoUrl || entry.imageData} alt="PB" />
        ) : (
          <div className="pb-no-image-bg">
            <FishIcon size={60} />
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="pb-gradient-overlay" />

      {/* Content Layer */}
      <div className="pb-content">
        <div className="pb-header">
          <span className="pb-badge">{entry.species || "Bass"}</span>
          {entry.isOffline && <span className="pb-offline-badge">Offline</span>}
        </div>

        <div className="pb-main-stat">
          <span className="pb-weight-val">{entry.weight}</span>
          <span className="pb-weight-unit">lbs</span>
        </div>

        <div className="pb-details-grid">
          <div className="pb-detail-item">
            <MapPinIcon size={14} />
            <span>{entry.lakeName}</span>
          </div>
          <div className="pb-detail-item">
            <CalendarIcon size={14} />
            <span>{formatDate(entry.caughtAt)}</span>
          </div>
          <div className="pb-detail-item">
            <ClockIcon size={14} />
            <span>{formatTime(entry.caughtAt)}</span>
          </div>
          <div className="pb-detail-item">
            <FishIcon size={14} />
            <span style={{ textTransform: "capitalize" }}>{entry.lure}</span>
          </div>
        </div>
      </div>

      <style>{`
        .pb-card-full {
          position: relative;
          height: 360px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pb-card-full:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border-color: rgba(255,255,255,0.2);
        }
        
        .pb-bg-image {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .pb-bg-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center right; 
        }
        .pb-no-image-bg {
          width: 100%; height: 100%;
          background: #1a1a20;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.1);
        }

        .pb-gradient-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(90deg, 
            rgba(10,10,12,0.95) 0%, 
            rgba(10,10,12,0.85) 35%, 
            rgba(10,10,12,0.4) 65%, 
            rgba(10,10,12,0.0) 100%
          );
        }

        .pb-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 20px;
          justify-content: space-between;
          max-width: 65%;
        }

        .pb-header { display: flex; gap: 8px; }
        .pb-badge {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(4px);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.9);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .pb-main-stat { display: flex; align-items: baseline; gap: 4px; }
        .pb-weight-val { font-size: 2.8rem; font-weight: 800; color: #FBBF24; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .pb-weight-unit { font-size: 1.1rem; font-weight: 600; color: rgba(255,255,255,0.6); }

        .pb-details-grid {
          display: grid;
          grid-template-columns: auto;
          gap: 6px;
        }
        .pb-detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pb-detail-item svg { color: rgba(255,255,255,0.4); flex-shrink: 0; }
      `}</style>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function Insights() {
  const navigate = useNavigate();
  const { isActive } = useMemberStatus(); // PRO CHECK

  // VIEWING STATE
  const [activeView, setActiveView] = useState<ViewMode>("total");
  const [selectedLake, setSelectedLake] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<{
    type: string;
    value: string;
  } | null>(null);

  // MODAL STATES
  const [viewingCatch, setViewingCatch] = useState<CatchEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // UPGRADE MODAL
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const triggerUpgrade = (msg: string) => {
    setUpgradeMessage(msg);
    setShowUpgradeModal(true);
  };

  // Virtual Lake for Uploads
  const virtualActiveLake = useMemo<ActiveLake>(
    () => ({ id: "upload-session", name: "Photo Upload", lat: 0, lng: 0 }),
    [],
  );

  // Use the hook for ALL data fetching.
  const catchLog = useCatchLog(virtualActiveLake, { disableListView: true });

  const {
    entries,
    isLoading,
    updateCatch: hookUpdateCatch,
    deleteCatch: hookDeleteCatch,
  } = catchLog;

  const stats = useMemo(() => calculateStats(entries), [entries]);
  const animatedTotal = useCountUp(stats.totalCount, 2500, 600);

  // --- ACTIONS ---

  const handleDeleteCatch = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this catch? This cannot be undone.",
      )
    )
      return;

    await hookDeleteCatch(id);

    setViewingCatch(null);
    setIsEditing(false);
  };

  const handleUpdateCatch = async (data: Partial<CatchEntry>) => {
    if (viewingCatch?.id) {
      await hookUpdateCatch(viewingCatch.id, data);
      setViewingCatch(null);
      setIsEditing(false);
    }
  };

  const handleUploadClick = () => {
    catchLog.showForm();
  };

  const handleTabClick = (view: ViewMode, label: string) => {
    // GATE: Only "Total" is free
    if (!isActive && view !== "total") {
      triggerUpgrade(
        `Analyze your ${label} and unlock pattern intelligence with Pro.`,
      );
      return;
    }

    setActiveView(view);
    setActiveFilter(null);
  };

  // --- FILTER LOGIC ---

  useMemo(() => {
    if (activeView === "lakes" && !selectedLake && stats.lakes.length > 0) {
      setSelectedLake(stats.lakes[0].name);
    }
  }, [activeView, stats.lakes]);

  const filteredEntries = useMemo(() => {
    if (activeView === "pbs") return []; // PBs handled separately

    let data = [...entries];

    if (activeView === "lakes" && selectedLake) {
      data = data.filter((e) => e.lakeName === selectedLake);
    } else if (activeView === "best_day" && stats.bestDay) {
      data = data.filter((e) => e.caughtAt.startsWith(stats.bestDay!.date));
    }

    if (activeFilter) {
      if (activeFilter.type === "lure") {
        data = data.filter((e) => e.lure === activeFilter.value);
      } else if (activeFilter.type === "tech") {
        const cat = activeFilter.value;
        data = data.filter((e) => {
          const opt = LURE_OPTIONS.find((o) => o.value === e.lure);
          return opt?.category === cat;
        });
      }
    }

    return data.sort(
      (a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime(),
    );
  }, [entries, activeView, selectedLake, activeFilter, stats]);

  const getLakeImage = (lakeName: string) => {
    const lake = stats.lakes.find((l) => l.name === lakeName);
    if (!lake || !MAPBOX_TOKEN) return "";
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lake.lng},${lake.lat},13,0/800x400@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`;
  };

  // 1. "Analyst-Grade" messages focused on Data & Patterns
  const INSIGHT_MESSAGES = [
    "Querying Historical Database...",
    "Correlating Weather Variables...",
    "Detecting Seasonal Trends...",
    "Compiling Performance Metrics...",
    "Analyzing Lure Effectiveness...",
    "Synthesizing Catch Patterns...",
  ];

  // 2. Cycle the text
  const [loadingMsg, setLoadingMsg] = React.useState(INSIGHT_MESSAGES[0]);

  React.useEffect(() => {
    if (!isLoading) return;

    let index = Math.floor(Math.random() * INSIGHT_MESSAGES.length);
    setLoadingMsg(INSIGHT_MESSAGES[index]);

    const interval = setInterval(() => {
      index = (index + 1) % INSIGHT_MESSAGES.length;
      setLoadingMsg(INSIGHT_MESSAGES[index]);
    }, 1800);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (isLoading) {
    return <InsightsLoadingScreen />;
  }

  return (
    <div className="insights-container" style={{ paddingBottom: "80px" }}>

      {/* UPGRADE MODAL */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />

      {/* PILLS */}
      <div className="pills-scroll">
        {[
          { id: "total", label: "Total Logged" },
          { id: "lakes", label: "Productive Lakes" },
          { id: "best_day", label: "Best Day" },
          { id: "pbs", label: "Personal Bests" },
          { id: "confidence", label: "Confidence" },
          { id: "techniques", label: "Techniques" },
        ].map((pill) => {
          const isLocked = !isActive && pill.id !== "total";
          return (
            <button
              key={pill.id}
              onClick={() => handleTabClick(pill.id as ViewMode, pill.label)}
              className={`pill ${activeView === pill.id ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {pill.label}
              {isLocked && <LockIcon size={10} style={{ opacity: 0.7 }} />}
            </button>
          );
        })}
      </div>

      {/* HERO SECTION */}
      <div
        className={`stats-hero ${activeView === "pbs" ? "hero-no-border" : ""}`}
      >
        {/* TOTAL */}
        {activeView === "total" && (
          <div className="hero-center">
            <div className="hero-big-number">{animatedTotal}</div>
            <div className="hero-label">Total Catches Logged</div>
            <div className="hero-upload-section">
              <p className="hero-upload-text">
                Upload photos from your gallery to log past catches
              </p>
              <button className="hero-upload-btn" onClick={handleUploadClick}>
                <UploadImageIcon size={20} />
                <span>Upload Photos</span>
              </button>
            </div>
          </div>
        )}

        {/* LAKES */}
        {activeView === "lakes" && (
          <div className="hero-split">
            <div className="hero-list">
              {stats.lakes.map((lake) => (
                <button
                  key={lake.name}
                  className={`hero-list-item ${selectedLake === lake.name ? "active" : ""}`}
                  onClick={() => {
                    setSelectedLake(lake.name);
                    setActiveFilter(null);
                  }}
                >
                  <span className="lake-name">{lake.name}</span>
                  <span className="lake-count">{lake.count}</span>
                </button>
              ))}
            </div>
            <div className="hero-card">
              {selectedLake && MAPBOX_TOKEN && (
                <div
                  className="card-map-bg"
                  style={{
                    backgroundImage: `url(${getLakeImage(selectedLake)})`,
                  }}
                />
              )}
              <div className="card-overlay" />
              <div className="card-content">
                <h2>{selectedLake}</h2>
                <div className="card-stat-row">
                  <FishIcon size={14} />
                  <span>
                    {stats.lakes.find((l) => l.name === selectedLake)?.count ||
                      0}{" "}
                    Catches
                  </span>
                </div>
                <div className="card-lures">
                  <span className="card-label">Top Producers</span>
                  <div className="lure-chips">
                    {stats.lakes
                      .find((l) => l.name === selectedLake)
                      ?.topLures.map((lure) => (
                        <button
                          key={lure}
                          className={`lure-chip ${activeFilter?.value === lure ? "active" : ""}`}
                          onClick={() => {
                            setActiveFilter(
                              activeFilter?.value === lure
                                ? null
                                : { type: "lure", value: lure },
                            );
                          }}
                        >
                          {capitalize(lure)}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL BESTS (VERTICAL STACK) */}
        {activeView === "pbs" && (
          <div className="hero-pbs-list">
            {["largemouth", "smallmouth", "spotted"].map((species) => {
              const record = stats.pbs[species];
              if (record) {
                return (
                  <FullPBCard
                    key={species}
                    entry={record}
                    onClick={() => setViewingCatch(record)}
                  />
                );
              } else {
                // Capitalize for display
                const label =
                  species.charAt(0).toUpperCase() + species.slice(1) + " Bass";
                return <EmptyPBCard key={species} species={label} />;
              }
            })}
          </div>
        )}

        {/* BEST DAY */}
        {activeView === "best_day" && stats.bestDay && (
          <div className="hero-single-card">
            <div className="best-day-header">
              <CalendarIcon size={20} className="accent-icon" />
              <span>Most Productive Day</span>
            </div>
            <div className="best-day-date">{stats.bestDay.displayDate}</div>
            <div className="best-day-stats">
              <div className="stat-block">
                <span className="val">{stats.bestDay.count}</span>
                <span className="lbl">Fish</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-block">
                <span className="val">{stats.bestDay.weight.toFixed(1)}</span>
                <span className="lbl">Lbs</span>
              </div>
            </div>
            <div className="best-day-lures">
              {stats.bestDay.lures.map((lure) => (
                <button
                  key={lure}
                  className={`lure-text-btn ${activeFilter?.value === lure ? "active" : ""}`}
                  onClick={() =>
                    setActiveFilter(
                      activeFilter?.value === lure
                        ? null
                        : { type: "lure", value: lure },
                    )
                  }
                >
                  {capitalize(lure)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONFIDENCE / TECHNIQUES */}
        {(activeView === "confidence" || activeView === "techniques") && (
          <div className="hero-chart-area">
            {(activeView === "confidence"
              ? stats.topLures
              : stats.topTechniques
            ).map((item, i) => {
              const label = "lure" in item ? item.lure : item.category;
              const type = activeView === "confidence" ? "lure" : "tech";
              const percent = (item.count / stats.totalCount) * 100;
              return (
                <button
                  key={label}
                  className={`chart-bar-row ${activeFilter?.value === label ? "active" : ""}`}
                  onClick={() =>
                    setActiveFilter(
                      activeFilter?.value === label
                        ? null
                        : { type, value: label },
                    )
                  }
                >
                  <div className="bar-label">
                    <span>
                      {i + 1}. {label}
                    </span>
                    <span className="bar-count">{item.count}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* PHOTO WALL (Hidden for PBs) */}
      {activeView !== "pbs" && (
        <div className="photo-wall">
          <div className="wall-header">
            <span className="wall-count">{filteredEntries.length} Catches</span>
            {activeFilter && (
              <button
                className="clear-filter-btn"
                onClick={() => setActiveFilter(null)}
              >
                <span>Filtered by {activeFilter.value}</span>
                <XIcon size={14} />
              </button>
            )}
          </div>
          <div className="wall-grid">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="wall-item"
                onClick={() => setViewingCatch(entry)}
              >
                {entry.photoUrl || entry.imageData ? (
                  <img
                    src={entry.photoUrl || entry.imageData}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="wall-placeholder">
                    <FishIcon size={20} />
                  </div>
                )}
                <div className="wall-overlay">
                  <span className="wall-date">
                    {new Date(entry.caughtAt).toLocaleDateString(undefined, {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                  {entry.weight && (
                    <span className="wall-weight">{entry.weight}lb</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filteredEntries.length === 0 && (
            <div className="wall-empty">
              <p>No catches found for this filter.</p>
              {activeFilter && (
                <button
                  className="wall-empty-clear"
                  onClick={() => setActiveFilter(null)}
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD MODAL */}
      <CatchLogModal
        {...catchLog}
        disableListView={true}
        galleryOnly={true}
        onDraftDone={() => {
          catchLog.close();
          // NO NEED TO RELOAD - Hook handles it
        }}
      />

      {/* EDIT / VIEW MODAL */}
      {viewingCatch && (
        <div
          className="stats-modal-overlay"
          onClick={() => {
            setViewingCatch(null);
            setIsEditing(false);
          }}
        >
          <div
            className="stats-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {isEditing ? (
              <CatchFormView
                entry={viewingCatch}
                isEditing={true}
                activeLake={virtualActiveLake} // We use virtual context for edits from insights
                onSave={handleUpdateCatch}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <CatchDetailView
                entry={viewingCatch}
                allEntries={entries}
                onBack={() => setViewingCatch(null)}
                onEdit={() => setIsEditing(true)}
                onDelete={() => handleDeleteCatch(viewingCatch.id)}
                readOnly={false}
                onFlyToLocation={(lat, lng) => {
                  navigate(
                    `/members?lat=${lat}&lng=${lng}&lake=${encodeURIComponent(viewingCatch.lakeName)}`,
                  );
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .stats-page { background: #0a0a0a; min-height: 100vh; color: white; padding-bottom: 40px; }
        .insights-container { padding: 20px; max-width: 600px; margin: 0 auto; }
        .stats-header { padding: 12px; display: flex; align-items: center; gap: 16px; }
        .stats-header h1 { margin: 0; font-size: 1rem; font-weight: 600; }
        .back-icon-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .pills-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 0 20px 20px; scrollbar-width: none; }
        .pills-scroll::-webkit-scrollbar { display: none; }
        .pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .pill.active { background: #fff; color: #000; border-color: #fff; font-weight: 700; }

        .stats-hero { min-height: 200px; margin: 0 20px 30px; background: rgba(20,20,25,0.5); border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; position: relative; }
        .hero-no-border { border: none; background: transparent; margin: 0 20px 10px; }

        .hero-center { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 40px 36px; text-align: center; }
        .hero-big-number { font-size: 5rem; font-weight: 800; background: linear-gradient(135deg, #fff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
        .hero-label { font-size: 0.9rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 12px; }

        .hero-upload-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; align-items: center; gap: 14px; width: 100%; }
        .hero-upload-text { margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.5); text-align: center; line-height: 1.4; }
        .hero-upload-btn { display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); border: none; border-radius: 14px; color: #fff; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3); }
        .hero-upload-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4); }

        .hero-split { display: flex; height: 280px; }
        .hero-list { width: 35%; border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; display: flex; flex-direction: column; background: rgba(0,0,0,0.2); }
        .hero-list-item { padding: 16px; text-align: left; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
        .hero-list-item.active { background: rgba(74, 144, 226, 0.1); color: #fff; border-right: 2px solid #4A90E2; }
        .lake-name { font-weight: 600; font-size: 0.9rem; }
        .lake-count { font-size: 0.75rem; opacity: 0.7; }
        
        .hero-card { flex: 1; position: relative; padding: 20px; display: flex; flex-direction: column; justify-content: flex-end; }
        .card-map-bg { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; filter: grayscale(20%) brightness(0.7); }
        .card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 100%); z-index: 1; }
        .card-content { position: relative; z-index: 2; }
        .card-content h2 { margin: 0 0 8px; font-size: 1.6rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .card-stat-row { display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: #4A90E2; margin-bottom: 16px; font-weight: 600; }
        .card-lures { display: flex; flex-direction: column; gap: 8px; }
        .card-label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.7; font-weight: 700; color: #fff; }
        .lure-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .lure-chip { background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.9); padding: 6px 12px; border-radius: 12px; font-size: 0.75rem; cursor: pointer; backdrop-filter: blur(4px); }
        .lure-chip.active { background: #4A90E2; border-color: #4A90E2; color: #fff; }

        .hero-pbs-list { display: flex; flex-direction: column; gap: 24px; width: 100%; }
        .pb-row-card { background: rgba(20, 20, 28, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; }
        .pb-row-info { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .pb-row-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
        .pb-species-badge { background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.8); }
        .pb-weight-large { font-size: 2rem; font-weight: 800; color: #FBBF24; line-height: 1; }
        .pb-weight-large .unit { font-size: 1rem; color: rgba(255,255,255,0.5); font-weight: 500; }
        .pb-row-meta { display: flex; gap: 16px; color: rgba(255,255,255,0.6); font-size: 0.9rem; }
        .pb-meta-item { display: flex; align-items: center; gap: 6px; }
        .pb-row-lure { font-size: 0.95rem; color: #fff; font-weight: 500; }
        .lure-label { color: rgba(255,255,255,0.4); margin-right: 6px; font-weight: 400; }
        .pb-row-image { width: 100%; height: 280px; background: rgba(0,0,0,0.3); position: relative; }
        .pb-row-image img { width: 100%; height: 100%; object-fit: cover; }
        .pb-placeholder { display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.2); }
        .pb-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); width: 100%; }

        .hero-single-card { padding: 30px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .best-day-header { display: flex; align-items: center; gap: 8px; color: #FBBF24; font-weight: 700; font-size: 0.9rem; margin-bottom: 12px; }
        .best-day-date { font-size: 1.8rem; font-weight: 700; margin-bottom: 20px; }
        .best-day-stats { display: flex; gap: 30px; margin-bottom: 20px; }
        .stat-block { display: flex; flex-direction: column; }
        .stat-block .val { font-size: 1.5rem; font-weight: 700; }
        .stat-block .lbl { font-size: 0.8rem; opacity: 0.5; }
        .stat-divider { width: 1px; background: rgba(255,255,255,0.2); }
        .best-day-lures { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
        .lure-text-btn { font-size: 0.85rem; color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08); padding: 6px 12px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; }
        .lure-text-btn:hover { background: rgba(255,255,255,0.15); }
        .lure-text-btn.active { background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.5); color: #FBBF24; }

        .hero-chart-area { padding: 20px; display: flex; flex-direction: column; gap: 12px; max-height: 280px; overflow-y: auto; }
        .chart-bar-row { display: flex; flex-direction: column; gap: 4px; background: transparent; border: none; cursor: pointer; width: 100%; text-transform: capitalize}
        .bar-label { display: flex; justify-content: space-between; font-size: 0.85rem; color: rgba(255,255,255,0.8); width: 100%; }
        .bar-track { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; background: #4A90E2; border-radius: 3px; transition: width 0.5s ease; }
        .chart-bar-row.active .bar-fill { background: #fff; }
        .chart-bar-row.active .bar-label { color: #fff; font-weight: 700; }

        .photo-wall { padding: 0 20px; }
        .wall-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; min-height: 28px; }
        .wall-count { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
        .clear-filter-btn { display: flex; align-items: center; gap: 8px; background: rgba(74, 144, 226, 0.15); color: #4A90E2; border: 1px solid rgba(74, 144, 226, 0.3); padding: 6px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
        .wall-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .wall-item { aspect-ratio: 1; position: relative; cursor: pointer; background: rgba(255,255,255,0.05); }
        .wall-item img { width: 100%; height: 100%; object-fit: cover; }
        .wall-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.2); }
        .wall-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 6px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; justify-content: space-between; align-items: flex-end; }
        .wall-date { font-size: 0.65rem; color: rgba(255,255,255,0.8); }
        .wall-weight { font-size: 0.7rem; font-weight: 700; color: #fff; }
        .wall-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); grid-column: span 3; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .wall-empty-clear { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; }

        .stats-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .stats-modal-content { width: 100%; max-width: 360px; max-height: 86vh; background: rgba(20,20,25,0.95); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
