// src/pages/LureLibrary.tsx

import React, { useState, useMemo } from "react";
import { LURES_ARRAY, FILTER_OPTIONS, type LureData } from "@/data/lures";
import { ArrowLeftIcon, XIcon } from "@/components/UnifiedIcons";

// =============================================================================
// GEAR SPECS (from plan_enrichment.py)
// =============================================================================

const GEAR_SPECS: Record<string, { rod: string; reel: string; line: string; note: string }> = {
  "shallow crankbait": {
    rod: '7\'0" Medium, Moderate-Fast (Glass/Composite)',
    reel: "6.3:1 - 7.1:1 Baitcaster",
    line: "12-15lb Fluorocarbon",
    note: "Moderate action prevents tearing hooks out during deflection."
  },
  "mid crankbait": {
    rod: '7\'2" Medium-Heavy, Moderate (Glass/Composite)',
    reel: "6.3:1 Baitcaster",
    line: "10-12lb Fluorocarbon",
    note: "Lighter line helps the bait dive deeper."
  },
  "deep crankbait": {
    rod: '7\'6" - 7\'10" Medium-Heavy, Moderate',
    reel: "5.4:1 - 6.3:1 Baitcaster",
    line: "10-12lb Fluorocarbon",
    note: "Long rod required for casting distance to achieve max depth."
  },
  "lipless crankbait": {
    rod: '7\'0" - 7\'3" Medium-Heavy, Moderate-Fast',
    reel: "7.1:1 - 7.5:1 Baitcaster",
    line: "15-17lb Fluorocarbon or 30lb Braid",
    note: "Need enough tip to rip it free from grass, but give for trebles."
  },
  "flat-sided crankbait": {
    rod: '7\'0" Medium, Moderate',
    reel: "6.3:1 Baitcaster",
    line: "10-12lb Fluorocarbon",
    note: "Light line essential for cold water action."
  },
  "jerkbait": {
    rod: '6\'10" - 7\'0" Medium, Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "10-12lb Fluorocarbon",
    note: "Shorter rod prevents hitting water during downward snaps."
  },
  "chatterbait": {
    rod: '7\'2" - 7\'4" Medium-Heavy, Moderate-Fast (Glass Hybrid)',
    reel: "6.3:1 - 7.1:1 Baitcaster",
    line: "15-17lb Fluorocarbon",
    note: "Delay the hookset; let the rod load up before swinging."
  },
  "spinnerbait": {
    rod: '7\'0" - 7\'3" Medium-Heavy, Fast',
    reel: "7.1:1 Baitcaster",
    line: "15-17lb Fluorocarbon",
    note: "Fast action needed to drive single hook home at distance."
  },
  "swim jig": {
    rod: '7\'2" Medium-Heavy, Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "30-50lb Braid or 17-20lb Fluorocarbon",
    note: "Braid helps cut through vegetation stems on the hookset."
  },
  "underspin": {
    rod: '7\'0" Medium, Fast',
    reel: "7.1:1 Baitcaster or 2500 Spinning",
    line: "12lb Fluorocarbon",
    note: "Lighter tip ensures you don't pull the bait away on light bites."
  },
  "paddle tail swimbait": {
    rod: '7\'3" Medium-Heavy, Fast',
    reel: "6.3:1 - 7.1:1 Baitcaster",
    line: "15lb Fluorocarbon",
    note: "Steady retrieve; rod should have backbone for the hookset."
  },
  "blade bait": {
    rod: '7\'0" Medium, Fast (Spinning or Casting)',
    reel: "High Speed",
    line: "12-15lb Fluorocarbon or 20lb Braid",
    note: "Short snaps; heavier line prevents fouling on the fall."
  },
  "jighead minnow": {
    rod: '6\'10" - 7\'2" Medium-Light, Extra Fast (Spinning)',
    reel: "2500-3000 Spinning",
    line: "8-10lb Braid to 6-8lb Fluoro Leader",
    note: "Visual fishing; sensitivity is paramount."
  },
  "football jig": {
    rod: '7\'3" - 7\'6" Heavy, Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "15-20lb Fluorocarbon",
    note: "Long rod moves more line on the sweep set in deep water."
  },
  "casting jig": {
    rod: '7\'2" - 7\'4" Heavy, Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "17-20lb Fluorocarbon",
    note: "Heavy power required to extract fish from wood/docks."
  },
  "texas rig": {
    rod: '7\'0" - 7\'3" Medium-Heavy, Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "15-17lb Fluorocarbon",
    note: "The 'do-everything' setup."
  },
  "carolina rig": {
    rod: '7\'6" Heavy, Moderate-Fast',
    reel: "7.1:1 Baitcaster",
    line: "Main: 20lb / Leader: 12-15lb Fluorocarbon",
    note: "Long rod sweeps line to set hook past the heavy weight."
  },
  "shaky head": {
    rod: '7\'0" Medium, Fast (Spinning)',
    reel: "2500-3000 Spinning",
    line: "10-15lb Braid to 8-10lb Fluoro Leader",
    note: "Spinning gear allows better skip-casting into docks."
  },
  "ned rig": {
    rod: '6\'10" - 7\'0" Medium-Light, Extra Fast (Spinning)',
    reel: "2500 Spinning",
    line: "8-10lb Braid to 6lb Fluoro Leader",
    note: "Extra fast tip helps sense the 'mushy' pressure bite."
  },
  "dropshot": {
    rod: '6\'10" - 7\'2" Medium-Light, Extra Fast (Spinning)',
    reel: "2500 Spinning",
    line: "10lb Braid to 6-8lb Fluoro Leader",
    note: "Softer tip prevents fish from feeling resistance on the inhale."
  },
  "neko rig": {
    rod: '7\'0" - 7\'2" Medium, Fast (Spinning)',
    reel: "2500-3000 Spinning",
    line: "10-15lb Braid to 8-10lb Fluoro Leader",
    note: "Need slightly more backbone than a dropshot rod for the hookset."
  },
  "wacky rig": {
    rod: '6\'10" - 7\'0" Medium, Fast (Spinning)',
    reel: "2500 Spinning",
    line: "10-15lb Braid to 10lb Fluoro Leader",
    note: "Short rod improves skipping accuracy under docks."
  },
  "soft jerkbait": {
    rod: '7\'0" Medium, Fast (Spinning or Casting)',
    reel: "High Speed",
    line: "10-15lb Braid (Spin) or 12lb Fluoro (Cast)",
    note: "Work it quickly; high speed reel picks up slack after twitches."
  },
  "hollow body frog": {
    rod: '7\'3" - 7\'6" Heavy, Extra Fast',
    reel: "8.1:1 Baitcaster",
    line: "50-65lb Braid (Direct)",
    note: "Zero stretch essential for driving hooks and extracting from mats."
  },
  "popping frog": {
    rod: '7\'0" - 7\'3" Heavy, Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "40-50lb Braid",
    note: "Slightly shorter rod helps with 'walking' cadence."
  },
  "walking bait": {
    rod: '7\'0" - 7\'2" Medium-Heavy, Moderate-Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "30lb Braid (with mono leader) or 15lb Monofilament",
    note: "Mono/Braid floats; Fluoro sinks and kills the action."
  },
  "whopper plopper": {
    rod: '7\'3" - 7\'6" Medium-Heavy, Moderate-Fast',
    reel: "7.1:1 Baitcaster",
    line: "40-50lb Braid or 17lb Monofilament",
    note: "Parabolic flex prevents tearing hooks out on the strike."
  },
  "buzzbait": {
    rod: '7\'0" - 7\'3" Medium-Heavy, Fast',
    reel: "7.1:1 - 8.1:1 Baitcaster",
    line: "40-50lb Braid or 17lb Monofilament",
    note: "High speed reel essential to get bait on plane instantly."
  },
  "popper": {
    rod: '6\'8" - 7\'0" Medium, Fast',
    reel: "7.1:1 Baitcaster",
    line: "12-15lb Monofilament",
    note: "Short rod improves target accuracy; mono keeps nose up."
  },
  "wake bait": {
    rod: '7\'0" Medium-Heavy, Moderate-Fast',
    reel: "6.3:1 Baitcaster",
    line: "15-17lb Monofilament or Braid",
    note: "Slower reel prevents overworking the wake action."
  }
};

