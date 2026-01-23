// src/components/FavoritesCarousel.tsx
import React, { useRef, useEffect } from "react";
import {
  TrashIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@/components/UnifiedIcons";

// Matches the shape from Members.tsx
type FavoriteLake = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  zoom: number;
  image?: string; // We use this for the background
  acres?: number;
  tier?: number;
  lake_type: "known" | "custom";
};

type FavoritesCarouselProps = {
  favorites: FavoriteLake[];
  currentId: string | null;
  onSelect: (lake: FavoriteLake) => void;
  onRemove: (lake: FavoriteLake) => void;
  onClose: () => void;
  onAddNew: () => void;
};

export function FavoritesCarousel({
  favorites,
  currentId,
  onSelect,
  onRemove,
  onClose,
  onAddNew,
}: FavoritesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active item on open
  useEffect(() => {
    if (currentId && scrollRef.current) {
      const el = document.getElementById(`fav-card-${currentId}`);
      if (el) {
        // Center the active card
        const scrollLeft =
          el.offsetLeft -
          scrollRef.current.clientWidth / 2 +
          el.clientWidth / 2;
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [currentId]);

  return (
    <>
      {/* Overlay - Click to close */}
      <div className="fav-carousel-overlay" onClick={onClose} />

      {/* Drawer Container */}
      <div className="fav-carousel-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fav-header">
          <div className="fav-title-group">
            <div className="fav-title">My Waters</div>
            <div className="fav-count">{favorites.length} Saved</div>
          </div>
          <button onClick={onClose} className="fav-close-btn">
            <ChevronDownIcon size={24} />
          </button>
        </div>

        {/* Scrollable Strip */}
        <div className="fav-scroll-container" ref={scrollRef}>
          {/* 1. Scout New Card (Always First) */}
          <div className="fav-card fav-card-add" onClick={onAddNew}>
            <div className="fav-add-icon">
              <PlusIcon size={24} />
            </div>
            <div className="fav-card-name">Scout New</div>
          </div>

          {/* 2. Favorites List */}
          {favorites.map((lake) => {
            const isActive = lake.id === currentId;
            return (
              <div
                key={`${lake.lake_type}:${lake.id}`}
                id={`fav-card-${lake.id}`}
                className={`fav-card ${isActive ? "active" : ""}`}
                onClick={() => onSelect(lake)}
                style={{
                  // Dynamic Background Image
                  backgroundImage: lake.image
                    ? `url(${lake.image})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Dark gradient overlay for text readability */}
                <div className="fav-card-gradient" />

                {isActive && <div className="fav-status-dot" />}

                <div className="fav-card-content">
                  <div className="fav-card-name">{lake.name}</div>
                  <div className="fav-card-meta">{lake.state || "US"}</div>
                </div>

                <button
                  className="fav-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove ${lake.name} from favorites?`)) {
                      onRemove(lake);
                    }
                  }}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            );
          })}

          {/* Spacer for right-side padding */}
          <div style={{ minWidth: 20 }} />
        </div>
      </div>

      <style>{`
        .fav-carousel-overlay {
          position: fixed; inset: 0; 
          background: rgba(0,0,0,0.4); 
          backdrop-filter: blur(4px);
          z-index: 2999; 
          animation: fade-in 0.3s ease-out;
        }

        .fav-carousel-drawer {
          position: fixed; 
          bottom: 0; left: 0; right: 0;
          background: rgba(18, 18, 24, 0.94);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px 28px 0 0;
          box-shadow: 0 -10px 60px rgba(0,0,0,0.6);
          z-index: 3000;
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .fav-header {
          padding: 20px 24px 10px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .fav-title-group { display: flex; align-items: baseline; gap: 8px; }
        .fav-title { font-size: 1.1rem; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
        .fav-count { font-size: 0.8rem; color: rgba(255,255,255,0.4); }

        .fav-close-btn {
          background: rgba(255,255,255,0.05); border: none; color: rgba(255,255,255,0.5);
          cursor: pointer; width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .fav-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .fav-scroll-container {
          display: flex;
          overflow-x: auto;
          gap: 12px;
          padding: 10px 24px 32px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .fav-scroll-container::-webkit-scrollbar { display: none; }

        .fav-card {
          flex: 0 0 30vw;
          max-width: 120px;
          aspect-ratio: 1/1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 14px;
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative;
          overflow: hidden; /* Ensure image doesn't bleed */
          scroll-snap-align: center;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        
        .fav-card-gradient {
            position: absolute; inset: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
            z-index: 1;
        }
        
        @media (min-width: 768px) {
          .fav-card { flex: 0 0 110px; }
        }

        .fav-card:active { transform: scale(0.96); }
        
        /* Active State Enhancements */
        .fav-card.active {
          border-color: #4A90E2;
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }

        .fav-status-dot {
          position: absolute; top: 12px; right: 12px;
          width: 8px; height: 8px; border-radius: 50%;
          background: #4A90E2;
          box-shadow: 0 0 8px #4A90E2;
          z-index: 2;
        }

        .fav-card-add {
          border-style: dashed;
          background: rgba(255,255,255,0.01);
          align-items: center; justify-content: center; gap: 10px;
        }
        .fav-add-icon {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
          display: flex; align-items: center; justify-content: center;
        }
        .fav-card-add .fav-card-name { font-size: 0.85rem; opacity: 0.6; }

        .fav-card-content { margin-top: auto; z-index: 2; position: relative; }
        .fav-card-name { 
          font-weight: 700; color: #fff; font-size: 0.95rem; 
          line-height: 1.2; margin-bottom: 2px;
          overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .fav-card-meta { font-size: 0.75rem; color: rgba(255,255,255,0.8); text-shadow: 0 1px 2px rgba(0,0,0,0.8); }

        .fav-delete-btn {
          position: absolute; top: 8px; left: 8px;
          width: 24px; height: 24px; border-radius: 8px;
          background: rgba(0,0,0,0.4); border: none; color: rgba(255,255,255,0.6);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 2;
          backdrop-filter: blur(4px);
        }
        .fav-delete-btn:hover { background: rgba(255, 107, 107, 0.6); color: #fff; }

        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
