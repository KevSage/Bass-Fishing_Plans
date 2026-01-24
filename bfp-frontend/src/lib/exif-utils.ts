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
 *
 * Supports: JPEG, HEIC/HEIF, PNG, TIFF, AVIF
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    console.log("=== EXIF Extraction Start ===");
    console.log(
      "File:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      (file.size / 1024).toFixed(1) + "KB",
    );

    let latitude: number | null = null;
    let longitude: number | null = null;
    let dateTime: Date | null = null;

    // 1. Try GPS-specific extraction first (most reliable for coordinates)
    try {
      const gps = await exifr.gps(file);
      console.log("GPS extraction result:", gps);

      if (
        gps &&
        typeof gps.latitude === "number" &&
        typeof gps.longitude === "number"
      ) {
        latitude = gps.latitude;
        longitude = gps.longitude;
        console.log("✓ GPS found:", latitude, longitude);
      }
    } catch (gpsErr) {
      console.log("GPS extraction failed:", gpsErr);
    }

    // 2. Parse for date/time (and fallback GPS if not found above)
    try {
      // Don't use 'pick' option - it can exclude GPS fields
      // Parse all EXIF, IPTC, and XMP data for maximum compatibility
      const exif = await exifr.parse(file, {
        gps: true,
        tiff: true,
        xmp: true,
        icc: false,
        iptc: true,
        jfif: false,
        ihdr: false,
      });

      console.log("Full EXIF parse keys:", exif ? Object.keys(exif) : "null");

      if (exif) {
        // Fallback GPS from full parse if not found via gps()
        if (latitude === null && exif.latitude != null) {
          latitude = exif.latitude;
          longitude = exif.longitude;
          console.log("✓ GPS from full parse:", latitude, longitude);
        }

        // Date/Time extraction - try multiple fields
        const dateSource =
          exif.DateTimeOriginal ||
          exif.CreateDate ||
          exif.DateTimeDigitized ||
          exif.ModifyDate ||
          exif.DateTime;

        console.log(
          "Date source value:",
          dateSource,
          "Type:",
          typeof dateSource,
        );

        if (dateSource) {
          if (dateSource instanceof Date) {
            dateTime = dateSource;
          } else if (typeof dateSource === "string") {
            // Handle EXIF date format: "2024:01:15 14:30:00"
            const normalized = dateSource.replace(
              /^(\d{4}):(\d{2}):(\d{2})/,
              "$1-$2-$3",
            );
            dateTime = new Date(normalized);
          } else if (typeof dateSource === "number") {
            dateTime = new Date(dateSource);
          }

          // Validate
          if (dateTime && isNaN(dateTime.getTime())) {
            console.log("✗ Invalid date after parsing");
            dateTime = null;
          } else if (dateTime) {
            console.log("✓ DateTime found:", dateTime.toISOString());
          }
        }
      }
    } catch (parseErr) {
      console.log("Full EXIF parse failed:", parseErr);
    }

    // 3. Last resort for HEIC - try with explicit HEIC options
    if (
      latitude === null &&
      (file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic"))
    ) {
      console.log("Trying HEIC-specific extraction...");
      try {
        const heicExif = await exifr.parse(file, {
          translateKeys: true,
          translateValues: true,
          reviveValues: true,
        });
        console.log(
          "HEIC parse result keys:",
          heicExif ? Object.keys(heicExif) : "null",
        );

        if (heicExif?.latitude != null) {
          latitude = heicExif.latitude;
          longitude = heicExif.longitude;
          console.log("✓ GPS from HEIC parse:", latitude, longitude);
        }
      } catch (heicErr) {
        console.log("HEIC-specific extraction failed:", heicErr);
      }
    }

    console.log("=== EXIF Result ===", {
      latitude,
      longitude,
      dateTime: dateTime?.toISOString(),
    });
    return { latitude, longitude, dateTime };
  } catch (error) {
    console.error("EXIF extraction error:", error);
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
