/**
 * Bass Clarity Design System Colors
 * Matches the web app color scheme
 */
export const colors = {
  // Primary brand colors
  primary: '#4A90E2',
  primaryLight: '#93c5fd',
  primaryDark: '#2563eb',

  // Background colors
  background: '#0a0a0a',
  surface: '#141419',
  surfaceLight: '#1e293b',

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.4)',
  },

  // Border colors
  border: {
    default: 'rgba(255, 255, 255, 0.08)',
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
  },

  // Status colors
  success: '#10b981',
  warning: '#fbbf24',
  error: '#ff6b6b',
  errorBackground: 'rgba(255, 0, 0, 0.1)',
  warningBackground: 'rgba(251, 191, 36, 0.1)',

  // Accent colors
  accent: {
    orange: '#f59e0b',
    purple: '#8b5cf6',
    green: '#10b981',
  },

  // Gradient backgrounds
  gradients: {
    proBadge: ['#3b82f6', '#8b5cf6'],
  },
} as const;
