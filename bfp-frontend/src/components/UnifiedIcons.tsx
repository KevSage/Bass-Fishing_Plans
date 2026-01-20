// src/components/UnifiedIcons.tsx
// Cohesive icon set with consistent stroke weight and style

import React from "react";

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  // Allow passing other SVG props
  [key: string]: any;
};

const STROKE_WIDTH = 1.5;
const COLOR = "currentColor";

// =============================================================================
// WEATHER ICONS
// =============================================================================

export function SunIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloudIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WindIcon({ size = 24, className, style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      style={style}
      {...props}
    >
      <path
        d="M9.59 4.59A2 2 0 1 1 11 8H2M10.59 19.41A2 2 0 1 0 12 16H2M14.5 8A2.5 2.5 0 1 1 16 12H2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThermometerIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill={COLOR} />
    </svg>
  );
}

export function DropletsIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// LOCATION & MAP ICONS
// =============================================================================

export function MapPinIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// This matches the "LocationIcon" expected by CatchLog (crosshair style)
export function LocationIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" strokeLinecap="round" />
      <path d="M12 18v4" strokeLinecap="round" />
      <path d="M2 12h4" strokeLinecap="round" />
      <path d="M18 12h4" strokeLinecap="round" />
    </svg>
  );
}

export function TargetIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill={COLOR} />
    </svg>
  );
}

export function MapIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M1 6v14l6-2 10 4 6-2V6l-6 2-10-4-6 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 4v16M17 4v16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RadarIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12l4.5 -4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// =============================================================================
// TIME & CALENDAR
// =============================================================================

export function CalendarIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" />
    </svg>
  );
}

// =============================================================================
// FISHING & WATER
// =============================================================================

export function WavesIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M2 12c.6 0 1-.4 1.5-.9.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9M2 18c.6 0 1-.4 1.5-.9.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FishIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M6.5 12c.94-3.46 4.94-6 9.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-4.44 6-7 6-4.56 0-8.56-2.54-9.5-6z"
        strokeLinejoin="round"
      />
      <path d="M18 12h.01M2 12h4M22 12h-4" strokeLinecap="round" />
      <circle cx="16" cy="12" r="1" fill={COLOR} />
    </svg>
  );
}

// =============================================================================
// UI ICONS
// =============================================================================

export function PlusIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
    </svg>
  );
}

export function BackIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <polyline
        points="15 18 9 12 15 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EditIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="13"
        r="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <line
        x1="21"
        y1="21"
        x2="16.65"
        y2="16.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronUpIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 1v6m0 6v6M3.93 3.93l4.24 4.24m8.48 8.48l4.24 4.24M1 12h6m6 0h6M3.93 20.07l4.24-4.24m8.48-8.48l4.24-4.24"
        strokeLinecap="round"
      />
    </svg>
  );
}

// =============================================================================
// MISC & UTILITY
// =============================================================================

export function ActivityIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M22 12h-4l-3 9L9 3l-3 9H2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendingUpIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M22 7l-8.5 8.5-5-5L2 17M16 7h6v6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PackageIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompassIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path
        d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BarChartIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M12 20V10M18 20V4M6 20v-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LayersIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <polygon
        points="12 2 2 7 12 12 22 7 12 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="2 17 12 22 22 17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="2 12 12 17 22 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PinIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <line
        x1="12"
        y1="17"
        x2="12"
        y2="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({
  size = 24,
  className,
  filled,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#FFD700" : "none"}
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={filled ? "#FFD700" : COLOR}
      {...props}
    >
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke="#ff6b6b"
      {...props}
    >
      <polyline
        points="3 6 5 6 21 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SaveIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="17 21 17 13 7 13 7 21"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="7 3 7 8 15 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH * 1.5}
      stroke="#10B981"
      {...props}
    >
      <polyline
        points="20 6 9 17 4 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrosshairIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

export function FilterIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function ArrowLeftIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function TrophyIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export function XIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Map Orb
type MapOrbProps = {
  size?: number;
  className?: string;
  color?: string;
};

export const MapOrb = ({
  size = 24,
  className = "",
  color = "#4A90E2",
}: MapOrbProps) => (
  <div
    className={`map-orb-container ${className}`}
    style={{ width: size, height: size }}
  >
    {/* Apply dynamic color via inline style to override CSS defaults */}
    <div
      className="orb-core"
      style={{ background: color, boxShadow: `0 0 10px ${color}` }}
    />
    <div className="orb-pulse" style={{ borderColor: color }} />

    <style>{`
      .map-orb-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .orb-core {
        width: 45%;
        height: 45%;
        border-radius: 50%;
        z-index: 2;
      }
      .orb-pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid transparent; 
        border-radius: 50%;
        animation: orb-pulsate 2s infinite ease-out;
        opacity: 0;
      }
      @keyframes orb-pulsate {
        0% { transform: scale(0.5); opacity: 0.8; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    `}</style>
  </div>
);
