// src/config/lureImageMap.ts
/**
 * Maps backend lure names to image filenames
 * Backend format: "shallow crankbait" (spaces)
 * Image filename: shallow_crankbait.png (underscores)
 */

export const lureImageMap: Record<string, string> = {
  // Horizontal Reaction
  "shallow crankbait": "shallow_crankbait.png",
  "mid crankbait": "mid_crankbait.png",
  "deep crankbait": "deep_crankbait.png",
  "lipless crankbait": "lipless_crankbait.png",
  "chatterbait": "chatterbait.png",
  "swim jig": "swim_jig.png",
  "spinnerbait": "spinnerbait.png",
  "underspin": "underspin.png",
  "paddle tail swimbait": "paddle_tail_swimbait.png",

  // Vertical Reaction
  "jerkbait": "jerkbait.png",
  "blade bait": "blade_bait.png",

  // Bottom Contact - Dragging
  "texas rig": "texas_rig.png",
  "carolina rig": "carolina_rig.png",
  "football jig": "football_jig.png",
  "shaky head": "shaky_head.png",

  // Bottom Contact - Hopping / Targeted
  "casting jig": "casting_jig.png",

  // Hovering / Mid-Column Finesse
  "neko rig": "neko_rig.png",
  "wacky rig": "wacky_rig.png",
  "weightless soft jerkbait": "weightless_soft_jerkbait.png",
  "ned rig": "ned_rig.png",
  "dropshot": "dropshot.png",

  // Topwater - Horizontal
  "walking bait": "walking_bait.png",
  "buzzbait": "buzzbait.png",
  "whopper plopper": "whopper_plopper.png",
  "wake bait": "wake_bait.png",

  // Topwater - Precision / Vertical Surface Work
  "hollow body frog": "hollow_body_frog.png",
  "popping frog": "popping_frog.png",
  "popper": "popper.png",
};

/**
 * Get image path for a lure name
 * Returns null if lure not found (allows fallback to placeholder)
 */
export function getLureImagePath(lureName: string): string | null {
  const filename = lureImageMap[lureName.toLowerCase().trim()];
  return filename ? `/images/lures/${filename}` : null;
}
