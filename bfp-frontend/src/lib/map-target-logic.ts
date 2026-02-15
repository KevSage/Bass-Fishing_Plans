// src/lib/map-target-logic.ts

// Define the structure of our recommendation
export type SpatialTarget = {
  headline: string;
  subtext: string;
  icon: "wind" | "sun" | "cloud" | "storm" | "calm" | "cold";
  targets: string[];
};

// Weather snapshot for change detection
export type WeatherSnapshot = {
  temp: number;
  wind: number;
  pressure: number;
  sky: string;
  isRaining: boolean;
};

/**
 * Extracts key weather metrics for comparison
 */
export function getWeatherSnapshot(weather: any): WeatherSnapshot | null {
  if (!weather) return null;
  return {
    temp: Number(weather.temp_f || 0),
    wind: Number(weather.wind_mph || weather.wind_speed || 0),
    pressure: Number(weather.pressure_mb || 0),
    sky: (weather.sky_condition || weather.cloud_cover || "").toLowerCase(),
    isRaining: (weather.precipitation_1h || 0) > 0,
  };
}

/**
 * Detects if weather has changed significantly enough to warrant a new alert.
 * Returns true if conditions have meaningfully shifted.
 */
export function hasWeatherChanged(
  previous: WeatherSnapshot | null,
  current: WeatherSnapshot | null
): boolean {
  if (!previous || !current) return false;

  // Temperature shift > 8°F
  if (Math.abs(current.temp - previous.temp) >= 8) return true;

  // Wind change > 8 mph
  if (Math.abs(current.wind - previous.wind) >= 8) return true;

  // Pressure change > 6 mb (significant frontal movement)
  if (Math.abs(current.pressure - previous.pressure) >= 6) return true;

  // Sky condition changed (clear <-> cloudy <-> rain)
  const prevSky = categorizesky(previous.sky, previous.isRaining);
  const currSky = categorizesky(current.sky, current.isRaining);
  if (prevSky !== currSky) return true;

  // Rain started or stopped
  if (previous.isRaining !== current.isRaining) return true;

  return false;
}

// Helper to categorize sky into simple buckets
function categorizesky(sky: string, isRaining: boolean): string {
  if (isRaining) return "rain";
  if (sky.includes("clear")) return "clear";
  if (sky.includes("overcast") || sky.includes("cloud")) return "cloudy";
  return "other";
}

/**
 * Translates raw weather data into a specific "Where to Look" map strategy.
 * A robust decision engine for the freemium Map Insight feature.
 */
