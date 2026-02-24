// src/utils/journeyUtils.ts
import { CatchEntry, LURE_OPTIONS } from "@/components/CatchLog";

// Helper to capitalize each word
const capitalize = (str: string) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

// --- TYPES ---

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "obsidian";

export interface Badge {
  id: string;
  title: string;
  description: string;
  tier: BadgeTier;
  icon: string; // We'll use this to map to an icon component
  isUnlocked: boolean;
  unlockedAt?: string; // Date ISO string
  catchId?: string; // Link to the specific catch that unlocked it
  progress?: number; // 0-100 for partially unlocked
  displayValue?: string; // e.g., "7/10"
}

export interface SeasonStats {
  name: string;
  catchCount: number;
  bestLure: string;
  bestLake: string;
  compareCount: number; // vs same time last year (mocked or calc'd)
}

export interface MasterySkill {
  name: string;
  count: number;
  level: "Initiated" | "Competent" | "Dialed" | "Specialist" | "Elite";
  progress: number; // 0-100 to next level
  nextThreshold: number;
}

export interface JourneyData {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalCatches: number;
  season: SeasonStats;
  mastery: MasterySkill[];
  badges: Badge[];
}

// --- CONSTANTS ---

const LEVEL_BASE_XP = 100; // XP needed for level 1
const XP_PER_CATCH = 15;
const XP_PER_NEW_LAKE = 50;
const XP_PER_NEW_TECHNIQUE = 30;

// --- HELPERS ---

function getSeasonName(date: Date): string {
  const month = date.getMonth(); // 0-11
  // Simple biological seasons for Bass
  if (month >= 2 && month <= 4) return "Spawn / Spring"; // Mar-May
  if (month >= 5 && month <= 8) return "Summer Peak"; // Jun-Sep
  if (month >= 9 && month <= 10) return "Fall Transition"; // Oct-Nov
  return "Winter / Pre-Spawn"; // Dec-Feb
}

function calculateLevel(xp: number) {
  // Simple curve: Level = sqrt(XP / 100) * constant or similar
  // Linear for MVP: Level increases every 200 XP roughly
  let level = 1;
  let required = 200;
  while (xp >= required) {
    xp -= required;
    level++;
    required = Math.floor(required * 1.1); // 10% harder each level
  }
  return { level, currentXP: xp, requiredXP: required };
}

// --- MAIN CALCULATOR ---

