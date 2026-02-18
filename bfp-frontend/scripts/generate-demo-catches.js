/**
 * Generate Demo Catches for iOS Screenshots
 *
 * Creates ~30 catches on Lake Lanier with intentional clustering
 * to demonstrate pin density colors (yellow/orange/red).
 *
 * Usage: node scripts/generate-demo-catches.js
 * Then copy the output and paste into browser console.
 */

// Lake Lanier polygon anchors
const LAKE_LANIER_ANCHORS = [
  { lat: 34.14767081480706, lng: -84.05702984647304 },
  { lat: 34.187546487830886, lng: -83.94859322317872 },
  { lat: 34.26524984510378, lng: -83.88955550605115 },
  { lat: 34.340891819054576, lng: -83.80280620741502 },
  { lat: 34.3886305809187, lng: -83.8100353156351 },
  { lat: 34.41646562833078, lng: -83.8750972896117 },
  { lat: 34.424416798031174, lng: -83.96064173687816 },
  { lat: 34.35481843411051, lng: -84.01847460263537 },
  { lat: 34.292130453827454, lng: -83.95582233139812 },
  { lat: 34.25827939535861, lng: -83.99196787249647 },
  { lat: 34.22541092451951, lng: -84.09438023894175 },
  { lat: 34.188543138280295, lng: -84.11968211771028 },
];

// Lake info
const LAKE_LANIER = {
  id: "lake-lanier-ga",
  name: "Lake Lanier",
  state: "GA",
  latitude: 34.29083786001445,
  longitude: -83.96034052403542,
};

// Sample data for variety
const SPECIES = ["largemouth", "spotted", "smallmouth"];
const LURES = [
  "Senko",
  "Jig",
  "Crankbait",
  "Spinnerbait",
  "Chatterbait",
  "Swimjig",
  "Texas Rig",
  "Drop Shot",
  "Topwater Frog",
  "Squarebill",
];
const COLORS = [
  "Green Pumpkin",
  "Watermelon Red",
  "Black/Blue",
  "Pearl White",
  "Chartreuse",
  "Shad",
  "Bluegill",
  "Crawfish",
];

// Hotspot cluster centers (hand-picked within the lake polygon)
// Target: ~65 pins total (38 pulsing clusters + 27 static singles)
const HOTSPOTS = [
  // === HOT ZONES (red - 10+ catches within 100m) === [22 total, pulsing]
  { lat: 34.185, lng: -84.02, catchCount: 12 },   // Southern main body - favorite spot
  { lat: 34.38, lng: -83.85, catchCount: 10 },    // Northern arm hotspot

  // === MODERATE ZONES (orange - 4-9 catches) === [16 total, pulsing]
  { lat: 34.28, lng: -83.95, catchCount: 6 },     // Central area
  { lat: 34.35, lng: -83.88, catchCount: 5 },     // Mid-north
  { lat: 34.22, lng: -83.98, catchCount: 5 },     // South-central

  // === SCATTERED SINGLES (yellow - static, no pulse) === [27 total]
  { lat: 34.17, lng: -84.00, catchCount: 1 },
  { lat: 34.20, lng: -83.92, catchCount: 1 },
  { lat: 34.24, lng: -84.02, catchCount: 1 },
  { lat: 34.27, lng: -83.88, catchCount: 1 },
  { lat: 34.31, lng: -83.85, catchCount: 1 },
  { lat: 34.34, lng: -83.95, catchCount: 1 },
  { lat: 34.37, lng: -83.92, catchCount: 1 },
  { lat: 34.39, lng: -83.82, catchCount: 1 },
  { lat: 34.42, lng: -83.90, catchCount: 1 },
  { lat: 34.33, lng: -84.01, catchCount: 1 },
  { lat: 34.29, lng: -84.03, catchCount: 1 },
  { lat: 34.26, lng: -83.94, catchCount: 1 },
  { lat: 34.23, lng: -83.90, catchCount: 1 },
  { lat: 34.19, lng: -83.96, catchCount: 1 },
  { lat: 34.16, lng: -84.04, catchCount: 1 },
  { lat: 34.21, lng: -84.07, catchCount: 1 },
  { lat: 34.36, lng: -83.98, catchCount: 1 },
  { lat: 34.41, lng: -83.84, catchCount: 1 },
  { lat: 34.30, lng: -84.00, catchCount: 1 },
  { lat: 34.32, lng: -83.89, catchCount: 1 },
  { lat: 34.25, lng: -84.08, catchCount: 1 },
  { lat: 34.40, lng: -83.87, catchCount: 1 },
  { lat: 34.18, lng: -83.94, catchCount: 1 },
  { lat: 34.15, lng: -84.06, catchCount: 1 },
  { lat: 34.28, lng: -83.86, catchCount: 1 },
  { lat: 34.35, lng: -84.00, catchCount: 1 },
  { lat: 34.38, lng: -83.94, catchCount: 1 },
];

