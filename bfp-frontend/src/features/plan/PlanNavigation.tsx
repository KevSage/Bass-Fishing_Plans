// src/features/plan/PlanNavigation.tsx
// Redesigned: Premium "Floating Glass Pill" Aesthetic

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapOrb } from "@/components/MapOrb";
import { CloudIcon, FishIcon, ClockIcon } from "@/components/UnifiedIcons";

interface PlanNavigationProps {
  plan: any;
}

const HEADER_HEIGHT = 60;
const SCROLL_OFFSET = 30;

const NAV_ITEMS = [
  { id: "weather", label: "Weather", Icon: CloudIcon },
  { id: "pattern-1", label: "Pattern 1", Icon: FishIcon },
  { id: "pattern-2", label: "Pattern 2", Icon: FishIcon },
  { id: "day-progression", label: "Timeline", Icon: ClockIcon },
];

export function PlanNavigation({ plan }: PlanNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>("weather");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3, rootMargin: `-${HEADER_HEIGHT + 50}px 0px -50% 0px` }
    );
    NAV_ITEMS.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [isMobile]);

  const handleFlyBack = () => {
    if (!plan || !plan.conditions) return;
    const { latitude, longitude, location_name } = plan.conditions;
    navigate(
      `/members?lat=${latitude}&lng=${longitude}&lake=${encodeURIComponent(
        location_name
      )}`
    );
  };

  const handleTap = (id: string) => {
    if (id === "fly-back") {
      handleFlyBack();
      return;
    }
    setActiveSection(id);
    const element = document.getElementById(id);
    if (!element) return;
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementTop - HEADER_HEIGHT - SCROLL_OFFSET;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  };

  if (!isMobile) return null;

  return (
    <nav className="plan-navigation-mobile">
      <div className="glass-pill">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTap(item.id)}
            className={activeSection === item.id ? "active nav-btn" : "nav-btn"}
          >
            <div className="icon-wrapper">
              <item.Icon size={20} />
            </div>
          </button>
        ))}

        {/* Subtle Vertical Divider */}
        <div className="nav-divider" />

        {/* Map Button (Orb) */}
        <button
          onClick={() => handleTap("fly-back")}
          className="nav-btn map-btn"
        >
          <MapOrb size={22} />
        </button>
      </div>

      <style>{`
        .plan-navigation-mobile {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: auto; /* Allow pill to size to content */
          pointer-events: none;
        }

        /* The Premium Glass Pill */
        .glass-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          
          /* iOS Glass Effect */
          background: rgba(20, 20, 20, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          
          /* Depth & Border */
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px; /* Full stadium shape */
          box-shadow: 
            0 12px 32px rgba(0, 0, 0, 0.5), /* Deep shadow */
            inset 0 1px 0 rgba(255, 255, 255, 0.1); /* Top edge light catch */
            
          pointer-events: auto;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.5); /* Dim inactive state */
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
        }

        /* Active State: Bright white + Subtle Glow */
        .nav-btn.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.05);
        }

        .nav-btn:active {
          transform: scale(0.92);
        }

        /* Divider Line */
        .nav-divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 6px;
        }

        /* Map Button Specifics */
        .map-btn {
          width: 44px; /* Ensure circular target area */
        }

        @media (min-width: 768px) {
          .plan-navigation-mobile { display: none; }
        }
      `}</style>
    </nav>
  );
}
