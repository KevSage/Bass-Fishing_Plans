/**
 * Demo Catches for iOS App Store Screenshots
 *
 * Toggle ENABLE_DEMO_CATCHES to true to inject demo data on app load.
 * Set back to false before production builds.
 *
 * All coordinates are HARDCODED on-water locations verified against Lake Lanier satellite imagery.
 * Lures and colors are validated against pools.py canon.
 */

// ==========================================
// TOGGLE THIS FOR SCREENSHOT BUILDS
// ==========================================
const ENABLE_DEMO_CATCHES = true;
// ==========================================

// Lake Lanier center coordinates (for lakeLat/lakeLng filtering)
const LAKE_LANIER_LAT = 34.29;
const LAKE_LANIER_LNG = -83.96;

// Lure-color pairs validated against pools.py LURE_COLOR_POOL_MAP
const LURE_COLOR_PAIRS: { lure: string; colors: string[] }[] = [
  // Rigs (RIG_COLORS)
  { lure: "texas rig", colors: ["green pumpkin", "black/blue", "watermelon red", "junebug"] },
  { lure: "carolina rig", colors: ["green pumpkin", "watermelon", "baby bass"] },
  { lure: "shaky head", colors: ["green pumpkin", "morning dawn", "black/blue"] },
  { lure: "ned rig", colors: ["green pumpkin", "black", "watermelon"] },
  { lure: "dropshot", colors: ["green pumpkin", "morning dawn", "watermelon red"] },
  { lure: "neko rig", colors: ["green pumpkin", "watermelon red"] },
  { lure: "wacky rig", colors: ["green pumpkin", "watermelon"] },
  // Bladed/Skirted (BLADED_SKIRTED_COLORS)
  { lure: "chatterbait", colors: ["white", "shad", "chartreuse/white", "black/blue"] },
  { lure: "spinnerbait", colors: ["white", "chartreuse/white", "shad"] },
  { lure: "swim jig", colors: ["bluegill", "green pumpkin", "shad"] },
  { lure: "football jig", colors: ["green pumpkin", "black/blue", "brown"] },
  { lure: "casting jig", colors: ["black/blue", "green pumpkin", "peanut butter & jelly"] },
  // Crankbaits (CRANKBAIT_COLORS)
  { lure: "shallow crankbait", colors: ["sexy shad", "red craw", "chartreuse/black"] },
  { lure: "mid crankbait", colors: ["sexy shad", "bluegill", "ghost shad"] },
  { lure: "deep crankbait", colors: ["sexy shad", "citrus shad"] },
  { lure: "lipless crankbait", colors: ["red craw", "chrome", "gold"] },
  // Jerkbaits (JERKBAIT_COLORS)
  { lure: "jerkbait", colors: ["pro blue", "ghost minnow", "table rock", "bone"] },
  // Topwater (TOPWATER_COLORS)
  { lure: "walking bait", colors: ["bone", "chrome", "shad"] },
  { lure: "whopper plopper", colors: ["bone", "shad", "bluegill"] },
  // Frogs (FROG_COLORS)
  { lure: "hollow body frog", colors: ["green", "black", "white"] },
  { lure: "popping frog", colors: ["green", "brown", "black"] },
  // Soft swimbaits (SOFT_SWIMBAIT_COLORS)
  { lure: "paddle tail swimbait", colors: ["white", "shad", "pearl"] },
  { lure: "underspin", colors: ["white", "shad", "pearl"] },
];

