// src/features/plan/PlanNavigation.tsx
// Premium mobile navigation with floating design and proper header offset

import React, { useEffect, useState } from "react";
import { CloudIcon, FishIcon, ClockIcon } from "@/components/UnifiedIcons";

type NavItem = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { id: "weather", label: "Weather", Icon: CloudIcon },
  { id: "pattern-1", label: "Pattern 1", Icon: FishIcon },
  { id: "pattern-2", label: "Pattern 2", Icon: FishIcon },
  { id: "day-progression", label: "Timeline", Icon: ClockIcon },
];

// Top header height - increased for better clearance
const HEADER_HEIGHT = 60; // Increased from 56
const SCROLL_OFFSET = 30; // Increased from 20 for more breathing room

export function PlanNavigation() {
  const [activeSection, setActiveSection] = useState<string>("weather");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Intersection Observer for active section tracking
  useEffect(() => {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: `-${HEADER_HEIGHT + 50}px 0px -50% 0px`, // Increased from 40
      }
    );

    NAV_ITEMS.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isMobile]);

  const handleTap = (id: string) => {
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    setActiveSection(id);
    scrollToSection(id);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementTop - HEADER_HEIGHT - SCROLL_OFFSET;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  // Don't render on desktop
  if (!isMobile) return null;

  return (
    <nav className="plan-navigation-mobile">
      <div className="nav-container">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.id)}
              className={isActive ? "active" : ""}
              aria-label={`Scroll to ${item.label}`}
            >
              <item.Icon size={18} />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        /* Premium Floating Navigation - Compact */
        .plan-navigation-mobile {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          padding: 0 16px;
          width: 100%;
          max-width: 480px;
          pointer-events: none;
        }

        .plan-navigation-mobile .nav-container {
          display: flex;
          flex-direction: row;
          gap: 6px;
          padding: 8px;
          background: rgba(10, 10, 10, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(74, 144, 226, 0.2);
          border-radius: 18px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 2px 8px rgba(74, 144, 226, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          pointer-events: auto;
        }

        .plan-navigation-mobile button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 10px 14px;
          flex: 1;
          background: transparent;
          border: none;
          border-radius: 12px;
          opacity: 0.6;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          color: rgba(255, 255, 255, 0.9);
          position: relative;
        }

        .plan-navigation-mobile button:active {
          transform: scale(0.95);
        }

        .plan-navigation-mobile button.active {
          opacity: 1;
          background: linear-gradient(
            135deg,
            rgba(74, 144, 226, 0.25) 0%,
            rgba(74, 144, 226, 0.15) 100%
          );
          color: #fff;
          box-shadow: 
            0 4px 12px rgba(74, 144, 226, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .plan-navigation-mobile button.active::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #4A90E2 50%,
            transparent 100%
          );
          border-radius: 10px 10px 0 0;
        }

        .plan-navigation-mobile button svg {
          width: 18px;
          height: 18px;
          stroke-width: 1.8;
        }

        .plan-navigation-mobile .nav-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        /* Hide on desktop/tablet */
        @media (min-width: 768px) {
          .plan-navigation-mobile {
            display: none;
          }
        }

        /* Smaller screens - reduce padding */
        @media (max-width: 380px) {
          .plan-navigation-mobile {
            padding: 0 12px;
          }
          
          .plan-navigation-mobile button {
            padding: 8px 12px;
            gap: 3px;
          }

          .plan-navigation-mobile .nav-label {
            font-size: 0.65rem;
          }
        }
      `}</style>
    </nav>
  );
}
