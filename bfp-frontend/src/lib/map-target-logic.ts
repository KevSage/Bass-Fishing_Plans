// src/utils/mapTargetLogic.ts

// Define the structure of our recommendation
export type SpatialTarget = {
  headline: string;
  subtext: string;
  icon: "wind" | "sun" | "cloud" | "storm" | "calm" | "cold";
  targets: string[]; // These match keys in target_definitions.py
};

/**
 * Translates raw weather data into a specific "Where to Look" map strategy.
 * Mirrors the logic in lure_selection_policy.py (Section I, Step 2.5).
 */
export function getMapTargetRecommendation(weather: any): SpatialTarget | null {
  if (!weather) return null;

  // Normalize inputs
  const wind = Number(weather.wind_mph || weather.wind_speed || 0);
  const gust = Number(weather.wind_gust_mph || 0);
  const clouds = (weather.cloud_cover || "").toLowerCase();
  const sky = (weather.sky_condition || "").toLowerCase();
  const pressureTrend = (weather.pressure_trend || "").toLowerCase();
  const isRaining = (weather.precipitation_1h || 0) > 0;
  const temp = Number(weather.temp_f || 0);

  // 1. FREEZING / WINTER (Priority Override)
  // If it's freezing, wind/sun matter less than stability.
  if (temp < 45) {
    return {
      headline: "Winter Stability",
      subtext:
        "Bass are lethargic and seeking stable deep water. Avoid shallow current.",
      icon: "cold",
      targets: ["deep offshore structure", "creek channels", "depth breaks"],
    };
  }

  // 2. WIND DOMINANT (>12mph)
  // As per Policy: Prioritize wind-blown banks, current breaks. Remove deep offshore (boat control).
  if (wind > 12 || gust > 20) {
    return {
      headline: "Wind-Blown Structure",
      subtext:
        "Baitfish are being pinned against shoreline structure. Active feeding zone.",
      icon: "wind",
      targets: ["wind-blown banks", "current breaks", "offshore points"],
    };
  }

  // 3. STORM / FALLING PRESSURE
  // As per Policy: Aggressive feeding window.
  if (pressureTrend.includes("falling") || isRaining) {
    return {
      headline: "Active Feeding Lanes",
      subtext: "Falling pressure has triggered a move to ambush points.",
      icon: "storm",
      targets: ["grass edges", "channel swings", "flats"],
    };
  }

  // 4. HIGH SUN / BLUEBIRD SKIES
  // As per Policy: Shade becomes critical.
  if (sky.includes("clear") || (weather.uv_index || 0) > 6) {
    return {
      headline: "Deep Shade & Hard Cover",
      subtext: "High sun drives fish into the shadows or deep structure.",
      icon: "sun",
      targets: ["docks", "shaded banks", "brush piles"],
    };
  }

  // 5. LOW LIGHT / OVERCAST
  // As per Policy: Remove 'shaded banks'. Substitute roaming areas.
  if (clouds.includes("overcast") || clouds.includes("cloud")) {
    return {
      headline: "Roaming Zones",
      subtext: "Low light allows bass to hunt away from cover.",
      icon: "cloud",
      targets: ["flats", "transitions", "offshore points"],
    };
  }

  // 6. DEFAULT / CALM
  // Standard structural fishing.
  return {
    headline: "Structure & Transitions",
    subtext:
      "Conditions are stable. Focus on high-percentage structural elements.",
    icon: "calm",
    targets: ["depth breaks", "hard-bottom transitions", "offshore points"],
  };
}
