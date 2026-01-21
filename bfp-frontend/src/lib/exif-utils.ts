// src/lib/exif-utils.ts
/**
 * EXIF extraction utilities for catch photo uploads.
 * Uses exifr library for parsing.
 */

import exifr from "exifr";

export type ExifData = {
  latitude: number | null;
  longitude: number | null;
  dateTime: Date | null;
};

/**
 * Extract GPS coordinates and timestamp from image EXIF data.
 * Returns null values if data not present.
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    // Parse only the fields we need for efficiency
    const exif = await exifr.parse(file, {
      gps: true,
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });

    if (!exif) {
      return { latitude: null, longitude: null, dateTime: null };
    }

    // GPS - exifr automatically converts to decimal degrees
    const latitude = exif.latitude ?? null;
    const longitude = exif.longitude ?? null;

    // Date/Time - try multiple fields in priority order
    let dateTime: Date | null = null;
    const dateSource =
      exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate;

    if (dateSource) {
      dateTime = dateSource instanceof Date ? dateSource : new Date(dateSource);
      // Validate the date
      if (isNaN(dateTime.getTime())) {
        dateTime = null;
      }
    }

    return { latitude, longitude, dateTime };
  } catch (error) {
    console.warn("EXIF extraction failed:", error);
    return { latitude: null, longitude: null, dateTime: null };
  }
}

/**
 * Check if a file has GPS data without full parsing.
 * Useful for quick validation.
 */
export async function hasGpsData(file: File): Promise<boolean> {
  try {
    const gps = await exifr.gps(file);
    return gps !== null && gps !== undefined;
  } catch {
    return false;
  }
}

/**
 * Format a Date to YYYY-MM-DD string.
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format a Date to HH:MM string.
 */
export function formatTimeForApi(date: Date): string {
  return date.toTimeString().slice(0, 5);
}
