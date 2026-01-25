// src/pages/Stats.tsx

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowLeftIcon,
  TrophyIcon,
  CalendarIcon,
  FishIcon,
  XIcon,
  MapPinIcon,
  LayersIcon, // Using as generic icon for Lure/Technique if needed
} from "@/components/UnifiedIcons";

import {
  useCatchLog,
  CatchEntry,
  LURE_OPTIONS,
  CatchDetailView,
  apiRecordToEntry,
} from "@/components/CatchLog";
import { listCatches } from "@/lib/catches-api";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// =============================================================================
// HELPER: CountUp Animation Hook (3s Duration)
// =============================================================================
function useCountUp(end: number, duration: number = 3000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;

      // EaseOutQuart for smooth landing
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

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// =============================================================================
// TYPES & CALCULATIONS
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
  pbs: CatchEntry[]; // Array of PB entries
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
      pbs: [],
      bestDay: null,
      topTechniques: [],
      topLures: [],
    };
  }

  // 1. Lakes (Grouped & Sorted)
  // We capture lat/lng from the first occurrence to generate the map image later
  const lakeMap: Record<
    string,
    { count: number; lat: number; lng: number; lures: Record<string, number> }
  > = {};

  entries.forEach((e) => {
    if (!lakeMap[e.lakeName]) {
      lakeMap[e.lakeName] = {
        count: 0,
        lat: e.lakeLat || e.catchLat,
        lng: e.lakeLng || e.catchLng,
        lures: {},
      };
    }
    lakeMap[e.lakeName].count++;
    lakeMap[e.lakeName].lures[e.lure] =
      (lakeMap[e.lakeName].lures[e.lure] || 0) + 1;
  });

  const lakes = Object.entries(lakeMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      lat: data.lat,
      lng: data.lng,
      topLures: Object.entries(data.lures)
        .sort((a, b) => b[1] - a[1]) // Sort lures by freq
        .slice(0, 3)
        .map((l) => l[0]),
    }))
    .sort((a, b) => b.count - a.count);

  // 2. Best Day
  const dayMap: Record<
    string,
    { weight: number; count: number; lures: Set<string> }
  > = {};
  entries.forEach((e) => {
    const date = e.caughtAt.split("T")[0];
    if (!dayMap[date]) dayMap[date] = { weight: 0, count: 0, lures: new Set() };
    dayMap[date].weight += e.weight || 0;
    dayMap[date].count++;
    dayMap[date].lures.add(e.lure);
  });

  const bestDateKey = Object.keys(dayMap).reduce((a, b) => {
    if (dayMap[a].weight === dayMap[b].weight)
      return dayMap[a].count > dayMap[b].count ? a : b;
    return dayMap[a].weight > dayMap[b].weight ? a : b;
  });

  // 3. PBs (One per species) - default to largemouth if no species set
  const pbMap: Record<string, CatchEntry> = {};
  entries.forEach((e) => {
    if (!e.weight) return; // Skip entries without weight
    const species = e.species || "largemouth"; // Default to largemouth
    if (
      !pbMap[species] ||
      Number(e.weight) > Number(pbMap[species].weight || 0)
    ) {
      pbMap[species] = e;
    }
  });
  const pbs = Object.values(pbMap).sort(
    (a, b) => Number(b.weight || 0) - Number(a.weight || 0),
  );

  // 4. Tech & Lures
  const techMap: Record<string, number> = {};
  const lureMap: Record<string, number> = {};

  entries.forEach((e) => {
    lureMap[e.lure] = (lureMap[e.lure] || 0) + 1;
    const opt = LURE_OPTIONS.find((o) => o.value === e.lure);
    const cat = opt?.category || "Other";
    techMap[cat] = (techMap[cat] || 0) + 1;
  });

  return {
    totalCount: entries.length,
    lakes,
    pbs,
    bestDay: {
      date: bestDateKey,
      ...dayMap[bestDateKey],
      lures: Array.from(dayMap[bestDateKey].lures),
      displayDate: new Date(bestDateKey).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    },
    topTechniques: Object.entries(techMap)
      .map(([c, n]) => ({ category: c, count: n }))
      .sort((a, b) => b.count - a.count),
    topLures: Object.entries(lureMap)
      .map(([l, n]) => ({ lure: l, count: n }))
      .sort((a, b) => b.count - a.count),
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function Insights() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<CatchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch up to 500 catches for stats
        const response = await listCatches(token, 500, 0);

        if (mounted) {
          const converted = response.catches.map(apiRecordToEntry);
          setEntries(converted);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load insights:", err);
        if (mounted) setIsLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [getToken]);

  const stats = useMemo(() => calculateStats(entries), [entries]);

  // View State
  const [activeView, setActiveView] = useState<ViewMode>("total");
  const [selectedLake, setSelectedLake] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<{
    type: string;
    value: string;
  } | null>(null);
  const [viewingCatch, setViewingCatch] = useState<CatchEntry | null>(null);

  // Animation State (3 seconds)
  const animatedTotal = useCountUp(stats.totalCount, 3000);

  // Set default lake when switching to lake view
  useMemo(() => {
    if (activeView === "lakes" && !selectedLake && stats.lakes.length > 0) {
      setSelectedLake(stats.lakes[0].name);
    }
  }, [activeView, stats.lakes]);

  // --- FILTER ENGINE ---
  const filteredEntries = useMemo(() => {
    // If PBs are active, we hide the photo wall entirely (as PBs are shown in hero)
    if (activeView === "pbs") return [];

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

  // --- HELPER: Get Mapbox Image URL ---
  const getLakeImage = (lakeName: string) => {
    const lake = stats.lakes.find((l) => l.name === lakeName);
    if (!lake || !MAPBOX_TOKEN) return "";
    // Using static API with 800x400 size, zoom 13
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lake.lng},${lake.lat},13,0/800x400@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`;
  };

  const handlePillChange = (view: ViewMode) => {
    setActiveView(view);
    setActiveFilter(null);
  };

  const toggleFilter = (type: string, value: string) => {
    if (activeFilter?.value === value) {
      setActiveFilter(null);
    } else {
      setActiveFilter({ type, value });
    }
  };

  const formatLureName = (value: string) => {
    return value
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          color: "rgba(255,255,255,0.5)",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading catch history...
      </div>
    );
  }

  return (
    <div className="stats-page">
      <div className="stats-header">
        <button onClick={() => navigate("/members")} className="back-icon-btn">
          <ArrowLeftIcon size={24} />
        </button>
        <h1>Back to Map</h1>
      </div>

      {/* PILLS */}
      <div className="pills-scroll">
        {[
          { id: "total", label: "Total Logged" },
          { id: "lakes", label: "Productive Lakes" },
          { id: "best_day", label: "Best Day" },
          { id: "pbs", label: "Personal Bests" },
          { id: "confidence", label: "Confidence" },
          { id: "techniques", label: "Techniques" },
        ].map((pill) => (
          <button
            key={pill.id}
            onClick={() => handlePillChange(pill.id as ViewMode)}
            className={`pill ${activeView === pill.id ? "active" : ""}`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* HERO SECTION */}
      <div
        className={`stats-hero ${activeView === "pbs" ? "hero-no-border" : ""}`}
      >
        {/* TOTAL (Animated Counter) */}
        {activeView === "total" && (
          <div className="hero-center">
            <div className="hero-big-number">{animatedTotal}</div>
            <div className="hero-label">Total Catches Logged</div>
          </div>
        )}

        {/* LAKES (Split View with Satellite Map) */}
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
              {/* SATELLITE BACKGROUND */}
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
                          onClick={() => toggleFilter("lure", lure)}
                        >
                          {lure}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL BESTS (ROW FORMAT) */}
        {activeView === "pbs" && (
          <div className="hero-pbs-list">
            {stats.pbs.length === 0 ? (
              <div className="pb-empty">No personal bests recorded yet.</div>
            ) : (
              stats.pbs.map((pb) => (
                <div
                  key={pb.id}
                  className="pb-row-card"
                  onClick={() => setViewingCatch(pb)}
                >
                  {/* Top Info Section */}
                  <div className="pb-row-info">
                    <div className="pb-row-header">
                      <span className="pb-species-badge">
                        {pb.species || "Bass"}
                      </span>
                      <span className="pb-weight-large">
                        {pb.weight} <span className="unit">lbs</span>
                      </span>
                    </div>

                    <div className="pb-row-meta">
                      <div className="pb-meta-item">
                        <CalendarIcon size={14} />
                        <span>
                          {new Date(pb.caughtAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="pb-meta-item">
                        <MapPinIcon size={14} />
                        <span>{pb.lakeName}</span>
                      </div>
                    </div>

                    <div className="pb-row-lure">
                      <span className="lure-label">Lure:</span>{" "}
                      {formatLureName(pb.lure)}
                    </div>
                  </div>

                  {/* Bottom Image Section */}
                  <div className="pb-row-image">
                    {pb.photoUrl || pb.imageData ? (
                      <img src={pb.photoUrl || pb.imageData} alt="PB" />
                    ) : (
                      <div className="pb-placeholder">
                        <TrophyIcon size={40} />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
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
                  onClick={() => toggleFilter("lure", lure)}
                >
                  {lure}
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
                  onClick={() => toggleFilter(type, label)}
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
                    loading="lazy"
                    alt=""
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

      {/* MODAL */}
      {viewingCatch && (
        <div
          className="stats-modal-overlay"
          onClick={() => setViewingCatch(null)}
        >
          <div
            className="stats-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <CatchDetailView
              entry={viewingCatch}
              allEntries={entries}
              onBack={() => setViewingCatch(null)}
              onEdit={() => {}}
              onDelete={() => {}}
              readOnly={true}
              onFlyToLocation={(lat, lng) => {
                navigate(
                  `/members?lat=${lat}&lng=${lng}&lake=${encodeURIComponent(viewingCatch.lakeName)}`,
                );
              }}
            />
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .stats-page { background: #0a0a0a; min-height: 100vh; color: white; padding-bottom: 40px; }
        .stats-header { padding: 20px; display: flex; align-items: center; gap: 16px; }
        .stats-header h1 { margin: 0; font-size: 1.2rem; font-weight: 700; }
        .back-icon-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        /* PILLS */
        .pills-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 0 20px 20px; scrollbar-width: none; }
        .pills-scroll::-webkit-scrollbar { display: none; }
        .pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .pill.active { background: #fff; color: #000; border-color: #fff; font-weight: 700; }

        /* HERO COMMON */
        .stats-hero { min-height: 200px; margin: 0 20px 30px; background: rgba(20,20,25,0.5); border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; position: relative; }
        .hero-no-border { border: none; background: transparent; margin: 0 20px 10px; }

        /* TOTAL VIEW (ANIMATED) */
        .hero-center { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; text-align: center; }
        .hero-big-number { font-size: 5rem; font-weight: 800; background: linear-gradient(135deg, #fff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
        .hero-label { font-size: 0.9rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 12px; }

        /* LAKES SPLIT VIEW */
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

        /* PB ROWS (MOBILE FIRST) */
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
        
        /* UPDATED: Height to 280px */
        .pb-row-image { width: 100%; height: 280px; background: rgba(0,0,0,0.3); position: relative; }
        .pb-row-image img { width: 100%; height: 100%; object-fit: cover; }
        .pb-placeholder { display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.2); }

        .pb-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); width: 100%; }

        /* BEST DAY */
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

        /* CHART */
        .hero-chart-area { padding: 20px; display: flex; flex-direction: column; gap: 12px; max-height: 280px; overflow-y: auto; }
        .chart-bar-row { display: flex; flex-direction: column; gap: 4px; background: transparent; border: none; cursor: pointer; width: 100%; text-transform: capitalize}
        .bar-label { display: flex; justify-content: space-between; font-size: 0.85rem; color: rgba(255,255,255,0.8); width: 100%;  textTransform: capitalize; }
        .bar-track { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; background: #4A90E2; border-radius: 3px; transition: width 0.5s ease; }
        .chart-bar-row.active .bar-fill { background: #fff; }
        .chart-bar-row.active .bar-label { color: #fff; font-weight: 700; }

        /* PHOTO WALL */
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

        /* MODAL */
        .stats-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .stats-modal-content { width: 100%; max-width: 380px; max-height: 86vh; background: rgba(20,20,25,0.95); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