// Helper to get gear for a lure ID
function getGearForLure(lureId: string) {
  // Convert underscore ID to space-separated key (e.g., "shallow_crankbait" -> "shallow crankbait")
  const key = lureId.replace(/_/g, " ").replace("sided", "-sided"); // Handle "flat_sided" -> "flat-sided"
  return GEAR_SPECS[key] || null;
}

// =============================================================================
// FILTER STATE TYPE
// =============================================================================

type FilterState = {
  season: string[];
  clarity: string[];
  conditions: string[];
  cover: string[];
  finesse: boolean | null;
};

const EMPTY_FILTERS: FilterState = {
  season: [],
  clarity: [],
  conditions: [],
  cover: [],
  finesse: null,
};

// =============================================================================
// LURE CARD COMPONENT
// =============================================================================

function LureCard({
  lure,
  onClick,
}: {
  lure: LureData;
  onClick: () => void;
}) {
  return (
    <div className="lure-card" onClick={onClick}>
      <div className="lure-card-image">
        <img src={lure.image} alt={lure.display_name} loading="lazy" />
      </div>
      <div className="lure-card-info">
        <div className="lure-card-name">{lure.display_name}</div>
        <div className="lure-card-category">{lure.primary_category}</div>
      </div>
    </div>
  );
}

