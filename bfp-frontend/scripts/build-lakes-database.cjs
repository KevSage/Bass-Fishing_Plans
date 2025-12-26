#!/usr/bin/env node
// scripts/build-lakes-database.cjs
// Builds 50 top bass fishing lakes database

const fs = require("fs");
const path = require("path");

// Top 50 bass fishing lakes - high quality, manually verified
const CURATED_LAKES = [
  // Southeast - Top bass fishing region
  {
    name: "Lake Guntersville",
    state: "AL",
    city: "Guntersville",
    lat: 34.3581,
    lon: -86.2944,
    acres: 69000,
    tier: 1,
  },
  {
    name: "Lake Eufaula",
    state: "AL",
    city: "Eufaula",
    lat: 31.89,
    lon: -85.145,
    acres: 45000,
    tier: 1,
  },
  {
    name: "Pickwick Lake",
    state: "AL",
    city: "Florence",
    lat: 35.0631,
    lon: -88.2467,
    acres: 43100,
    tier: 1,
  },
  {
    name: "Wheeler Lake",
    state: "AL",
    city: "Decatur",
    lat: 34.6031,
    lon: -86.9833,
    acres: 68300,
    tier: 1,
  },
  {
    name: "Lake Lanier",
    state: "GA",
    city: "Buford",
    lat: 34.1808,
    lon: -84.0766,
    acres: 38000,
    tier: 1,
  },
  {
    name: "Lake Allatoona",
    state: "GA",
    city: "Cartersville",
    lat: 34.1614,
    lon: -84.7074,
    acres: 12000,
    tier: 1,
  },
  {
    name: "West Point Lake",
    state: "GA",
    city: "West Point",
    lat: 32.8828,
    lon: -85.1836,
    acres: 25900,
    tier: 1,
  },
  {
    name: "Lake Oconee",
    state: "GA",
    city: "Greensboro",
    lat: 33.3603,
    lon: -83.2744,
    acres: 19000,
    tier: 1,
  },
  {
    name: "Lake Sinclair",
    state: "GA",
    city: "Milledgeville",
    lat: 33.2536,
    lon: -83.2627,
    acres: 15330,
    tier: 2,
  },
  {
    name: "Lake Seminole",
    state: "GA",
    city: "Bainbridge",
    lat: 30.7686,
    lon: -84.8744,
    acres: 37500,
    tier: 1,
  },
  {
    name: "Lake Okeechobee",
    state: "FL",
    city: "Okeechobee",
    lat: 26.9389,
    lon: -80.8247,
    acres: 730000,
    tier: 1,
  },
  {
    name: "Lake Tohopekaliga",
    state: "FL",
    city: "Kissimmee",
    lat: 28.2328,
    lon: -81.4081,
    acres: 18810,
    tier: 1,
  },
  {
    name: "Lake Kissimmee",
    state: "FL",
    city: "Lake Wales",
    lat: 27.9161,
    lon: -81.1,
    acres: 34948,
    tier: 1,
  },
  {
    name: "Rodman Reservoir",
    state: "FL",
    city: "Palatka",
    lat: 29.5833,
    lon: -81.75,
    acres: 9500,
    tier: 1,
  },
  {
    name: "Lake George",
    state: "FL",
    city: "Palatka",
    lat: 29.3333,
    lon: -81.6167,
    acres: 46000,
    tier: 2,
  },
  {
    name: "Kentucky Lake",
    state: "TN",
    city: "Paris",
    lat: 36.5019,
    lon: -88.0628,
    acres: 160000,
    tier: 1,
  },
  {
    name: "Chickamauga Lake",
    state: "TN",
    city: "Chattanooga",
    lat: 35.1264,
    lon: -85.1869,
    acres: 36240,
    tier: 1,
  },
  {
    name: "Watts Bar Lake",
    state: "TN",
    city: "Spring City",
    lat: 35.7086,
    lon: -84.8555,
    acres: 39090,
    tier: 1,
  },
  {
    name: "Cherokee Lake",
    state: "TN",
    city: "Jefferson City",
    lat: 36.1667,
    lon: -83.5,
    acres: 30300,
    tier: 2,
  },
  {
    name: "Lake Norman",
    state: "NC",
    city: "Cornelius",
    lat: 35.5858,
    lon: -80.9469,
    acres: 32510,
    tier: 1,
  },
  {
    name: "Lake Murray",
    state: "SC",
    city: "Columbia",
    lat: 34.0944,
    lon: -81.2267,
    acres: 50000,
    tier: 1,
  },
  {
    name: "Lake Hartwell",
    state: "SC",
    city: "Anderson",
    lat: 34.4683,
    lon: -82.835,
    acres: 56000,
    tier: 1,
  },
  {
    name: "Santee Cooper",
    state: "SC",
    city: "Santee",
    lat: 33.49,
    lon: -80.4847,
    acres: 160000,
    tier: 1,
  },
  {
    name: "Kerr Lake",
    state: "VA",
    city: "Clarksville",
    lat: 36.5611,
    lon: -78.4172,
    acres: 50000,
    tier: 1,
  },
  {
    name: "Lake Anna",
    state: "VA",
    city: "Mineral",
    lat: 38.0672,
    lon: -77.7592,
    acres: 13000,
    tier: 2,
  },

  // Texas - Major bass destination
  {
    name: "Lake Fork",
    state: "TX",
    city: "Alba",
    lat: 32.809,
    lon: -95.6352,
    acres: 27690,
    tier: 1,
  },
  {
    name: "Lake Sam Rayburn",
    state: "TX",
    city: "Jasper",
    lat: 31.0986,
    lon: -94.1036,
    acres: 114500,
    tier: 1,
  },
  {
    name: "Toledo Bend Reservoir",
    state: "TX",
    city: "Burkeville",
    lat: 31.18,
    lon: -93.58,
    acres: 185000,
    tier: 1,
  },
  {
    name: "Lake Texoma",
    state: "TX",
    city: "Durant",
    lat: 33.895,
    lon: -96.5617,
    acres: 89000,
    tier: 1,
  },
  {
    name: "Lake Travis",
    state: "TX",
    city: "Austin",
    lat: 30.3894,
    lon: -97.9172,
    acres: 18900,
    tier: 1,
  },
  {
    name: "Lake Amistad",
    state: "TX",
    city: "Del Rio",
    lat: 29.5181,
    lon: -101.0506,
    acres: 65000,
    tier: 2,
  },
  {
    name: "Falcon Lake",
    state: "TX",
    city: "Zapata",
    lat: 26.5611,
    lon: -99.1486,
    acres: 87210,
    tier: 1,
  },

  // Arkansas
  {
    name: "Lake Ouachita",
    state: "AR",
    city: "Hot Springs",
    lat: 34.5583,
    lon: -93.1792,
    acres: 40000,
    tier: 1,
  },
  {
    name: "Beaver Lake",
    state: "AR",
    city: "Rogers",
    lat: 36.3722,
    lon: -93.9769,
    acres: 28220,
    tier: 1,
  },
  {
    name: "Lake Hamilton",
    state: "AR",
    city: "Hot Springs",
    lat: 34.4239,
    lon: -93.0561,
    acres: 7200,
    tier: 2,
  },

  // California
  {
    name: "Clear Lake",
    state: "CA",
    city: "Clearlake",
    lat: 39.0166,
    lon: -122.8166,
    acres: 43800,
    tier: 1,
  },
  {
    name: "Lake Shasta",
    state: "CA",
    city: "Redding",
    lat: 40.7186,
    lon: -122.4178,
    acres: 30000,
    tier: 1,
  },
  {
    name: "Lake Oroville",
    state: "CA",
    city: "Oroville",
    lat: 39.5378,
    lon: -121.4808,
    acres: 15800,
    tier: 2,
  },
  {
    name: "Lake Castaic",
    state: "CA",
    city: "Castaic",
    lat: 34.5208,
    lon: -118.6306,
    acres: 2235,
    tier: 2,
  },

  // Oklahoma
  {
    name: "Grand Lake",
    state: "OK",
    city: "Grove",
    lat: 36.5903,
    lon: -94.8183,
    acres: 46500,
    tier: 1,
  },
  {
    name: "Lake Eufaula",
    state: "OK",
    city: "Checotah",
    lat: 35.2508,
    lon: -95.6419,
    acres: 102000,
    tier: 1,
  },

  // Louisiana
  {
    name: "Toledo Bend Reservoir",
    state: "LA",
    city: "Many",
    lat: 31.3394,
    lon: -93.5508,
    acres: 185000,
    tier: 1,
  },

  // Mississippi
  {
    name: "Grenada Lake",
    state: "MS",
    city: "Grenada",
    lat: 33.81,
    lon: -89.7772,
    acres: 36000,
    tier: 1,
  },
  {
    name: "Ross Barnett Reservoir",
    state: "MS",
    city: "Brandon",
    lat: 32.3686,
    lon: -90.0986,
    acres: 33000,
    tier: 1,
  },

  // Michigan
  {
    name: "Lake St. Clair",
    state: "MI",
    city: "Detroit",
    lat: 42.47,
    lon: -82.73,
    acres: 175000,
    tier: 1,
  },

  // Wisconsin
  {
    name: "Lake Winnebago",
    state: "WI",
    city: "Oshkosh",
    lat: 44.0,
    lon: -88.4167,
    acres: 137700,
    tier: 1,
  },

  // New York
  {
    name: "Lake Champlain",
    state: "NY",
    city: "Plattsburgh",
    lat: 44.5588,
    lon: -73.335,
    acres: 313000,
    tier: 1,
  },
  {
    name: "Oneida Lake",
    state: "NY",
    city: "Syracuse",
    lat: 43.2167,
    lon: -75.9833,
    acres: 51000,
    tier: 1,
  },

  // Missouri
  {
    name: "Lake of the Ozarks",
    state: "MO",
    city: "Osage Beach",
    lat: 38.1544,
    lon: -92.6372,
    acres: 55000,
    tier: 1,
  },
  {
    name: "Table Rock Lake",
    state: "MO",
    city: "Branson",
    lat: 36.5953,
    lon: -93.3347,
    acres: 43100,
    tier: 1,
  },
];

