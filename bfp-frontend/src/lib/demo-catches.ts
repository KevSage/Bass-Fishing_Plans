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
const ENABLE_DEMO_CATCHES = false;
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
// ON-WATER COORDINATES - 1 demo catch
// Shown until user logs their first catch
// ==========================================

const DEMO_CATCHES: any[] = [
  makeCatch(34.2500, -83.9550), // Lake center
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