// =============================================================================
// LURE DETAIL MODAL
// =============================================================================

function LureDetailModal({
  lure,
  onClose,
  onTagClick,
}: {
  lure: LureData;
  onClose: () => void;
  onTagClick: (group: "season" | "clarity" | "conditions" | "cover" | "finesse", value: string) => void;
}) {
  return (
    <div className="lure-modal-overlay" onClick={onClose}>
      <div className="lure-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="lure-modal-header-bar">
          <button className="lure-modal-back" onClick={onClose}>
            <ArrowLeftIcon size={20} />
            <span>Back to Lure Library</span>
          </button>
        </div>

        <div className="lure-modal-image">
          <img src={lure.image} alt={lure.display_name} />
        </div>

        <div className="lure-modal-header">
          <h2>{lure.display_name}</h2>
          <span className="lure-modal-category">{lure.primary_category}</span>
        </div>

        <p className="lure-modal-description">{lure.description}</p>

        {/* Gear Recommendations */}
        {(() => {
          const gear = getGearForLure(lure.id);
          if (!gear) return null;
          return (
            <div className="lure-modal-gear">
              <div className="lure-modal-gear-header">Gear Recommendations</div>
              <div className="lure-modal-gear-grid">
                <div className="gear-item">
                  <span className="gear-label">Rod</span>
                  <span className="gear-value">{gear.rod}</span>
                </div>
                <div className="gear-item">
                  <span className="gear-label">Reel</span>
                  <span className="gear-value">{gear.reel}</span>
                </div>
                <div className="gear-item">
                  <span className="gear-label">Line</span>
                  <span className="gear-value">{gear.line}</span>
                </div>
              </div>
              <div className="gear-note">{gear.note}</div>
            </div>
          );
        })()}

        <div className="lure-modal-tags">
          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Season</span>
            <div className="lure-modal-tag-pills">
              {lure.season_affinity.map((s) => (
                <button key={s} className="lure-tag season clickable" onClick={() => onTagClick("season", s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Water Clarity</span>
            <div className="lure-modal-tag-pills">
              {lure.water_clarity.map((c) => (
                <button key={c} className="lure-tag clarity clickable" onClick={() => onTagClick("clarity", c)}>{c}</button>
              ))}
            </div>
          </div>

          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Conditions</span>
            <div className="lure-modal-tag-pills">
              {lure.conditions.map((c) => (
                <button key={c} className="lure-tag conditions clickable" onClick={() => onTagClick("conditions", c)}>{c}</button>
              ))}
            </div>
          </div>

          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Cover</span>
            <div className="lure-modal-tag-pills">
              {lure.cover_type.map((c) => (
                <button key={c} className="lure-tag cover clickable" onClick={() => onTagClick("cover", c)}>{c}</button>
              ))}
            </div>
          </div>

  {lure.finesse && (
          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Style</span>
            <div className="lure-modal-tag-pills">
              <button className="lure-tag finesse clickable" onClick={() => onTagClick("finesse", "true")}>Finesse</button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FILTER PILL COMPONENT
// =============================================================================

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`filter-pill ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LureLibrary() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selectedLure, setSelectedLure] = useState<LureData | null>(null);

  // Toggle a filter value
  const toggleFilter = (group: keyof FilterState, value: string) => {
    if (group === "finesse") return; // Use toggleFinesse instead
    setFilters((prev) => {
      const current = prev[group] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: updated };
    });
  };

  // Toggle finesse filter
  const toggleFinesse = (value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      finesse: prev.finesse === value ? null : value,
    }));
  };

  // Remove a specific filter
  const removeFilter = (group: keyof FilterState, value: string) => {
    if (group === "finesse") {
      setFilters((prev) => ({ ...prev, finesse: null }));
      return;
    }
    setFilters((prev) => ({
      ...prev,
      [group]: (prev[group] as string[]).filter((v) => v !== value),
    }));
  };

  // Clear all filters
  const clearAllFilters = () => setFilters(EMPTY_FILTERS);

  // Get all active filters as flat array for display
  const activeFilters = useMemo(() => {
    const result: { group: keyof FilterState; value: string }[] = [];
    (["season", "clarity", "conditions", "cover"] as const).forEach((group) => {
      filters[group].forEach((value) => {
        result.push({ group, value });
      });
    });
    if (filters.finesse !== null) {
      result.push({ group: "finesse", value: filters.finesse ? "Finesse" : "Power" });
    }
    return result;
  }, [filters]);

  // Filter lures based on active filters
  const filteredLures = useMemo(() => {
    return LURES_ARRAY.filter((lure) => {
      // Season filter
      if (
        filters.season.length > 0 &&
        !filters.season.some((s) => lure.season_affinity.includes(s))
      ) {
        return false;
      }

      // Clarity filter
      if (
        filters.clarity.length > 0 &&
        !filters.clarity.some((c) => lure.water_clarity.includes(c))
      ) {
        return false;
      }

      // Conditions filter
      if (
        filters.conditions.length > 0 &&
        !filters.conditions.some((c) => lure.conditions.includes(c))
      ) {
        return false;
      }

      // Cover filter
      if (
        filters.cover.length > 0 &&
        !filters.cover.some((c) => lure.cover_type.includes(c))
      ) {
        return false;
      }

      // Finesse filter
      if (filters.finesse !== null && lure.finesse !== filters.finesse) {
        return false;
      }

      return true;
    });
  }, [filters]);

  return (
    <div className="lure-library-page">
      {/* Header */}
      <header className="lure-library-header">
        <h1>Lure Library</h1>
      </header>

      {/* Two-column layout wrapper */}
      <div className="lure-library-layout">
        {/* Left Column: Filters */}
        <aside className="lure-filters-column">
          {/* Active Filters Cloud */}
          {activeFilters.length > 0 && (
            <div className="active-filters-section">
              <div className="active-filters-header">
                <span className="active-filters-label">Active Filters</span>
                <button className="clear-all-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
              </div>
              <div className="active-filters-cloud">
                {activeFilters.map(({ group, value }) => (
                  <button
                    key={`${group}-${value}`}
                    className="active-filter-chip"
                    onClick={() => removeFilter(group, value)}
                  >
                    {value}
                    <XIcon size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="results-count">
            Showing {filteredLures.length} of {LURES_ARRAY.length} lures
          </div>

          {/* Combined Filter Cloud */}
          <div className="filter-cloud">
            {FILTER_OPTIONS.season.map((s) => (
              <FilterPill key={`s-${s}`} label={s} active={filters.season.includes(s)} onClick={() => toggleFilter("season", s)} />
            ))}
            {FILTER_OPTIONS.clarity.map((c) => (
              <FilterPill key={`cl-${c}`} label={c} active={filters.clarity.includes(c)} onClick={() => toggleFilter("clarity", c)} />
            ))}
            {FILTER_OPTIONS.conditions.map((c) => (
              <FilterPill key={`co-${c}`} label={c} active={filters.conditions.includes(c)} onClick={() => toggleFilter("conditions", c)} />
            ))}
            {FILTER_OPTIONS.cover.map((c) => (
              <FilterPill key={`cv-${c}`} label={c} active={filters.cover.includes(c)} onClick={() => toggleFilter("cover", c)} />
            ))}
            <FilterPill label="Finesse" active={filters.finesse === true} onClick={() => toggleFinesse(true)} />
            <FilterPill label="Power" active={filters.finesse === false} onClick={() => toggleFinesse(false)} />
          </div>
        </aside>

        {/* Right Column: Lure Grid */}
        <div className="lure-grid-column">
          <div className="lure-grid">
            {filteredLures.length > 0 ? (
              filteredLures.map((lure) => (
                <LureCard
                  key={lure.id}
                  lure={lure}
                  onClick={() => setSelectedLure(lure)}
                />
              ))
            ) : (
              <div className="no-results">
                <p>No lures match these filters</p>
                <button onClick={clearAllFilters}>Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLure && (
        <LureDetailModal
          lure={selectedLure}
          onClose={() => setSelectedLure(null)}
          onTagClick={(group, value) => {
            // Clear all filters first, then set the clicked one
            if (group === "finesse") {
              setFilters({ ...EMPTY_FILTERS, finesse: true });
            } else {
              setFilters({ ...EMPTY_FILTERS, [group]: [value] });
            }
            // Close the modal
            setSelectedLure(null);
          }}
        />
      )}

      {/* Styles */}
      <style>{`
        .lure-library-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0a0f 0%, #12121a 100%);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .lure-library-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background: rgba(10, 10, 15, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .lure-library-header h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }

        /* Two-column layout */
        .lure-library-layout {
          display: flex;
          flex-direction: column;
        }

        .lure-filters-column {
          width: 100%;
        }

        .lure-grid-column {
          width: 100%;
        }

        @media (min-width: 900px) {
          .lure-library-layout {
            flex-direction: row;
            padding: 20px;
            gap: 24px;
            max-width: 1400px;
            margin: 0 auto;
          }

          .lure-filters-column {
            width: 280px;
            flex-shrink: 0;
            position: sticky;
            top: calc(68px + env(safe-area-inset-top, 0px));
            align-self: flex-start;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
            padding-right: 8px;
          }

          .lure-grid-column {
            flex: 1;
          }

          .lure-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            padding: 0 !important;
          }

          .results-count {
            padding: 0 0 12px !important;
          }

          .filter-cloud {
            padding: 0 !important;
          }

          .active-filters-section {
            margin: 0 0 16px !important;
            padding: 12px !important;
            border-radius: 12px;
            border: 1px solid rgba(74, 144, 226, 0.15) !important;
          }
        }

        /* Active Filters Section */
        .active-filters-section {
          padding: 12px 20px;
          background: rgba(74, 144, 226, 0.08);
          border-bottom: 1px solid rgba(74, 144, 226, 0.15);
        }

        .active-filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .active-filters-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .clear-all-btn {
          background: none;
          border: none;
          color: #4A90E2;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          margin: -4px -8px;
        }

        .active-filters-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .active-filter-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(74, 144, 226, 0.2);
          border: 1px solid rgba(74, 144, 226, 0.4);
          border-radius: 100px;
          color: #4A90E2;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .active-filter-chip:hover {
          background: rgba(74, 144, 226, 0.3);
        }

        /* Results Count */
        .results-count {
          padding: 8px 16px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Combined Filter Cloud */
        .filter-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 16px 12px;
        }

        .filter-pill {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-pill.active {
          background: rgba(74, 144, 226, 0.2);
          border-color: #4A90E2;
          color: #4A90E2;
        }

        /* Lure Grid */
        .lure-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 0 20px 40px;
        }

        @media (min-width: 600px) and (max-width: 899px) {
          .lure-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .lure-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lure-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .lure-card-image {
          aspect-ratio: 1;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .lure-card-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .lure-card-info {
          padding: 12px;
        }

        .lure-card-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.3;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .lure-card-category {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* No Results */
        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.5);
        }

        .no-results p {
          margin: 0 0 16px;
          font-size: 1rem;
        }

        .no-results button {
          background: rgba(74, 144, 226, 0.2);
          border: 1px solid #4A90E2;
          color: #4A90E2;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* Modal Styles */
        .lure-modal-overlay {
          position: fixed;
          inset: 0;
          background: #0a0a0f;
          z-index: 100;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding-top: calc(68px + env(safe-area-inset-top, 0px));
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .lure-modal-content {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background: transparent;
          padding-bottom: calc(40px + env(safe-area-inset-bottom));
        }

        .lure-modal-header-bar {
          padding: 16px 20px;
        }

        .lure-modal-back {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #4A90E2;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .lure-modal-back:active {
          opacity: 0.7;
        }

        .lure-modal-image {
          aspect-ratio: 4/3;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          margin: 0 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .lure-modal-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .lure-modal-header {
          padding: 20px 20px 0;
        }

        .lure-modal-header h2 {
          margin: 0 0 8px;
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
        }

        .lure-modal-category {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(74, 144, 226, 0.15);
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4A90E2;
        }

        .lure-modal-description {
          padding: 16px 20px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }

        /* Gear Recommendations */
        .lure-modal-gear {
          margin: 0 20px 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .lure-modal-gear-header {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .lure-modal-gear-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .gear-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .gear-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #4A90E2;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .gear-value {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.3;
        }

        .gear-note {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          line-height: 1.4;
        }

        .lure-modal-tags {
          padding: 0 20px 24px;
        }

        .lure-modal-tag-group {
          margin-bottom: 12px;
        }

        .lure-modal-tag-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .lure-modal-tag-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .lure-tag {
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lure-tag.clickable:hover {
          transform: scale(1.05);
          filter: brightness(1.2);
        }

        .lure-tag.clickable:active {
          transform: scale(0.98);
        }

        .lure-tag.season {
          background: rgba(76, 175, 80, 0.15);
          color: #4CAF50;
        }

        .lure-tag.clarity {
          background: rgba(33, 150, 243, 0.15);
          color: #2196F3;
        }

        .lure-tag.conditions {
          background: rgba(255, 193, 7, 0.15);
          color: #FFC107;
        }

        .lure-tag.cover {
          background: rgba(156, 39, 176, 0.15);
          color: #CE93D8;
        }

        .lure-tag.finesse {
          background: rgba(156, 39, 176, 0.15);
          color: #CE93D8;
        }
      `}</style>
    </div>
  );
}

export default LureLibrary;
