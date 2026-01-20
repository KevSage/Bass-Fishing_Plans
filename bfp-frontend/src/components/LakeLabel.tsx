// src/components/LakeLabel.tsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";

// =============================================================================
// ICONS
// =============================================================================

const PinIcon = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EditIcon = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

// =============================================================================
// TYPES
// =============================================================================

export type LakeLabelData = {
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  isSaved: boolean;
  isKnown: boolean;
};

type LakeMatch = {
  name: string;
  city?: string;
  state?: string;
};

type LakeLabelProps = {
  lake: LakeLabelData | null;
  isVisible: boolean;
  onNameChange?: (name: string) => void;
  onAcceptSuggestion?: (name: string, city?: string, state?: string) => void;
  lakesData?: Array<{ name: string; city?: string; state?: string }>;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LakeLabel({
  lake,
  isVisible,
  onNameChange,
  onAcceptSuggestion,
  lakesData,
}: LakeLabelProps) {
  const [editableName, setEditableName] = useState("");
  const [isFadingIn, setIsFadingIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when prop changes
  useEffect(() => {
    if (lake) {
      setEditableName(lake.isKnown ? lake.name : "");
    }
  }, [lake?.lat, lake?.lng, lake?.isKnown, lake?.name]);

  // Handle visibility animation
  useEffect(() => {
    if (isVisible && lake) {
      const timer = setTimeout(() => setIsFadingIn(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsFadingIn(false);
    }
  }, [isVisible, lake]);

  // Notify parent of changes (for Unknown Waters)
  useEffect(() => {
    if (!lake?.isKnown && onNameChange) {
      onNameChange(editableName);
    }
  }, [editableName, lake?.isKnown, onNameChange]);

  // Suggestion Logic
  const suggestedMatch = useMemo((): LakeMatch | null => {
    if (
      !lakesData ||
      !editableName ||
      editableName.length < 3 ||
      lake?.isKnown
    ) {
      return null;
    }
    const query = editableName.toLowerCase().trim();
    const match = lakesData.find((l) => {
      const name = l.name.toLowerCase();
      return (
        name.includes(query) || query.includes(name.replace("lake ", "").trim())
      );
    });
    if (match && match.name.toLowerCase() !== query) {
      return match;
    }
    return null;
  }, [editableName, lakesData, lake?.isKnown]);

  const handleAcceptSuggestion = () => {
    if (suggestedMatch && onAcceptSuggestion) {
      onAcceptSuggestion(
        suggestedMatch.name,
        suggestedMatch.city,
        suggestedMatch.state,
      );
      setEditableName(suggestedMatch.name);
    }
  };

  if (!lake) return null;

  const formatCoord = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "W" : "E";
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  };

  return (
    <>
      <div className={`lake-plaque-container ${isFadingIn ? "visible" : ""}`}>
        <div className="lake-plaque-glass">
          {/* Status Header */}
          <div className="lake-plaque-status">
            <div
              className={`status-indicator ${lake.isSaved ? "saved" : "scout"}`}
            >
              <div className="status-dot" />
              <span className="status-text">
                {lake.isSaved ? "SAVED LOCATION" : "SCOUTING"}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="lake-plaque-body">
            {lake.isKnown ? (
              <h2 className="lake-name">{lake.name}</h2>
            ) : (
              <div className="lake-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="lake-name-input"
                  placeholder="Name this water..."
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="edit-icon">
                  <EditIcon />
                </div>
              </div>
            )}

            <div className="lake-meta">
              <PinIcon size={12} color="rgba(255,255,255,0.5)" />
              <span className="lake-location-text">
                {lake.isKnown && lake.city && lake.state
                  ? `${lake.city}, ${lake.state}`
                  : formatCoord(lake.lat, lake.lng)}
              </span>
            </div>
          </div>

          {/* Suggestion Pop-under */}
          {suggestedMatch && (
            <button
              className="lake-suggestion-btn"
              onClick={handleAcceptSuggestion}
            >
              <div className="suggestion-label">Did you mean?</div>
              <div className="suggestion-value">{suggestedMatch.name}</div>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .lake-plaque-container {
          position: fixed;
          top: 100px;
          left: 50%;
          transform: translateX(-50%) translateY(-20px);
          z-index: 800;
          opacity: 0;
          pointer-events: none;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lake-plaque-container.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }

        .lake-plaque-glass {
          background: rgba(15, 15, 20, 0.95); /* Deep Obsidian */
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.15); /* Top highlight */
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.6),
            0 4px 12px rgba(0, 0, 0, 0.4);
          border-radius: 16px;
          padding: 16px 20px;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Status Header */
        .lake-plaque-status {
          display: flex;
          align-items: center;
          margin-bottom: 2px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-indicator.saved .status-dot {
          background: #10B981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        .status-indicator.saved .status-text { color: #10B981; }

        .status-indicator.scout .status-dot {
          background: #4A90E2;
          box-shadow: 0 0 8px rgba(74, 144, 226, 0.6);
        }
        .status-indicator.scout .status-text { color: #4A90E2; }

        .status-text {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Body */
        .lake-plaque-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .lake-name {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .lake-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px dashed rgba(255,255,255,0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s;
        }
        .lake-input-wrapper:focus-within {
          border-bottom-style: solid;
          border-bottom-color: #4A90E2;
        }

        .lake-name-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          width: 100%;
          padding: 0;
        }
        .lake-name-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
          font-weight: 500;
        }
        
        .edit-icon {
          color: rgba(255,255,255,0.3);
        }

        .lake-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .lake-location-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'SF Mono', Monaco, Consolas, monospace;
        }

        /* Suggestion Button */
        .lake-suggestion-btn {
          margin-top: 8px;
          background: linear-gradient(90deg, rgba(74, 144, 226, 0.1), transparent);
          border: none;
          border-left: 2px solid #4A90E2;
          padding: 8px 12px;
          text-align: left;
          cursor: pointer;
          border-radius: 0 8px 8px 0;
          transition: all 0.2s;
        }
        
        .lake-suggestion-btn:hover {
          background: linear-gradient(90deg, rgba(74, 144, 226, 0.2), transparent);
          padding-left: 16px;
        }

        .suggestion-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 2px;
        }
        
        .suggestion-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4A90E2;
        }
      `}</style>
    </>
  );
}

// =============================================================================
// HOOK: useLakeLabelVisibility
// =============================================================================

export function useLakeLabelVisibility(
  map: mapboxgl.Map | null,
  lakeLat: number | null,
  lakeLng: number | null,
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map || lakeLat === null || lakeLng === null) {
      setIsVisible(false);
      return;
    }

    const checkVisibility = () => {
      const bounds = map.getBounds();
      if (!bounds) {
        setIsVisible(false);
        return;
      }

      const inView =
        lakeLat >= bounds.getSouth() &&
        lakeLat <= bounds.getNorth() &&
        lakeLng >= bounds.getWest() &&
        lakeLng <= bounds.getEast();

      setIsVisible(inView);
    };

    // Initial check with delay (let map settle)
    checkTimeoutRef.current = setTimeout(checkVisibility, 300);

    // Check on map move
    const onMoveEnd = () => {
      // Small delay after move ends
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = setTimeout(checkVisibility, 150);
    };

    map.on("moveend", onMoveEnd);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      map.off("moveend", onMoveEnd);
    };
  }, [map, lakeLat, lakeLng]);

  return isVisible;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { LakeLabelProps };
