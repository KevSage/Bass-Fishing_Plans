/**
 * Weight Conversion Utilities
 * Handles conversion between "lbs.oz" input format and decimal pounds storage
 */

/**
 * Parse weight input in "lbs.oz" format to decimal pounds.
 * Examples:
 *   "2.11" -> 2 lbs 11 oz -> 2.6875 lbs
 *   "5.8"  -> 5 lbs 8 oz  -> 5.5 lbs
 *   "3"    -> 3 lbs       -> 3.0 lbs
 */
export function parseWeightInput(input: string): number | undefined {
  if (!input || input.trim() === '') return undefined;

  const trimmed = input.trim();

  // Check if it contains a decimal point
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.');
    const lbs = parseInt(parts[0], 10) || 0;
    const ozStr = parts[1] || '0';
    // Parse ounces - treat the decimal part as ounces
    const oz = parseInt(ozStr, 10) || 0;

    // Validate ounces (must be 0-15)
    if (oz >= 16) {
      console.warn('[Weight] Invalid ounces value:', oz, '- treating as decimal');
      // Fall back to decimal interpretation for values like "2.75"
      return parseFloat(trimmed);
    }

    return lbs + (oz / 16);
  }

  // No decimal - just pounds
  return parseFloat(trimmed);
}

/**
 * Format decimal pounds to "lbs.oz" display string for input fields.
 * Examples:
 *   2.6875 -> "2.11" (2 lbs 11 oz)
 *   5.5    -> "5.08" (5 lbs 8 oz)
 *   3.0    -> "3"
 */
export function formatWeightForInput(decimalLbs: number | undefined | null): string {
  if (decimalLbs === undefined || decimalLbs === null || decimalLbs === 0) return '';

  const lbs = Math.floor(decimalLbs);
  const ozDecimal = (decimalLbs - lbs) * 16;
  const oz = Math.round(ozDecimal);

  if (oz === 0) {
    return lbs.toString();
  }

  // Pad single-digit ounces with leading zero for clarity (e.g., "2.08" for 2 lbs 8 oz)
  return `${lbs}.${oz.toString().padStart(2, '0')}`;
}

/**
 * Format decimal pounds for display (e.g., "2 lbs 11 oz")
 */
export function formatWeightForDisplay(decimalLbs: number | undefined | null): string {
  if (decimalLbs === undefined || decimalLbs === null || decimalLbs === 0) return '';

  const lbs = Math.floor(decimalLbs);
  const ozDecimal = (decimalLbs - lbs) * 16;
  const oz = Math.round(ozDecimal);

  if (oz === 0) {
    return `${lbs} lbs`;
  }

  return `${lbs} lbs ${oz} oz`;
}

/**
 * Format decimal pounds for compact display (e.g., "2lb 11oz")
 */
export function formatWeightCompact(decimalLbs: number | undefined | null): string {
  if (decimalLbs === undefined || decimalLbs === null || decimalLbs === 0) return '';

  const lbs = Math.floor(decimalLbs);
  const ozDecimal = (decimalLbs - lbs) * 16;
  const oz = Math.round(ozDecimal);

  if (oz === 0) {
    return `${lbs}lb`;
  }

  return `${lbs}lb ${oz}oz`;
}