const SPECIES: ("largemouth" | "smallmouth" | "spotted")[] = ["largemouth", "smallmouth", "spotted"];
const CONDITIONS = ["Clear", "Partly Cloudy", "Overcast"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(): string {
  return `demo-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate random date in 2019-2021 (before 2022)
function randomDateBefore2022(): string {
  const start = new Date("2019-03-01").getTime();
  const end = new Date("2021-12-15").getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString();
}

function makeCatch(lat: number, lng: number): any {
  const pair = randomItem(LURE_COLOR_PAIRS);
  return {
    id: makeId(),
    lakeName: "Lake Lanier",
    lakeId: "lake-lanier-ga",
    species: randomItem(SPECIES),
    lure: pair.lure,
    color: randomItem(pair.colors),
    weight: (0.5 + Math.random() * 1.4).toFixed(2), // 0.5 - 1.9 lbs (under 2)
    notes: "",
    photoUrl: "/demo/sample.jpg",
    caughtAt: randomDateBefore2022(),
    catchLat: lat,
    catchLng: lng,
    source: "demo",
    weather: {
      temp: Math.floor(55 + Math.random() * 30),
      conditions: randomItem(CONDITIONS),
    },
  };
}

// ==========================================
// ON-WATER COORDINATES - 40 catches spread across lake
// Based on visible lake body in Mapbox dark style
// ==========================================

const DEMO_CATCHES: any[] = [
  // ========== HOT ZONE: Main lake center (8 catches) ==========
  makeCatch(34.2500, -83.9550),
  makeCatch(34.2505, -83.9545),
  makeCatch(34.2495, -83.9555),
  makeCatch(34.2502, -83.9552),
  makeCatch(34.2498, -83.9548),
  makeCatch(34.2503, -83.9553),
  makeCatch(34.2497, -83.9547),
  makeCatch(34.2501, -83.9551),

  // ========== MODERATE ZONE 1: South of center (6 catches) ==========
  makeCatch(34.2200, -83.9700),
  makeCatch(34.2205, -83.9695),
  makeCatch(34.2195, -83.9705),
  makeCatch(34.2202, -83.9702),
  makeCatch(34.2198, -83.9698),
  makeCatch(34.2203, -83.9703),

  // ========== MODERATE ZONE 2: North of center (5 catches) ==========
  makeCatch(34.2800, -83.9400),
  makeCatch(34.2805, -83.9395),
  makeCatch(34.2795, -83.9405),
  makeCatch(34.2802, -83.9402),
  makeCatch(34.2798, -83.9398),

  // ========== MODERATE ZONE 3: Southeast section (4 catches) ==========
  makeCatch(34.2300, -83.9300),
  makeCatch(34.2305, -83.9295),
  makeCatch(34.2295, -83.9305),
  makeCatch(34.2302, -83.9302),

  // ========== SCATTERED SINGLES: Spread across visible water (17 catches) ==========
  makeCatch(34.2100, -83.9600), // South
  makeCatch(34.2150, -83.9550), // South-central
  makeCatch(34.2250, -83.9650), // Central-south
  makeCatch(34.2350, -83.9500), // Central
  makeCatch(34.2450, -83.9600), // Central
  makeCatch(34.2550, -83.9450), // Central-north
  makeCatch(34.2650, -83.9500), // North
  makeCatch(34.2700, -83.9350), // North
  makeCatch(34.2750, -83.9450), // North
  makeCatch(34.2850, -83.9300), // Far north
  makeCatch(34.2600, -83.9600), // Central
  makeCatch(34.2400, -83.9450), // Central
  makeCatch(34.2300, -83.9550), // Central-south
  makeCatch(34.2180, -83.9700), // South
  makeCatch(34.2280, -83.9400), // Central
  makeCatch(34.2380, -83.9650), // Central
  makeCatch(34.2480, -83.9350), // Central-north
];

export function injectDemoCatches(): void {
  console.log("[Demo] injectDemoCatches called, ENABLE_DEMO_CATCHES:", ENABLE_DEMO_CATCHES);
  if (!ENABLE_DEMO_CATCHES) return;

  const CACHE_KEY = "bc_api_catches_cache";
  const existing: unknown[] = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  console.log("[Demo] Existing cache entries:", existing.length);

  // Always replace demo catches to ensure fresh coordinates
  const nonDemoEntries = existing.filter((c: any) => c.source !== "demo");

  // Add lakeLat/lakeLng to all demo catches
  const demoCatchesWithLakeCoords = DEMO_CATCHES.map((c) => ({
    ...c,
    lakeLat: LAKE_LANIER_LAT,
    lakeLng: LAKE_LANIER_LNG,
  }));

  const merged = [...demoCatchesWithLakeCoords, ...nonDemoEntries];
  localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  console.log(`[Demo] Injected ${DEMO_CATCHES.length} demo catches for Lake Lanier (total: ${merged.length})`);
}