function normalizeLakes(lakes) {
  return lakes.map((lake) => ({
    name: lake.name.trim(),
    state: lake.state.toUpperCase(),
    city: lake.city?.trim(),
    latitude: parseFloat(lake.lat.toFixed(6)),
    longitude: parseFloat(lake.lon.toFixed(6)),
    acres: lake.acres || null,
    tier: lake.tier || 3,
  }));
}

function sortByImportance(lakes) {
  return lakes.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return (b.acres || 0) - (a.acres || 0);
  });
}

function buildDatabase() {
  console.log("🎣 Building US Lakes Database\n");
  console.log(`📋 Curated lakes: ${CURATED_LAKES.length}`);

  const normalized = normalizeLakes(CURATED_LAKES);
  const sorted = sortByImportance(normalized);

  const dataDir = path.join(__dirname, "../src/data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, "lakes.json"),
    JSON.stringify(sorted, null, 2)
  );

  console.log("\n✅ Database built successfully!");
  console.log(`   Total lakes: ${sorted.length}`);
  console.log(`   Tier 1: ${sorted.filter((l) => l.tier === 1).length}`);
  console.log(`   Tier 2: ${sorted.filter((l) => l.tier === 2).length}`);
  console.log(
    `   States covered: ${[...new Set(sorted.map((l) => l.state))].length}`
  );
  console.log(`\n📁 Created: src/data/lakes.json`);
}

buildDatabase();
