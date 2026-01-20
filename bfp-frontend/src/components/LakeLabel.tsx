// src/components/LakeLabel.tsx
// Floating lake label that appears above the map when viewing a lake
// Info only - actions are in the nav panel

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

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
  isKnown: boolean; // True if lake is in database, false if unknown water
};

type LakeLabelProps = {
  lake: LakeLabelData | null;
  isVisible: boolean;
  onNameChange?: (name: string) => void; // For unknown waters
};

// =============================================================================
// PULSING ORB COMPONENT (Green for saved)
// =============================================================================

function SavedOrb({ size = 12 }: { size?: number }) {
  return (
    <>
      <div className="saved-orb">
        <div className="saved-orb-core" />
        <div className="saved-orb-pulse" />
      </div>

      <style>{`
        .saved-orb {
          position: relative;
          width: ${size}px;
          height: ${size}px;
          flex-shrink: 0;
        }

        .saved-orb-core {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 35%,
            #34D399 0%,
            #10B981 50%,
            #059669 100%
          );
          box-shadow:
            0 0 8px rgba(16, 185, 129, 0.6),
            0 0 16px rgba(16, 185, 129, 0.3);
        }

        .saved-orb-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(16, 185, 129, 0.5);
          animation: saved-orb-pulse 2.5s ease-out infinite;
        }

        @keyframes saved-orb-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LakeLabel({
  lake,
  isVisible,
  onNameChange,
}: LakeLabelProps) {
  const [editableName, setEditableName] = useState("");
  const [isFadingIn, setIsFadingIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset editable name when lake changes
  useEffect(() => {
    if (lake) {
      setEditableName(lake.isKnown ? lake.name : "");
    }
  }, [lake?.lat, lake?.lng, lake?.isKnown]);

  // Handle fade in animation
  useEffect(() => {
    if (isVisible && lake) {
      // Small delay before fade in for smoother transition after map settles
      const timer = setTimeout(() => setIsFadingIn(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsFadingIn(false);
    }
  }, [isVisible, lake]);

  // Notify parent of name changes for unknown waters
  useEffect(() => {
    if (!lake?.isKnown && onNameChange) {
      onNameChange(editableName);
    }
  }, [editableName, lake?.isKnown, onNameChange]);

  if (!lake) return null;

  // Format coordinates
  const formatCoord = (lat: number, lng: number): string => {
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "W" : "E";
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  };

  return (
    <>
      <div className={`lake-label-container ${isFadingIn ? "visible" : ""}`}>
        <div className="lake-label-backdrop">
          {/* Lake Name Row */}
          <div className="lake-label-name-row">
            {lake.isSaved && (
              <div className="lake-label-orb">
                <SavedOrb size={14} />
              </div>
            )}

            {lake.isKnown ? (
              <h2 className="lake-label-name">{lake.name}</h2>
            ) : (
              <input
                ref={inputRef}
                type="text"
                className="lake-label-input"
                placeholder="Name this water..."
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </div>

          {/* Location Row */}
          <div className="lake-label-location">
            {lake.isKnown && lake.city && lake.state
              ? `${lake.city}, ${lake.state}`
              : formatCoord(lake.lat, lake.lng)}
          </div>
        </div>
      </div>

      <style>{`
        .lake-label-container {
          position: fixed;
          top: 12%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 800;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .lake-label-container.visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Subtle backdrop pill */
        .lake-label-backdrop {
          padding: 12px 20px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        /* Name Row */
        .lake-label-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lake-label-orb {
          margin-right: 2px;
        }

        .lake-label-name {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          text-align: center;
        }

        /* Inline Input for Unknown Waters */
        .lake-label-input {
          background: transparent;
          border: none;
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.3);
          outline: none;
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          text-align: center;
          padding: 4px 8px;
          min-width: 180px;
          max-width: 280px;
          transition: border-color 0.2s ease;
        }

        .lake-label-input::placeholder {
          color: rgba(255, 255, 255, 0.45);
          font-weight: 500;
        }

        .lake-label-input:focus {
          border-bottom-color: rgba(255, 255, 255, 0.6);
        }

        /* Location Text */
        .lake-label-location {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .lake-label-backdrop {
            padding: 10px 16px;
          }

          .lake-label-name,
          .lake-label-input {
            font-size: 1.2rem;
          }

          .lake-label-location {
            font-size: 0.8rem;
          }

          .lake-label-input {
            min-width: 140px;
            max-width: 220px;
          }
        }
      `}</style>
    </>
  );
}

// =============================================================================
// HOOK: useLakeLabelVisibility
// Tracks whether the active lake center is within the viewport
// =============================================================================

export function useLakeLabelVisibility(
  map: mapboxgl.Map | null,
  lakeLat: number | null,
  lakeLng: number | null
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
