// src/pages/LureLibrary.tsx

import React, { useState, useMemo } from "react";
import { LURES_ARRAY, FILTER_OPTIONS, type LureData } from "@/data/lures";
import { ArrowLeftIcon, XIcon } from "@/components/UnifiedIcons";

// =============================================================================
// FILTER STATE TYPE
// =============================================================================

type FilterState = {
  season: string[];
  clarity: string[];
  conditions: string[];
  cover: string[];
  pressure: string[];
};

const EMPTY_FILTERS: FilterState = {
  season: [],
  clarity: [],
  conditions: [],
  cover: [],
  pressure: [],
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
}: {
  lure: LureData;
  onClose: () => void;
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

        <div className="lure-modal-tags">
          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Season</span>
            <div className="lure-modal-tag-pills">
              {lure.season_affinity.map((s) => (
                <span key={s} className="lure-tag season">{s}</span>
              ))}
            </div>
          </div>

          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Water Clarity</span>
            <div className="lure-modal-tag-pills">
              {lure.water_clarity.map((c) => (
                <span key={c} className="lure-tag clarity">{c}</span>
              ))}
            </div>
          </div>

          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Conditions</span>
            <div className="lure-modal-tag-pills">
              {lure.conditions.map((c) => (
                <span key={c} className="lure-tag conditions">{c}</span>
              ))}
            </div>
          </div>

          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Cover</span>
            <div className="lure-modal-tag-pills">
              {lure.cover_type.map((c) => (
                <span key={c} className="lure-tag cover">{c}</span>
              ))}
            </div>
          </div>

          <div className="lure-modal-tag-group">
            <span className="lure-modal-tag-label">Pressure</span>
            <div className="lure-modal-tag-pills">
              {lure.pressure_level.map((p) => (
                <span key={p} className="lure-tag pressure">{p}</span>
              ))}
            </div>
          </div>
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
    setFilters((prev) => {
      const current = prev[group];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: updated };
    });
  };

  // Remove a specific filter
  const removeFilter = (group: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [group]: prev[group].filter((v) => v !== value),
    }));
  };

  // Clear all filters
  const clearAllFilters = () => setFilters(EMPTY_FILTERS);

  // Get all active filters as flat array for display
  const activeFilters = useMemo(() => {
    const result: { group: keyof FilterState; value: string }[] = [];
    (Object.keys(filters) as (keyof FilterState)[]).forEach((group) => {
      filters[group].forEach((value) => {
        result.push({ group, value });
      });
    });
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

      // Pressure filter
      if (
        filters.pressure.length > 0 &&
        !filters.pressure.some((p) => lure.pressure_level.includes(p))
      ) {
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

      {/* Filter Sections */}
      <div className="filter-sections">
        {/* Season */}
        <div className="filter-section">
          <div className="filter-section-title">Season</div>
          <div className="filter-pills-row">
            {FILTER_OPTIONS.season.map((s) => (
              <FilterPill
                key={s}
                label={s}
                active={filters.season.includes(s)}
                onClick={() => toggleFilter("season", s)}
              />
            ))}
          </div>
        </div>

        {/* Water Clarity */}
        <div className="filter-section">
          <div className="filter-section-title">Water Clarity</div>
          <div className="filter-pills-row">
            {FILTER_OPTIONS.clarity.map((c) => (
              <FilterPill
                key={c}
                label={c}
                active={filters.clarity.includes(c)}
                onClick={() => toggleFilter("clarity", c)}
              />
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="filter-section">
          <div className="filter-section-title">Conditions</div>
          <div className="filter-pills-row">
            {FILTER_OPTIONS.conditions.map((c) => (
              <FilterPill
                key={c}
                label={c}
                active={filters.conditions.includes(c)}
                onClick={() => toggleFilter("conditions", c)}
              />
            ))}
          </div>
        </div>

        {/* Cover */}
        <div className="filter-section">
          <div className="filter-section-title">Cover</div>
          <div className="filter-pills-row">
            {FILTER_OPTIONS.cover.map((c) => (
              <FilterPill
                key={c}
                label={c}
                active={filters.cover.includes(c)}
                onClick={() => toggleFilter("cover", c)}
              />
            ))}
          </div>
        </div>

        {/* Pressure */}
        <div className="filter-section">
          <div className="filter-section-title">Pressure</div>
          <div className="filter-pills-row">
            {FILTER_OPTIONS.pressure.map((p) => (
              <FilterPill
                key={p}
                label={p}
                active={filters.pressure.includes(p)}
                onClick={() => toggleFilter("pressure", p)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Lure Grid */}
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

      {/* Detail Modal */}
      {selectedLure && (
        <LureDetailModal
          lure={selectedLure}
          onClose={() => setSelectedLure(null)}
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
          padding: 16px 20px;
          padding-top: calc(16px + env(safe-area-inset-top));
          background: rgba(10, 10, 15, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .lure-library-header h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
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
          padding: 12px 20px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Filter Sections */
        .filter-sections {
          padding: 0 20px 20px;
        }

        .filter-section {
          margin-bottom: 16px;
        }

        .filter-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .filter-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-pill {
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-pill:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
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

        @media (min-width: 600px) {
          .lure-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 900px) {
          .lure-grid {
            grid-template-columns: repeat(4, 1fr);
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
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 10001;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .lure-modal-content {
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          background: #1a1a24;
          border-radius: 24px 24px 0 0;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out;
          padding-bottom: env(safe-area-inset-bottom);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .lure-modal-header-bar {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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

        .lure-modal-image {
          aspect-ratio: 16/10;
          background: rgba(0, 0, 0, 0.4);
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

        .lure-tag.pressure {
          background: rgba(244, 67, 54, 0.15);
          color: #EF9A9A;
        }
      `}</style>
    </div>
  );
}

export default LureLibrary;