export function getMapTargetRecommendation(weather: any): SpatialTarget | null {
  if (!weather) return null;

  // ------------------------------------------------------
  // 1. DATA NORMALIZATION & SIGNAL EXTRACTION
  // ------------------------------------------------------
  const wind = Number(weather.wind_mph || weather.wind_speed || 0);
  const gust = Number(weather.wind_gust_mph || 0);
  const clouds = (weather.cloud_cover || "").toLowerCase();
  const sky = (weather.sky_condition || "").toLowerCase();
  const pressureTrend = (weather.pressure_trend || "").toLowerCase();
  const isRaining = (weather.precipitation_1h || 0) > 0;
  const temp = Number(weather.temp_f || 0);
  const uv = Number(weather.uv_index || 0);
  const humidity = Number(weather.humidity || 50);

  // Derived Signals
  const isFreezing = temp < 40;
  const isCold = temp >= 40 && temp < 55;
  const isWarm = temp >= 55 && temp < 75;
  const isHot = temp >= 75;

  const isWindy = wind >= 12 || gust >= 20;
  const isBreezy = wind >= 6 && wind < 12;
  const isCalm = wind < 6;

  const isOvercast = clouds.includes("overcast") || clouds.includes("cloud") || isRaining;
  const isSunny = !isOvercast && (sky.includes("clear") || uv > 5);

  const isFallingPressure = pressureTrend.includes("falling");
  const isRisingPressure = pressureTrend.includes("rising");

  // Time-based signals (if available)
  const hour = new Date().getHours();
  const isLowLight = hour < 7 || hour > 18; // Dawn/dusk windows

  // ------------------------------------------------------
  // 2. SAFETY OVERRIDES (Highest Priority)
  // ------------------------------------------------------
  if (wind > 25 || gust > 35) {
    return {
      headline: "High Wind Warning",
      subtext: "Conditions are dangerous. Stick to protected creeks or stay off the water.",
      icon: "storm",
      targets: ["creek channels", "marina", "protected bays"],
    };
  }

  if (isRaining && pressureTrend.includes("falling")) {
    return {
      headline: "Storm Front Active",
      subtext: "Barometer is dropping. Fish will feed heavily before conditions worsen.",
      icon: "storm",
      targets: ["feeder creeks", "drains", "shallow flats"],
    };
  }

  // ------------------------------------------------------
  // 3. COLD WATER LOGIC (< 55°F)
  // ------------------------------------------------------
  if (isFreezing || isCold) {
    // Cold + Sun = Warming Trends
    if (isSunny) {
      return {
        headline: "Solar Heating",
        subtext: "Sun is warming rocks and hard cover. Fish will slide shallow in the afternoon.",
        icon: "sun",
        targets: ["riprap", "rocky banks", "north-shore pockets"],
      };
    }
    // Cold + Wind = Discomfort
    if (isWindy) {
      return {
        headline: "Winter Stability",
        subtext: "Wind chill is cooling the shallows. Fish are retreating to stable deep water.",
        icon: "cold",
        targets: ["deep offshore structure", "creek channels", "bluff walls"],
      };
    }
    // Cold + Overcast = Roaming
    return {
      headline: "Cold Water Roaming",
      subtext: "Low light allows winter bass to hunt bait balls in open water.",
      icon: "cloud",
      targets: ["channel swings", "ditches", "depth breaks"],
    };
  }

  // ------------------------------------------------------
  // 4. PRESSURE & FRONTAL LOGIC
  // ------------------------------------------------------

  // Post-Frontal (The "Lockjaw" Phase)
  if (isRisingPressure && isSunny && isCalm) {
    return {
      headline: "Post-Frontal Finesse",
      subtext: "High pressure has pushed fish tight to cover or deep. They won't chase.",
      icon: "sun",
      targets: ["brush piles", "deep docks", "standing timber"],
    };
  }

  // Pre-Frontal (The "Feed" Phase)
  if (isFallingPressure && isWindy) {
    return {
      headline: "Aggressive Pre-Front",
      subtext: "Pressure is dropping. Bass are aggressively hunting on wind-blown spots.",
      icon: "wind",
      targets: ["wind-blown banks", "points", "grass edges"],
    };
  }

  // Falling pressure alone
  if (isFallingPressure) {
    return {
      headline: "Active Feeding Window",
      subtext: "Pressure drop is triggering feeding activity. Fish are on the move.",
      icon: "storm",
      targets: ["grass edges", "channel swings", "flats"],
    };
  }

  // ------------------------------------------------------
  // 5. LOW LIGHT CONDITIONS (Dawn/Dusk)
  // ------------------------------------------------------
  if (isLowLight && isCalm) {
    return {
      headline: "Prime Low-Light",
      subtext: "Dawn/dusk window with calm water. Fish are pushing shallow to feed.",
      icon: "calm",
      targets: ["shallow flats", "topwater lanes", "seawalls"],
    };
  }

  if (isLowLight && isBreezy) {
    return {
      headline: "Active Twilight",
      subtext: "Light breeze during low light. Bass are cruising and aggressive.",
      icon: "wind",
      targets: ["points", "grass lines", "riprap"],
    };
  }

  // ------------------------------------------------------
  // 6. WIND & LIGHT COMBINATIONS
  // ------------------------------------------------------

  // Windy + Sunny (Flash/Reaction)
  if (isWindy && isSunny) {
    return {
      headline: "Wind-Blown Flash",
      subtext: "Wind breaks up the sunlight. Bass are ambushing bait in the chop.",
      icon: "wind",
      targets: ["spinnerbait banks", "wind-blown points", "mudlines"],
    };
  }

  // Windy + Cloudy (Power Fishing)
  if (isWindy && isOvercast) {
    return {
      headline: "Power Fishing Window",
      subtext: "Low light and wind create the perfect camouflage for shallow hunting.",
      icon: "cloud",
      targets: ["shallow flats", "grass lines", "stumps"],
    };
  }

  // Breezy conditions
  if (isBreezy && isSunny) {
    return {
      headline: "Light Chop Advantage",
      subtext: "Light wind creates surface disturbance. Fish are less spooky.",
      icon: "wind",
      targets: ["points", "offshore structure", "weedlines"],
    };
  }

  // Calm + Sunny (Shade/Depth)
  if (isCalm && isSunny) {
    if (isHot) {
      return {
        headline: "Seeking Shade",
        subtext: "Sun is high. Fish are buried in shade or positioned under docks.",
        icon: "sun",
        targets: ["docks", "overhanging trees", "matted grass"],
      };
    } else {
      return {
        headline: "Finesse & Sight",
        subtext: "High visibility means fish are spooky. Back off and use finesse.",
        icon: "calm",
        targets: ["clear water pockets", "deep weedlines", "offshore humps"],
      };
    }
  }

  // Calm + Cloudy (Topwater/Cruising)
  if (isCalm && isOvercast) {
    return {
      headline: "Topwater Conditions",
      subtext: "Cloud cover extends the bite window. Bass are roaming away from cover.",
      icon: "cloud",
      targets: ["topwater lanes", "shallow bars", "open pockets"],
    };
  }

  // ------------------------------------------------------
  // 7. HUMIDITY & COMFORT (Secondary Factor)
  // ------------------------------------------------------
  if (humidity > 80 && isWarm && isOvercast) {
    return {
      headline: "Muggy & Active",
      subtext: "High humidity and cloud cover. Fish are comfortable and feeding.",
      icon: "cloud",
      targets: ["shallow cover", "grass edges", "laydowns"],
    };
  }

  // ------------------------------------------------------
  // 8. SEASONAL DEFAULTS (Based on Temperature)
  // ------------------------------------------------------

  if (isHot) {
    return {
      headline: "Summer Patterns",
      subtext: "Fish are either deep on structure or buried in heavy cover.",
      icon: "sun",
      targets: ["ledges", "main lake points", "deep docks"],
    };
  }

  if (isWarm) {
    return {
      headline: "Transition Zones",
      subtext: "Fish are moving between spawning bays and main lake structure.",
      icon: "calm",
      targets: ["secondary points", "creek channel swings", "riprap"],
    };
  }

  // Fallback
  return {
    headline: "Structure & Edges",
    subtext: "Conditions are stable. Focus on high-percentage structural elements.",
    icon: "calm",
    targets: ["depth breaks", "hard-bottom transitions", "offshore points"],
  };
}
