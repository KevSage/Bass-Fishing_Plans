// src/features/plan/types.ts
// Updated for Hybrid Restoration (Awestruck Weather + Creative Guide Voice)

export type Geo = {
  zip?: string;
  lat?: number;
  lon?: number;
  name?: string | null;
};

// New Forecast Rating Object
export type ForecastRating = {
  score: number;
  rating:
    | "AGGRESSIVE"
    | "ACTIVE"
    | "OPPORTUNISTIC"
    | "SELECTIVE"
    | "DEFENSIVE"
    | string;
  explanation: string;
};

// Updated to allow the merged weather_insights from PlanScreen
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

  // ✅ ADDED: Allows WeatherSection to receive the AI analysis
  weather_insights?: string[];

  // ✅ ADDED: Forecast Rating for the Badge
  forecast_rating?: ForecastRating | null;

  // ✅ ADDED: Weather insights for the modal
  weather_card_insights?: {
    temperature?: string | null;
    wind?: string | null;
    pressure?: string | null;
    sky_uv?: string | null;
  } | null;
};

export type ColorZones = {
  primary_color: string;
  secondary_color: string | null;
  accent_color: string | null;
  accent_material: "metallic" | null;
  primary_material: "metallic" | null;
  asset_key: string;
  warnings?: string[];
};

// The new card format for "How to Fish"
export type WorkItTarget = {
  name: string;
  definition: string;
  how_to_fish: string; // The LLM-generated expert advice
};

export type Pattern = {
  presentation: string;
  base_lure: string;

  // Terminal Tackle / Trailers
  soft_plastic?: string | null;
  soft_plastic_why?: string | null;
  trailer?: string | null;
  trailer_why?: string | null;

  // Colors
  color_recommendations: string[]; // The strings from the LLM (e.g., "Green Pumpkin")
  colors: ColorZones; // The visual assets for the UI

  // Targets & Strategy
  targets: string[]; // ✅ UPDATED: Now just strings (names). Details are in work_it_cards.
  why_this_works: string;
  strategy?: string;
  pattern_summary?: string;

  // Tactical Advice
  work_it?: string[]; // Legacy fallback
  work_it_cards?: WorkItTarget[]; // ✅ NEW: Rich cards with 'how_to_fish'

  gear?: {
    rod: string;
    reel: string;
    line: string;
    technique?: string;
  };
};

export type Plan = {
  // ✅ ADDED: Missing root fields
  location: string;

  // ✅ ADDED: Forecast Rating (Root Level from LLM)
  forecast_rating?: ForecastRating;

  weather_card_insights?: {
    temperature: string;
    wind: string;
    pressure: string;
    sky_uv: string;
  };

  primary: Pattern;
  secondary: Pattern;

  day_progression?: string[];
  outlook_blurb: string;
  conditions: PlanConditions;
};

// API Response from /plan/generate
export type PlanGenerateResponse = {
  plan_url: string;
  token: string;
  email_sent: boolean;
  plan: Plan;
};

// API Response from /plan/view/{token}
export type PlanViewResponse = {
  plan: Plan;
  created_at: number;
  views: number;
};

export type RateLimitError = {
  error: "rate_limit_member";
  message: string;
  seconds_remaining: number;
};

// --- LEGACY TYPES (Keep for safety, but marked as legacy) ---

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
