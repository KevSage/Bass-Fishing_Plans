// src/components/UnifiedIcons.tsx
// Cohesive icon set with consistent stroke weight and style

import React from "react";

// In UnifiedIcons.tsx, change:
type IconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties; // ADD THIS
};

const STROKE_WIDTH = 1.5;
const COLOR = "currentColor";

// Weather Icons - Consistent stroke style
export function SunIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloudIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WindIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
      style={style} // ADD THIS
    >
      <path
        d="M9.59 4.59A2 2 0 1 1 11 8H2M10.59 19.41A2 2 0 1 0 12 16H2M14.5 8A2.5 2.5 0 1 1 16 12H2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThermometerIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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

export function DropletsIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Location Icons
export function MapPinIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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

export function TargetIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill={COLOR} />
    </svg>
  );
}

// Time/Calendar
export function CalendarIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" />
    </svg>
  );
}

// Fishing/Water
export function WavesIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <path
        d="M2 12c.6 0 1-.4 1.5-.9.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9M2 18c.6 0 1-.4 1.5-.9.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9s1-.4 1.5-.9c.5-.4 1.2-.9 1.5-.9s1 .5 1.5.9c.5.5.9.9 1.5.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FishIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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

// Activity/Action
export function ActivityIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <path
        d="M22 12h-4l-3 9L9 3l-3 9H2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendingUpIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <path
        d="M22 7l-8.5 8.5-5-5L2 17M16 7h6v6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// UI Icons
export function CheckCircleIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
    >
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 1v6m0 6v6M3.93 3.93l4.24 4.24m8.48 8.48l4.24 4.24M1 12h6m6 0h6M3.93 20.07l4.24-4.24m8.48-8.48l4.24-4.24"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Gear/Equipment
export function PackageIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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
// Gear/Equipment
export function CompassIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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

// Gear/Equipment
export function BarChartIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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

// Gear/Equipment
export function ChevronRightIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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

// Gear/Equipment
export function LayersIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      strokeWidth={STROKE_WIDTH}
      stroke={COLOR}
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