export function calculateJourney(entries: CatchEntry[]): JourneyData {
  if (!entries.length) {
    return {
      level: 1,
      currentXP: 0,
      nextLevelXP: 200,
      totalCatches: 0,
      season: {
        name: getSeasonName(new Date()),
        catchCount: 0,
        bestLure: "-",
        bestLake: "-",
        compareCount: 0,
      },
      mastery: [],
      badges: [],
    };
  }

  // 1. Calculate XP & Level
  // -----------------------
  const totalCatches = entries.length;
  const uniqueLakes = new Set(entries.map((e) => e.lakeName)).size;
  const uniqueLures = new Set(entries.map((e) => e.lure)).size;

  const totalXP =
    totalCatches * XP_PER_CATCH +
    uniqueLakes * XP_PER_NEW_LAKE +
    uniqueLures * XP_PER_NEW_TECHNIQUE;

  const { level, currentXP, requiredXP } = calculateLevel(totalXP);

  // 2. Calculate Season Stats
  // -------------------------
  const now = new Date();
  const currentSeasonName = getSeasonName(now);
  const currentYear = now.getFullYear();

  const seasonEntries = entries.filter((e) => {
    const d = new Date(e.caughtAt);
    return (
      d.getFullYear() === currentYear && getSeasonName(d) === currentSeasonName
    );
  });

  // Find best lure for season
  const seasonLureCounts: Record<string, number> = {};
  const seasonLakeCounts: Record<string, number> = {};
  seasonEntries.forEach((e) => {
    seasonLureCounts[e.lure] = (seasonLureCounts[e.lure] || 0) + 1;
    seasonLakeCounts[e.lakeName] = (seasonLakeCounts[e.lakeName] || 0) + 1;
  });

  const bestSeasonLure = capitalize(
    Object.entries(seasonLureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "None"
  );
  const bestSeasonLake =
    Object.entries(seasonLakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "None";

  // 3. Calculate Mastery (Skill Bars)
  // ---------------------------------
  // Group by CATEGORY, not just lure name
  const categoryCounts: Record<string, number> = {};
  entries.forEach((e) => {
    const opt = LURE_OPTIONS.find((o) => o.value === e.lure);
    const cat = opt?.category || "Other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const mastery: MasterySkill[] = Object.entries(categoryCounts)
    .map(([name, count]) => {
      let lvl: MasterySkill["level"] = "Initiated";
      let next = 10;
      if (count >= 10) {
        lvl = "Competent";
        next = 50;
      }
      if (count >= 50) {
        lvl = "Dialed";
        next = 100;
      }
      if (count >= 100) {
        lvl = "Specialist";
        next = 500;
      }
      if (count >= 500) {
        lvl = "Elite";
        next = 1000;
      }

      // Calculate progress to next level
      // If competent (10), and count is 30, next is 50. Progress = (30-10) / (50-10)
      const prevThreshold =
        lvl === "Initiated"
          ? 0
          : lvl === "Competent"
            ? 10
            : lvl === "Dialed"
              ? 50
              : lvl === "Specialist"
                ? 100
                : 500;
      const progress = Math.min(
        100,
        Math.floor(((count - prevThreshold) / (next - prevThreshold)) * 100),
      );

      return { name, count, level: lvl, progress, nextThreshold: next };
    })
    .sort((a, b) => b.count - a.count);

  // 4. Calculate Badges (The Trophy Case)
  // -------------------------------------
  const badges: Badge[] = [];

  // Helper to add badge
  const checkBadge = (
    id: string,
    title: string,
    desc: string,
    tier: BadgeTier,
    condition: boolean,
    findEntry?: () => CatchEntry | undefined,
  ) => {
    const entry = condition && findEntry ? findEntry() : undefined;
    badges.push({
      id,
      title,
      description: desc,
      tier,
      icon: "trophy",
      isUnlocked: condition,
      unlockedAt: entry?.caughtAt,
      catchId: entry?.id,
    });
  };

  // -- Volume Badges --
  checkBadge(
    "century_club",
    "Century Club",
    "Log 100 total catches.",
    "platinum",
    totalCatches >= 100,
    () => entries[99],
  );

  checkBadge(
    "getting_started",
    "First Cast",
    "Log your first catch.",
    "bronze",
    totalCatches >= 1,
    () => entries[entries.length - 1], // First one (chronologically usually last in array depending on sort)
  );

  // -- Big Fish Badges --
  const pbEntry = entries.reduce(
    (max, curr) => ((curr.weight || 0) > (max?.weight || 0) ? curr : max),
    entries[0],
  );

  checkBadge(
    "lunker_5",
    "The 5lb Club",
    "Catch a Bass over 5lbs.",
    "gold",
    (pbEntry?.weight || 0) >= 5,
    () => entries.find((e) => (e.weight || 0) >= 5),
  );

  checkBadge(
    "double_digit",
    "Double Digit",
    "Catch a Bass over 10lbs.",
    "obsidian",
    (pbEntry?.weight || 0) >= 10,
    () => entries.find((e) => (e.weight || 0) >= 10),
  );

  // -- Explorer Badges --
  checkBadge(
    "lake_hopper",
    "Lake Hopper",
    "Log catches on 5 different lakes.",
    "silver",
    uniqueLakes >= 5,
  );

  checkBadge(
    "technique_master",
    "Technique Master",
    "Catch fish using 5 different techniques.",
    "gold",
    uniqueLures >= 5,
  );

  return {
    level,
    currentXP,
    nextLevelXP: requiredXP,
    totalCatches,
    season: {
      name: currentSeasonName,
      catchCount: seasonEntries.length,
      bestLure: bestSeasonLure,
      bestLake: bestSeasonLake,
      compareCount: 0, // Todo: store history
    },
    mastery,
    badges,
  };
}