// Helper: generate random offset within ~50-80m radius for tight clusters
function randomClusterOffset() {
  // ~0.0005 degrees ≈ 55m at this latitude
  const angle = Math.random() * 2 * Math.PI;
  const radius = 0.0003 + Math.random() * 0.0004; // 33-77m roughly
  return {
    lat: Math.cos(angle) * radius,
    lng: Math.sin(angle) * radius,
  };
}

// Generate random weight (2-8 lbs, occasional lunker)
function randomWeight() {
  const base = 2 + Math.random() * 4;
  const lunkerChance = Math.random();
  if (lunkerChance > 0.92) {
    return (6 + Math.random() * 3).toFixed(2); // 6-9 lbs lunker
  }
  return base.toFixed(2);
}

// Generate random date in last 6 months
function randomDate() {
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
  const randomTime = sixMonthsAgo + Math.random() * (now - sixMonthsAgo);
  return new Date(randomTime).toISOString();
}

// Generate UUID
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate all catches
function generateCatches() {
  const catches = [];
  let catchNum = 1;

  for (const hotspot of HOTSPOTS) {
    for (let i = 0; i < hotspot.catchCount; i++) {
      const offset = randomClusterOffset();
      const catchEntry = {
        id: uuid(),
        lakeName: LAKE_LANIER.name,
        lakeId: LAKE_LANIER.id,
        species: SPECIES[Math.floor(Math.random() * SPECIES.length)],
        lure: LURES[Math.floor(Math.random() * LURES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        weight: randomWeight(),
        notes: "",
        photoUrl: null,
        caughtAt: randomDate(),
        catchLat: hotspot.lat + offset.lat,
        catchLng: hotspot.lng + offset.lng,
        source: "demo",
        weather: {
          temp: Math.floor(55 + Math.random() * 30),
          conditions: ["Clear", "Partly Cloudy", "Overcast"][
            Math.floor(Math.random() * 3)
          ],
        },
      };
      catches.push(catchEntry);
      catchNum++;
    }
  }

  return catches;
}

// Main
const demoCatches = generateCatches();

console.log(`\n=== Generated ${demoCatches.length} Demo Catches for Lake Lanier ===\n`);
console.log("Cluster breakdown:");
HOTSPOTS.forEach((h, i) => {
  const tier = h.catchCount >= 10 ? "HOT (red)" : h.catchCount >= 4 ? "MODERATE (orange)" : "SPARSE (yellow)";
  console.log(`  Hotspot ${i + 1}: ${h.catchCount} catches - ${tier}`);
});

console.log("\n=== COPY THE CODE BELOW AND PASTE IN BROWSER CONSOLE ===\n");

// Output localStorage injection code
const code = `
// Demo catches for iOS App Store screenshots
const demoCatches = ${JSON.stringify(demoCatches, null, 2)};

// Get existing catches or initialize
const existingKey = "catchlog_api_cache";
const existing = JSON.parse(localStorage.getItem(existingKey) || "{}");

// Add demo catches to Lake Lanier
existing["lake-lanier-ga"] = demoCatches;

// Save back
localStorage.setItem(existingKey, JSON.stringify(existing));

console.log("✅ Added " + demoCatches.length + " demo catches to Lake Lanier!");
console.log("Navigate to Lake Lanier on the map to see the pins.");
`;

console.log(code);
console.log("\n=== END OF CODE ===\n");
