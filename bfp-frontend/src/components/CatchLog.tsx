// src/components/CatchLog.tsx
// Comprehensive catch logging system with density-based pins

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import mapboxgl from "mapbox-gl";
import { FishIcon } from "@/components/UnifiedIcons"; // IMPORTED PREMIUM ICON

// =============================================================================
// TYPES
// =============================================================================

export type CatchEntry = {
  id: string;

  // Lake Association (for grouping/filtering)
  lakeName: string;
  lakeLat: number;
  lakeLng: number;

  // Exact Catch Location (for pin placement)
  catchLat: number;
  catchLng: number;

  // Catch Details
  lure: string;
  weight?: number;
  length?: number;
  notes?: string;
  imageData?: string; // Base64 - placeholder until backend

  // Timestamps
  caughtAt: string; // ISO timestamp
  createdAt: string;
};

export type ActiveLake = {
  name: string;
  lat: number;
  lng: number;
} | null;

type ModalView = "list" | "detail" | "form";

type CatchLogState = {
  isOpen: boolean;
  view: ModalView;
  entries: CatchEntry[];
  selectedEntry: CatchEntry | null;
  isEditing: boolean;
  visibleCount: number;
};

// =============================================================================
// CONSTANTS
// =============================================================================

export const LURE_OPTIONS = [
  // Horizontal Reaction
  {
    category: "Horizontal Reaction",
    value: "shallow crankbait",
    label: "Shallow Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "mid crankbait",
    label: "Mid Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "deep crankbait",
    label: "Deep Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "lipless crankbait",
    label: "Lipless Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "flat-sided crankbait",
    label: "Flat-sided Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "chatterbait",
    label: "Chatterbait",
  },
  { category: "Horizontal Reaction", value: "swim jig", label: "Swim Jig" },
  {
    category: "Horizontal Reaction",
    value: "spinnerbait",
    label: "Spinnerbait",
  },
  { category: "Horizontal Reaction", value: "underspin", label: "Underspin" },
  {
    category: "Horizontal Reaction",
    value: "paddle tail swimbait",
    label: "Paddle Tail Swimbait",
  },

  // Vertical Reaction
  { category: "Vertical Reaction", value: "jerkbait", label: "Jerkbait" },
  { category: "Vertical Reaction", value: "blade bait", label: "Blade Bait" },
  {
    category: "Vertical Reaction",
    value: "jighead minnow",
    label: "Jighead Minnow",
  },

  // Bottom Contact
  { category: "Bottom Contact", value: "texas rig", label: "Texas Rig" },
  { category: "Bottom Contact", value: "carolina rig", label: "Carolina Rig" },
  { category: "Bottom Contact", value: "football jig", label: "Football Jig" },
  { category: "Bottom Contact", value: "casting jig", label: "Casting Jig" },
  { category: "Bottom Contact", value: "shaky head", label: "Shaky Head" },
  { category: "Bottom Contact", value: "ned rig", label: "Ned Rig" },

  // Finesse / Mid-Column
  { category: "Finesse", value: "neko rig", label: "Neko Rig" },
  { category: "Finesse", value: "wacky rig", label: "Wacky Rig" },
  { category: "Finesse", value: "soft jerkbait", label: "Soft Jerkbait" },
  { category: "Finesse", value: "dropshot", label: "Dropshot" },

  // Topwater
  { category: "Topwater", value: "walking bait", label: "Walking Bait" },
  { category: "Topwater", value: "buzzbait", label: "Buzzbait" },
  { category: "Topwater", value: "whopper plopper", label: "Whopper Plopper" },
  { category: "Topwater", value: "wake bait", label: "Wake Bait" },
  {
    category: "Topwater",
    value: "hollow body frog",
    label: "Hollow Body Frog",
  },
  { category: "Topwater", value: "popping frog", label: "Popping Frog" },
  { category: "Topwater", value: "popper", label: "Popper" },
];

// Group lures by category for dropdown
const LURE_GROUPS = LURE_OPTIONS.reduce(
  (acc, lure) => {
    if (!acc[lure.category]) acc[lure.category] = [];
    acc[lure.category].push(lure);
    return acc;
  },
  {} as Record<string, typeof LURE_OPTIONS>,
);

