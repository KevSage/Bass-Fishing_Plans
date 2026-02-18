/**
 * Demo Catches for iOS App Store Screenshots
 *
 * Toggle ENABLE_DEMO_CATCHES to true to inject demo data on app load.
 * Set back to false before production builds.
 *
 * All coordinates are HARDCODED on-water locations verified against Lake Lanier satellite imagery.
 */

// ==========================================
// TOGGLE THIS FOR SCREENSHOT BUILDS
// ==========================================
const ENABLE_DEMO_CATCHES = true;
// ==========================================

// Lake Lanier center coordinates (for lakeLat/lakeLng filtering)
const LAKE_LANIER_LAT = 34.29;
const LAKE_LANIER_LNG = -83.96;

const LURES = ["Chatterbait", "Spinnerbait", "Crankbait", "Texas Rig", "Jig", "Senko", "Drop Shot", "Topwater Frog", "Squarebill", "Swimjig"];
const COLORS = ["Green Pumpkin", "Shad", "Pearl White", "Black/Blue", "Crawfish", "Bluegill", "Chartreuse", "Watermelon Red"];
const SPECIES: ("largemouth" | "smallmouth" | "spotted")[] = ["largemouth", "smallmouth", "spotted"];
const CONDITIONS = ["Clear", "Partly Cloudy", "Overcast"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(): string {
  return `demo-${Math.random().toString(36).substr(2, 9)}`;
}

function makeCatch(lat: number, lng: number): any {
  return {
    id: makeId(),
    lakeName: "Lake Lanier",
    lakeId: "lake-lanier-ga",
    species: randomItem(SPECIES),
    lure: randomItem(LURES),
    color: randomItem(COLORS),
    weight: (2 + Math.random() * 6).toFixed(2),
    notes: "",
    photoUrl: null,
    caughtAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
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
// ON-WATER COORDINATES
// Based on visible lake body in Mapbox dark style
// The "Lake Lanier" label is at approximately 34.25, -83.95
// Staying within the clear water body visible in screenshots
// ==========================================

const DEMO_CATCHES: any[] = [
  // ========== HOT ZONE 1: Main lake center where label appears (12 catches) ==========
  makeCatch(34.2500, -83.9550),
  makeCatch(34.2505, -83.9545),
  makeCatch(34.2495, -83.9555),
  makeCatch(34.2502, -83.9552),
  makeCatch(34.2498, -83.9548),
  makeCatch(34.2503, -83.9553),
  makeCatch(34.2497, -83.9547),
  makeCatch(34.2501, -83.9551),
  makeCatch(34.2504, -83.9549),
  makeCatch(34.2499, -83.9554),
  makeCatch(34.2496, -83.9546),
  makeCatch(34.2500, -83.9550),

  // ========== HOT ZONE 2: South of center, still in main lake body (10 catches) ==========
  makeCatch(34.2200, -83.9700),
  makeCatch(34.2205, -83.9695),
  makeCatch(34.2195, -83.9705),
  makeCatch(34.2202, -83.9702),
  makeCatch(34.2198, -83.9698),
  makeCatch(34.2203, -83.9703),
  makeCatch(34.2197, -83.9697),
  makeCatch(34.2201, -83.9701),
  makeCatch(34.2204, -83.9699),
  makeCatch(34.2199, -83.9704),

  // ========== MODERATE ZONE 1: North of center (6 catches) ==========
  makeCatch(34.2800, -83.9400),
  makeCatch(34.2805, -83.9395),
  makeCatch(34.2795, -83.9405),
  makeCatch(34.2802, -83.9402),
  makeCatch(34.2798, -83.9398),
  makeCatch(34.2803, -83.9403),

  // ========== MODERATE ZONE 2: Southeast section (5 catches) ==========
  makeCatch(34.2300, -83.9300),
  makeCatch(34.2305, -83.9295),
  makeCatch(34.2295, -83.9305),
  makeCatch(34.2302, -83.9302),
  makeCatch(34.2298, -83.9298),

  // ========== MODERATE ZONE 3: Southwest section (5 catches) ==========
  makeCatch(34.2400, -83.9800),
  makeCatch(34.2405, -83.9795),
  makeCatch(34.2395, -83.9805),
  makeCatch(34.2402, -83.9802),
  makeCatch(34.2398, -83.9798),

  // ========== SCATTERED SINGLES: Spread across visible water (27 catches) ==========
  // All within the main lake body visible in screenshots
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
  makeCatch(34.2580, -83.9550), // Central-north
  makeCatch(34.2680, -83.9400), // North
  makeCatch(34.2120, -83.9500), // South
  makeCatch(34.2220, -83.9600), // South
  makeCatch(34.2320, -83.9700), // Central-south
  makeCatch(34.2420, -83.9500), // Central
  makeCatch(34.2520, -83.9650), // Central
  makeCatch(34.2620, -83.9550), // North
  makeCatch(34.2720, -83.9480), // North
  makeCatch(34.2820, -83.9380), // Far north
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
