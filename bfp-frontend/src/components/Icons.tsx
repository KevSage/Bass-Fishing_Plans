// src/components/Icons.tsx
// Simple SVG icons for Bass Fishing Plans

import React from "react";

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
};

// Weather Icons
export function SunIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloudIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WindIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThermometerIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Lure Type Icons
export function CrankbaitIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
    >
      <ellipse cx="12" cy="12" rx="8" ry="5" opacity="0.8" />
      <path
        d="M4 12 L2 10 M20 12 L22 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="11" r="1.5" fill="#fff" />
    </svg>
  );
}

export function JigIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
    >
      <circle cx="12" cy="8" r="4" />
      <path
        d="M12 12 L8 20 M12 12 L16 20 M12 12 L10 22 M12 12 L14 22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function SpinnerbaitIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="18" cy="6" r="3" fill="#FFD700" opacity="0.8" />
      <path d="M18 9 L12 12" stroke={color} strokeWidth="2" />
      <path
        d="M12 12 L8 20 M12 12 L16 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function FrogIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
    >
      <ellipse cx="12" cy="12" rx="6" ry="4" />
      <circle cx="9" cy="10" r="1.5" fill="#fff" />
      <circle cx="15" cy="10" r="1.5" fill="#fff" />
      <path
        d="M6 12 L4 14 M18 12 L20 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SoftPlasticIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 4 Q16 8 12 12 Q8 16 12 20"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill={color}
        fillOpacity="0.3"
      />
    </svg>
  );
}

// Target/Location Icons
export function TargetIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function MapPinIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

// Phase Icons
export function CalendarIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FishIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      fillOpacity="0.8"
      className={className}
    >
      <path d="M2 12 Q4 8 10 10 Q14 11 18 12 Q22 13 22 12 Q22 11 18 12 Q14 13 10 14 Q4 16 2 12 Z" />
      <circle cx="16" cy="11" r="1" fill="#fff" />
      <path
        d="M22 12 L24 10 M22 12 L24 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// UI Icons
export function CheckIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRightIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon({
  size = 24,
  color = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
      <path
        d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