// Density thresholds and colors
const DENSITY_CONFIG = {
  sparse: { min: 1, max: 3, color: "#F59E0B", pulseSpeed: 3 }, // Yellow, slow
  moderate: { min: 4, max: 9, color: "#F97316", pulseSpeed: 2 }, // Orange, medium
  hot: { min: 10, max: Infinity, color: "#EF4444", pulseSpeed: 1.2 }, // Red, fast
};

const DENSITY_RADIUS_METERS = 100; // Radius for density calculation
const ENTRIES_PER_PAGE = 10;
const STORAGE_KEY = "bass_clarity_catches";

// =============================================================================
// ICONS (Internal helper icons)
// =============================================================================

const PlusIcon = ({ size = 20 }: { size?: number }) => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const BackIcon = ({ size = 20 }: { size?: number }) => (
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
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const EditIcon = ({ size = 18 }: { size?: number }) => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = ({ size = 18 }: { size?: number }) => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const LocationIcon = ({ size = 18 }: { size?: number }) => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
  </svg>
);

const CameraIcon = ({ size = 18 }: { size?: number }) => (
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
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const CloseIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// =============================================================================
// HELPERS
// =============================================================================

// Haversine distance in meters
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate density tier for a catch based on nearby catches
function getDensityTier(
  catchEntry: CatchEntry,
  allCatches: CatchEntry[],
): keyof typeof DENSITY_CONFIG {
  const nearbyCount = allCatches.filter((c) => {
    if (c.id === catchEntry.id) return false;
    const dist = getDistanceMeters(
      catchEntry.catchLat,
      catchEntry.catchLng,
      c.catchLat,
      c.catchLng,
    );
    return dist <= DENSITY_RADIUS_METERS;
  }).length;

  const total = nearbyCount + 1; // Include self

  if (total >= DENSITY_CONFIG.hot.min) return "hot";
  if (total >= DENSITY_CONFIG.moderate.min) return "moderate";
  return "sparse";
}

// Format date for display
function formatCatchDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCatchTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCatchDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format coordinates
function formatCoord(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

// Format lure name for display
function formatLureName(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Generate unique ID
function generateId(): string {
  return `catch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// LOCAL STORAGE
// =============================================================================

function loadCatches(): CatchEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCatches(catches: CatchEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catches));
  } catch (e) {
    console.error("Failed to save catches:", e);
  }
}

// =============================================================================
// CUSTOM HOOK: useCatchLog
// =============================================================================

export function useCatchLog(activeLake: ActiveLake) {
  const [state, setState] = useState<CatchLogState>({
    isOpen: false,
    view: "list",
    entries: [],
    selectedEntry: null,
    isEditing: false,
    visibleCount: ENTRIES_PER_PAGE,
  });

  // Load catches on mount
  useEffect(() => {
    const allCatches = loadCatches();
    setState((s) => ({ ...s, entries: allCatches }));
  }, []);

  // Filter entries for active lake
  const lakeCatches = useMemo(() => {
    if (!activeLake) return [];
    return state.entries
      .filter(
        (c) =>
          c.lakeName === activeLake.name ||
          (Math.abs(c.lakeLat - activeLake.lat) < 0.01 &&
            Math.abs(c.lakeLng - activeLake.lng) < 0.01),
      )
      .sort(
        (a, b) =>
          new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime(),
      );
  }, [state.entries, activeLake]);

  // Visible entries (paginated)
  const visibleCatches = useMemo(() => {
    return lakeCatches.slice(0, state.visibleCount);
  }, [lakeCatches, state.visibleCount]);

  const hasMore = lakeCatches.length > state.visibleCount;

  // Actions
  const open = useCallback(() => {
    setState((s) => ({
      ...s,
      isOpen: true,
      view: "list",
      selectedEntry: null,
      isEditing: false,
      visibleCount: ENTRIES_PER_PAGE,
    }));
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const showList = useCallback(() => {
    setState((s) => ({
      ...s,
      view: "list",
      selectedEntry: null,
      isEditing: false,
    }));
  }, []);

  const showDetail = useCallback((entry: CatchEntry) => {
    setState((s) => ({
      ...s,
      view: "detail",
      selectedEntry: entry,
      isEditing: false,
    }));
  }, []);

  const showForm = useCallback((entry?: CatchEntry) => {
    setState((s) => ({
      ...s,
      view: "form",
      selectedEntry: entry || null,
      isEditing: !!entry,
    }));
  }, []);

  const loadMore = useCallback(() => {
    setState((s) => ({
      ...s,
      visibleCount: s.visibleCount + ENTRIES_PER_PAGE,
    }));
  }, []);

  const addCatch = useCallback(
    (catchData: Omit<CatchEntry, "id" | "createdAt">) => {
      const newCatch: CatchEntry = {
        ...catchData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      setState((s) => {
        const updated = [newCatch, ...s.entries];
        saveCatches(updated);
        return {
          ...s,
          entries: updated,
          view: "list",
          selectedEntry: null,
          isEditing: false,
        };
      });

      return newCatch;
    },
    [],
  );

  const updateCatch = useCallback(
    (id: string, updates: Partial<CatchEntry>) => {
      setState((s) => {
        const updated = s.entries.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        );
        saveCatches(updated);
        const updatedEntry = updated.find((c) => c.id === id) || null;
        return {
          ...s,
          entries: updated,
          selectedEntry: updatedEntry,
          view: "detail",
          isEditing: false,
        };
      });
    },
    [],
  );

  const deleteCatch = useCallback((id: string) => {
    setState((s) => {
      const updated = s.entries.filter((c) => c.id !== id);
      saveCatches(updated);
      return {
        ...s,
        entries: updated,
        view: "list",
        selectedEntry: null,
        isEditing: false,
      };
    });
  }, []);

  return {
    // State
    isOpen: state.isOpen,
    view: state.view,
    selectedEntry: state.selectedEntry,
    isEditing: state.isEditing,
    entries: state.entries,
    lakeCatches,
    visibleCatches,
    hasMore,
    activeLake,

    // Actions
    open,
    close,
    showList,
    showDetail,
    showForm,
    loadMore,
    addCatch,
    updateCatch,
    deleteCatch,
  };
}

export type UseCatchLogReturn = ReturnType<typeof useCatchLog>;

// =============================================================================
// COMPONENT: CatchButton (Obsidian Glass Floating Button)
// =============================================================================

type CatchButtonProps = {
  onClick: () => void;
  catchCount: number;
  disabled?: boolean;
};

export function CatchButton({
  onClick,
  catchCount,
  disabled,
}: CatchButtonProps) {
  return (
    <>
      <button
        onClick={onClick}
        disabled={disabled}
        className="catch-float-btn"
        aria-label="Open catch log"
      >
        <FishIcon size={26} />
        {catchCount > 0 && <span className="catch-badge">{catchCount}</span>}
      </button>

      <style>{`
        .catch-float-btn {
          position: fixed;
          top: 50%; /* Vertically centered */
          left: 20px;
          transform: translateY(-50%); /* Center alignment fix */
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          
          /* Obsidian Glass Effect */
          background: rgba(15, 15, 20, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.5),
            inset 0 1px 1px rgba(255, 255, 255, 0.15);
            
          color: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          z-index: 1000;
        }

        .catch-float-btn:hover:not(:disabled) {
          transform: translateY(-52%) scale(1.05);
          background: rgba(20, 20, 28, 0.85);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 1px rgba(255, 255, 255, 0.3);
          color: #fff;
        }

        .catch-float-btn:active:not(:disabled) {
          transform: translateY(-50%) scale(0.95);
        }

        .catch-float-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(1);
          background: rgba(10, 10, 10, 0.6);
          border-color: rgba(255,255,255,0.05);
        }

        .catch-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4A90E2, #357ABD);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
        }
      `}</style>
    </>
  );
}

// =============================================================================
// COMPONENT: CatchLogModal
// =============================================================================

export function CatchLogModal(props: UseCatchLogReturn) {
  const {
    isOpen,
    view,
    selectedEntry,
    isEditing,
    visibleCatches,
    hasMore,
    activeLake,
    close,
    showList,
    showDetail,
    showForm,
    loadMore,
    addCatch,
    updateCatch,
    deleteCatch,
    lakeCatches,
  } = props;

  if (!isOpen) return null;

  return (
    <>
      <div className="catch-modal-overlay" onClick={close}>
        <div className="catch-modal" onClick={(e) => e.stopPropagation()}>
          {view === "list" && (
            <CatchListView
              catches={visibleCatches}
              hasMore={hasMore}
              activeLake={activeLake}
              onSelectCatch={showDetail}
              onAddNew={() => showForm()}
              onLoadMore={loadMore}
              onClose={close}
            />
          )}
          {view === "detail" && selectedEntry && (
            <CatchDetailView
              entry={selectedEntry}
              onBack={showList}
              onEdit={() => showForm(selectedEntry)}
              onDelete={() => {
                if (confirm("Delete this catch?")) {
                  deleteCatch(selectedEntry.id);
                }
              }}
            />
          )}
          {view === "form" && (
            <CatchFormView
              entry={selectedEntry}
              isEditing={isEditing}
              activeLake={activeLake}
              onSave={(data) => {
                if (isEditing && selectedEntry) {
                  updateCatch(selectedEntry.id, data);
                } else {
                  addCatch(data as Omit<CatchEntry, "id" | "createdAt">);
                }
              }}
              onCancel={
                selectedEntry ? () => showDetail(selectedEntry) : showList
              }
            />
          )}
        </div>
      </div>

      <style>{`
        .catch-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2500;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .catch-modal {
          width: 100%;
          max-width: 420px;
          max-height: 85vh;
          border-radius: 24px;
          background: rgba(18, 18, 24, 0.95);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}

// =============================================================================
// SUB-COMPONENT: CatchListView
// =============================================================================

type CatchListViewProps = {
  catches: CatchEntry[];
  hasMore: boolean;
  activeLake: ActiveLake;
  onSelectCatch: (entry: CatchEntry) => void;
  onAddNew: () => void;
  onLoadMore: () => void;
  onClose: () => void;
};

function CatchListView({
  catches,
  hasMore,
  activeLake,
  onSelectCatch,
  onAddNew,
  onLoadMore,
  onClose,
}: CatchListViewProps) {
  return (
    <>
      {/* Header */}
      <div className="catch-modal-header">
        <div className="catch-header-title">
          <FishIcon size={20} />
          <span>Catch Log</span>
        </div>
        <button onClick={onClose} className="catch-close-btn">
          <CloseIcon />
        </button>
      </div>

      {/* Lake Context */}
      {activeLake && (
        <div className="catch-lake-context">{activeLake.name}</div>
      )}

      {/* Body */}
      <div className="catch-modal-body">
        {!activeLake ? (
          <div className="catch-empty-state">
            <p>Select a lake to view catches</p>
          </div>
        ) : catches.length === 0 ? (
          <div className="catch-empty-state">
            <FishIcon size={48} />
            <p>No catches yet</p>
            <span>Tap + to log your first catch</span>
          </div>
        ) : (
          <div className="catch-list">
            {catches.map((entry) => (
              <button
                key={entry.id}
                className="catch-list-item"
                onClick={() => onSelectCatch(entry)}
              >
                <div className="catch-item-thumb">
                  {entry.imageData ? (
                    <img src={entry.imageData} alt="" />
                  ) : (
                    <div className="catch-item-no-img">
                      <FishIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="catch-item-info">
                  <div className="catch-item-time">
                    {formatCatchTime(entry.caughtAt)}
                  </div>
                  <div className="catch-item-details">
                    {entry.weight && `${entry.weight} lbs`}
                    {entry.weight && entry.length && " • "}
                    {entry.length && `${entry.length}"`}
                    {!entry.weight &&
                      !entry.length &&
                      formatLureName(entry.lure)}
                  </div>
                </div>
                <div className="catch-item-date">
                  {formatCatchDate(entry.caughtAt)}
                </div>
              </button>
            ))}

            {hasMore && (
              <button className="catch-load-more" onClick={onLoadMore}>
                View More
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Button */}
      {activeLake && (
        <div className="catch-modal-footer">
          <button className="catch-add-btn" onClick={onAddNew}>
            <PlusIcon size={20} />
            <span>Add Catch</span>
          </button>
        </div>
      )}

      <style>{`
        .catch-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }
        .catch-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 1.05rem;
        }
        .catch-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .catch-lake-context {
          padding: 12px 24px;
          background: rgba(74, 144, 226, 0.1);
          color: #4A90E2;
          font-size: 0.85rem;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .catch-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .catch-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          gap: 12px;
        }
        .catch-empty-state p {
          margin: 0;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .catch-empty-state span {
          font-size: 0.85rem;
        }
        .catch-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .catch-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        .catch-list-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .catch-item-thumb {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.3);
        }
        .catch-item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .catch-item-no-img {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.2);
        }
        .catch-item-info {
          flex: 1;
          min-width: 0;
        }
        .catch-item-time {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
        }
        .catch-item-details {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }
        .catch-item-date {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.35);
          flex-shrink: 0;
        }
        .catch-load-more {
          width: 100%;
          padding: 14px;
          margin-top: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-load-more:hover {
          border-color: rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.03);
        }
        .catch-modal-footer {
          padding: 16px 24px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .catch-add-btn {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(74, 144, 226, 0.25);
        }
        .catch-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(74, 144, 226, 0.35);
        }
      `}</style>
    </>
  );
}

// =============================================================================
// SUB-COMPONENT: CatchDetailView
// =============================================================================

type CatchDetailViewProps = {
  entry: CatchEntry;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function CatchDetailView({
  entry,
  onBack,
  onEdit,
  onDelete,
}: CatchDetailViewProps) {
  return (
    <>
      {/* Header */}
      <div className="catch-detail-header">
        <button onClick={onBack} className="catch-back-btn">
          <BackIcon />
          <span>Back</span>
        </button>
        <button onClick={onEdit} className="catch-edit-btn">
          <EditIcon />
        </button>
      </div>

      {/* Body */}
      <div className="catch-detail-body">
        {/* Image */}
        {entry.imageData ? (
          <div className="catch-detail-image">
            <img src={entry.imageData} alt="Catch" />
          </div>
        ) : (
          <div className="catch-detail-no-image">
            <FishIcon size={48} />
            <span>No photo</span>
          </div>
        )}

        {/* Details */}
        <div className="catch-detail-content">
          <h3 className="catch-detail-lure">{formatLureName(entry.lure)}</h3>

          <div className="catch-detail-stats">
            {entry.weight && (
              <div className="catch-stat">
                <span className="catch-stat-value">{entry.weight}</span>
                <span className="catch-stat-label">lbs</span>
              </div>
            )}
            {entry.length && (
              <div className="catch-stat">
                <span className="catch-stat-value">{entry.length}</span>
                <span className="catch-stat-label">inches</span>
              </div>
            )}
          </div>

          <div className="catch-detail-meta">
            <div className="catch-meta-row">
              <span className="catch-meta-label">When</span>
              <span className="catch-meta-value">
                {formatCatchDateTime(entry.caughtAt)}
              </span>
            </div>
            <div className="catch-meta-row">
              <span className="catch-meta-label">Location</span>
              <span className="catch-meta-value catch-meta-coords">
                {formatCoord(entry.catchLat, entry.catchLng)}
              </span>
            </div>
            <div className="catch-meta-row">
              <span className="catch-meta-label">Lake</span>
              <span className="catch-meta-value">{entry.lakeName}</span>
            </div>
          </div>

          {entry.notes && (
            <div className="catch-detail-notes">
              <span className="catch-notes-label">Notes</span>
              <p>{entry.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <div className="catch-detail-footer">
        <button onClick={onDelete} className="catch-delete-btn">
          <TrashIcon />
          <span>Delete Catch</span>
        </button>
      </div>

      <style>{`
        .catch-detail-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .catch-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-back-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }
        .catch-edit-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-edit-btn:hover {
          background: rgba(74, 144, 226, 0.15);
          color: #4A90E2;
        }
        .catch-detail-body {
          flex: 1;
          overflow-y: auto;
        }
        .catch-detail-image {
          width: 100%;
          aspect-ratio: 4/3;
          background: rgba(0, 0, 0, 0.3);
        }
        .catch-detail-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .catch-detail-no-image {
          width: 100%;
          aspect-ratio: 16/9;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.2);
          font-size: 0.85rem;
        }
        .catch-detail-content {
          padding: 24px;
        }
        .catch-detail-lure {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
        }
        .catch-detail-stats {
          display: flex;
          gap: 24px;
          margin-top: 16px;
        }
        .catch-stat {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .catch-stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #4A90E2;
        }
        .catch-stat-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .catch-detail-meta {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .catch-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .catch-meta-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .catch-meta-value {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .catch-meta-coords {
          font-family: 'SF Mono', Monaco, Consolas, monospace;
          font-size: 0.85rem;
        }
        .catch-detail-notes {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .catch-notes-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .catch-detail-notes p {
          margin: 8px 0 0;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }
        .catch-detail-footer {
          padding: 16px 24px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .catch-delete-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 107, 107, 0.3);
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .catch-delete-btn:hover {
          background: rgba(255, 107, 107, 0.2);
          border-color: rgba(255, 107, 107, 0.5);
        }
      `}</style>
    </>
  );
}

// =============================================================================
// SUB-COMPONENT: CatchFormView
// =============================================================================

type CatchFormViewProps = {
  entry: CatchEntry | null;
  isEditing: boolean;
  activeLake: ActiveLake;
  onSave: (data: Partial<CatchEntry>) => void;
  onCancel: () => void;
};

function CatchFormView({
  entry,
  isEditing,
  activeLake,
  onSave,
  onCancel,
}: CatchFormViewProps) {
  const [lure, setLure] = useState(entry?.lure || "");
  const [weight, setWeight] = useState(entry?.weight?.toString() || "");
  const [length, setLength] = useState(entry?.length?.toString() || "");
  const [notes, setNotes] = useState(entry?.notes || "");

  // UPDATED: Autopopulate location from activeLake if not editing
  const [catchLat, setCatchLat] = useState(
    entry?.catchLat || activeLake?.lat || 0,
  );
  const [catchLng, setCatchLng] = useState(
    entry?.catchLng || activeLake?.lng || 0,
  );

  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(entry ? "success" : "idle");
  const [imageData, setImageData] = useState(entry?.imageData || "");
  const [caughtAt, setCaughtAt] = useState(
    entry?.caughtAt || new Date().toISOString(),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCatchLat(position.coords.latitude);
        setCatchLng(position.coords.longitude);
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true },
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, just show a placeholder - actual upload disabled until backend
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!lure || !activeLake) return;

    const data: Partial<CatchEntry> = {
      lakeName: activeLake.name,
      lakeLat: activeLake.lat,
      lakeLng: activeLake.lng,
      catchLat: catchLat || activeLake.lat,
      catchLng: catchLng || activeLake.lng,
      lure,
      weight: weight ? parseFloat(weight) : undefined,
      length: length ? parseFloat(length) : undefined,
      notes: notes || undefined,
      imageData: imageData || undefined,
      caughtAt,
    };

    onSave(data);
  };

  const canSubmit = lure && activeLake;

  return (
    <>
      {/* Header */}
      <div className="catch-form-header">
        {/* UPDATED: CANCEL BUTTON STYLE */}
        <button onClick={onCancel} className="catch-cancel-btn">
          Cancel
        </button>
        <span className="catch-form-title">
          {isEditing ? "Edit Catch" : "Add Catch"}
        </span>
        <div style={{ width: 60 }} /> {/* Spacer for centering */}
      </div>

      {/* Body */}
      <div className="catch-form-body">
        {/* Lure Dropdown */}
        <div className="catch-form-field">
          <label className="catch-form-label">Lure *</label>
          <select
            value={lure}
            onChange={(e) => setLure(e.target.value)}
            className="catch-form-select"
          >
            <option value="">Select a lure...</option>
            {Object.entries(LURE_GROUPS).map(([category, lures]) => (
              <optgroup key={category} label={category}>
                {lures.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Weight & Length */}
        <div className="catch-form-row">
          <div className="catch-form-field">
            <label className="catch-form-label">Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="catch-form-input"
              placeholder="0.0"
            />
          </div>
          <div className="catch-form-field">
            <label className="catch-form-label">Length (in)</label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="catch-form-input"
              placeholder="0"
            />
          </div>
        </div>

        {/* Location */}
        <div className="catch-form-field">
          <label className="catch-form-label">Exact Location</label>
          {locationStatus === "success" ||
          (catchLat !== 0 && catchLng !== 0) ? (
            <div className="catch-location-display">
              <LocationIcon size={16} />
              <span>{formatCoord(catchLat, catchLng)}</span>
              <button
                type="button"
                onClick={handleGetLocation}
                className="catch-location-refresh"
              >
                Refresh
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGetLocation}
              className="catch-location-btn"
              disabled={locationStatus === "loading"}
            >
              <LocationIcon size={18} />
              <span>
                {locationStatus === "loading"
                  ? "Getting location..."
                  : locationStatus === "error"
                    ? "Retry Location"
                    : "Get Current Location"}
              </span>
            </button>
          )}
        </div>

        {/* Time */}
        <div className="catch-form-field">
          <label className="catch-form-label">Time</label>
          <div className="catch-time-display">
            {formatCatchDateTime(caughtAt)}
          </div>
        </div>

        {/* Notes */}
        <div className="catch-form-field">
          <label className="catch-form-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="catch-form-textarea"
            placeholder="Structure, technique, conditions..."
            rows={3}
          />
        </div>

        {/* Photo */}
        <div className="catch-form-field">
          <label className="catch-form-label">Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          {imageData ? (
            <div className="catch-image-preview">
              <img src={imageData} alt="Preview" />
              <button
                type="button"
                onClick={() => setImageData("")}
                className="catch-image-remove"
              >
                <CloseIcon size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="catch-photo-btn"
            >
              <CameraIcon size={20} />
              <span>Add Photo</span>
            </button>
          )}
          <p className="catch-form-hint">
            Image upload available when connected to server
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="catch-form-footer">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="catch-save-btn"
        >
          {isEditing ? "Save Changes" : "Save Catch"}
        </button>
      </div>

      <style>{`
        .catch-form-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .catch-form-title {
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
        }
        
        /* UPDATED: CANCEL BUTTON STYLE */
        .catch-cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .catch-form-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .catch-form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .catch-form-row {
          display: flex;
          gap: 12px;
        }
        .catch-form-row .catch-form-field {
          flex: 1;
        }
        .catch-form-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .catch-form-input,
        .catch-form-select,
        .catch-form-textarea {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 1rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          outline: none;
          transition: all 0.2s;
        }
        .catch-form-input:focus,
        .catch-form-select:focus,
        .catch-form-textarea:focus {
          border-color: rgba(74, 144, 226, 0.5);
          background: rgba(0, 0, 0, 0.5);
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }
        .catch-form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
        }
        .catch-form-select option {
          background: #1a1a24;
          color: #fff;
        }
        .catch-form-select optgroup {
          background: #1a1a24;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
        }
        .catch-form-textarea {
          resize: none;
          line-height: 1.5;
        }
        .catch-location-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          border-radius: 12px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-location-btn:hover:not(:disabled) {
          border-color: rgba(74, 144, 226, 0.5);
          color: #4A90E2;
          background: rgba(74, 144, 226, 0.1);
        }
        .catch-location-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .catch-location-display {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10B981;
          font-family: 'SF Mono', Monaco, Consolas, monospace;
          font-size: 0.9rem;
        }
        .catch-location-refresh {
          margin-left: auto;
          padding: 4px 10px;
          border-radius: 6px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-location-refresh:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .catch-time-display {
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }
        .catch-photo-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          border-radius: 12px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-photo-btn:hover {
          border-color: rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.7);
          background: rgba(0, 0, 0, 0.3);
        }
        .catch-image-preview {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.3);
        }
        .catch-image-preview img {
          width: 100%;
          height: auto;
          max-height: 200px;
          object-fit: cover;
          display: block;
        }
        .catch-image-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-image-remove:hover {
          background: rgba(255, 107, 107, 0.8);
        }
        .catch-form-hint {
          margin: 4px 0 0;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.35);
          font-style: italic;
        }
        .catch-form-footer {
          padding: 16px 24px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .catch-save-btn {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(74, 144, 226, 0.25);
        }
        .catch-save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(74, 144, 226, 0.35);
        }
        .catch-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

// =============================================================================
// COMPONENT: CatchPopup (Mini popup for map pins)
// =============================================================================

type CatchPopupProps = {
  entry: CatchEntry;
  onViewDetails: () => void;
  onClose: () => void;
};

export function CatchPopup({ entry, onViewDetails, onClose }: CatchPopupProps) {
  return (
    <>
      <div className="catch-popup">
        <button onClick={onClose} className="catch-popup-close">
          <CloseIcon size={10} />
        </button>
        <div className="catch-popup-content">
          <div className="catch-popup-main">
            {entry.weight && (
              <span className="catch-popup-weight">{entry.weight} lbs</span>
            )}
            <span className="catch-popup-time">
              {formatCatchTime(entry.caughtAt)}
            </span>
          </div>
          <div className="catch-popup-lure">{formatLureName(entry.lure)}</div>
        </div>
        <button onClick={onViewDetails} className="catch-popup-details">
          View Details
        </button>
      </div>

      <style>{`
        .catch-popup {
          background: rgba(20, 20, 28, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 12px 14px;
          min-width: 160px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
          position: relative;
        }
        .catch-popup-close {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-popup-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .catch-popup-content {
          margin-bottom: 10px;
        }
        .catch-popup-main {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .catch-popup-weight {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
        }
        .catch-popup-time {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .catch-popup-lure {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 2px;
        }
        .catch-popup-details {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(74, 144, 226, 0.4);
          background: rgba(74, 144, 226, 0.1);
          color: #4A90E2;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catch-popup-details:hover {
          background: rgba(74, 144, 226, 0.2);
          border-color: rgba(74, 144, 226, 0.6);
        }
      `}</style>
    </>
  );
}

// =============================================================================
// MAP PIN RENDERING LOGIC
// =============================================================================

export function createCatchMarker(
  entry: CatchEntry,
  allCatches: CatchEntry[],
  onClick: (entry: CatchEntry) => void,
): HTMLElement {
  const tier = getDensityTier(entry, allCatches);
  const config = DENSITY_CONFIG[tier];

  const el = document.createElement("div");
  el.className = `catch-pin catch-pin-${tier}`;
  el.style.cssText = `
    width: 14px;
    height: 14px;
    background: radial-gradient(circle at 30% 30%, ${config.color}, ${config.color}dd);
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    box-shadow: 0 0 8px ${config.color}80;
    border: 2px solid rgba(255, 255, 255, 0.6);
  `;

  // Add pulse animation
  const pulse = document.createElement("div");
  pulse.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid ${config.color};
    animation: catch-pin-pulse-${tier} ${config.pulseSpeed}s infinite ease-out;
  `;
  el.appendChild(pulse);

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(entry);
  });

  return el;
}

// Inject keyframes for pin animations
export function injectCatchPinStyles(): void {
  const styleId = "catch-pin-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes catch-pin-pulse-sparse {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
    @keyframes catch-pin-pulse-moderate {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
    @keyframes catch-pin-pulse-hot {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Create all catch markers for a lake
export function createCatchMarkers(
  map: mapboxgl.Map,
  catches: CatchEntry[],
  onPinClick: (entry: CatchEntry) => void,
): mapboxgl.Marker[] {
  injectCatchPinStyles();

  return catches.map((entry) => {
    const el = createCatchMarker(entry, catches, onPinClick);
    return new mapboxgl.Marker({ element: el })
      .setLngLat([entry.catchLng, entry.catchLat])
      .addTo(map);
  });
}

// Cleanup markers
export function removeCatchMarkers(markers: mapboxgl.Marker[]): void {
  markers.forEach((m) => m.remove());
}
