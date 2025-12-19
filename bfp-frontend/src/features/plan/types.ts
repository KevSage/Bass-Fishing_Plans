// src/features/plan/types.ts

export type Geo = {
  zip?: string;
  lat?: number;
  lon?: number;
  name?: string | null;
};

export type PlanConditions = {
  location_name?: string;
  latitude?: number;
  longitude?: number;
  temp_f?: number;
  wind_speed?: number;
  sky_condition?: string;
  month?: number;
  clarity?: string | null;
  bottom_composition?: string | null;
  forage?: string[] | null;
  depth_ft?: number | null;
  snapshot_hash?: string;

  // critical flags (as seen in your payload)
  is_preview?: boolean;
};

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
  is_preview?: boolean; // (some backends also put it here)
};

// What your backend actually returns (top-level object)
export type PlanResponse = {
  geo: Geo;
  plan: PlanCore;
  markdown?: string;
  day_progression?: string[];
  rewritten?: boolean;
  timing?: any;

  // optional: if backend later returns artifact URLs at top-level
  artifacts?: any;
};
