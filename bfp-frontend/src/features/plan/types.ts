// src/features/plan/types.ts
// Updated to match new backend API response

export type Geo = {
  zip?: string;
  lat?: number;
  lon?: number;
  name?: string | null;
};

export type PlanConditions = {
  location_name: string;
  latitude: number;
  longitude: number;
  trip_date: string;
  phase: string;
  temp_f: number;
  temp_high: number;
  temp_low: number;
  wind_speed: number;
  sky_condition: string;
  subscriber_email?: string | null;
};

export type ColorZones = {
  primary_color: string;
  secondary_color: string | null;
  accent_color: string | null;
  accent_material: "metallic" | null;
  primary_material: "metallic" | null;
  asset_key: string; // e.g., "spinnerbait__chartreuse_white__gold.png"
  warnings?: string[];
};

export type Target =
  | {
      name: string;
      definition?: string;
    }
  | string; // Support both new format {name, definition} and legacy string format

export type Pattern = {
  presentation: string;
  base_lure: string;
  color_recommendations: string[];
  colors: ColorZones;
  targets: Target[];
  why_this_works: string;
  work_it: string[];
  gear?: {
    rod: string;
    reel: string;
    line: string;
    technique: string;
  };
  strategy?: string[];
  pattern_summary?: string;
};

// Preview plan (single pattern)
export type PreviewPlan = {
  presentation: string;
  base_lure: string;
  color_recommendations: string[];
  colors: ColorZones;
  targets: Target[];
  why_this_works?: string;
  work_it: string[];
  day_progression: string[];
  outlook_blurb: string;
  conditions: PlanConditions;
};

// Member plan (dual patterns)
export type MemberPlan = {
  primary: Pattern;
  secondary: Pattern;
  day_progression: string[];
  outlook_blurb: string;
  conditions: PlanConditions;
};

// Unified plan type
export type Plan = PreviewPlan | MemberPlan;

// Check if plan is member plan
export function isMemberPlan(plan: Plan): plan is MemberPlan {
  return "primary" in plan && "secondary" in plan;
}

// API Response from /plan/generate
export type PlanGenerateResponse = {
  plan_url: string;
  token: string;
  is_member: boolean;
  email_sent: boolean;
  plan: Plan;
};

// API Response from /plan/view/{token}
export type PlanViewResponse = {
  plan: Plan;
  is_member: boolean;
  created_at: number;
  views: number;
  download_urls: {
    mobile_dark: string;
    a4_printable: string;
  };
};

// Rate limit error response
export type RateLimitError = {
  error: "rate_limit_preview" | "rate_limit_member";
  message: string;
  seconds_remaining: number;
  upgrade_url?: string;
};

// Legacy types for backward compatibility (can remove later)
export type LureSpec = {
  display_name?: string;
  lure_family?: string;
  rig_style?: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  components?: string[] | null;
};

export type Pattern2 = {
  presentation_family?: string;
  recommended_lures?: string[];
  color_recommendations?: string[];
  recommended_targets?: string[];
  primary_lure_spec?: LureSpec;
  alternate_lure_specs?: LureSpec[];
  trailer_notes?: string[];
};

export type PlanCore = {
  phase?: string;
  depth_zone?: string;
  primary_presentation_family?: string;
  counter_presentation_family?: string;
  primary_technique?: string;
  featured_lure_name?: string;
  featured_lure_family?: string;
  pattern_summary?: string;
  recommended_lures?: string[];
  color_recommendations?: string[];
  recommended_targets?: string[];
  strategy_tips?: string[];
  lure_setups?: any[];
  primary_lure_spec?: LureSpec;
  alternate_lure_specs?: LureSpec[];
  trailer_notes?: string[];
  pattern_2?: Pattern2;
  conditions?: PlanConditions;
  trip_date?: string;
  is_future_trip?: boolean;
  is_preview?: boolean;
};

export type PlanResponse = {
  geo: Geo;
  plan: PlanCore;
  markdown?: string;
  day_progression?: string[];
  rewritten?: boolean;
  timing?: any;
  artifacts?: any;
};
