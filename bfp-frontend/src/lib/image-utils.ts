// src/lib/image-utils.ts

/**
 * Compresses an image file to a target size/quality using HTML Canvas.
 * Strips EXIF data (GPS), so extract that *before* calling this if needed.
 */
export async function compressImage(
  file: File,
  maxWidth = 1600, // 1600px is excellent for phone screens
  quality = 0.8, // 80% quality reduces size by ~80-90%
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    // Timeout to prevent hanging forever
    const timeout = setTimeout(() => {
      console.warn("[compressImage] Timeout - returning original file");
      resolve(file);
    }, 10000);

    reader.onload = (e) => {
      console.log("[compressImage] FileReader loaded, setting img.src");
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => {
      clearTimeout(timeout);
      console.error("[compressImage] FileReader error:", err);
      reject(err);
    };

    img.onerror = (err) => {
      clearTimeout(timeout);
      console.error("[compressImage] Image load error:", err);
      // Return original file instead of failing
      resolve(file);
    };

    img.onload = () => {
      console.log("[compressImage] Image loaded:", img.width, "x", img.height);
      clearTimeout(timeout);

      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("[compressImage] Could not get canvas context");
        resolve(file); // Return original instead of failing
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("[compressImage] toBlob returned null");
            resolve(file); // Return original instead of failing
            return;
          }
          // Recreate a File object with the same name/type
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          console.log("[compressImage] Compression success:", file.size, "->", compressedFile.size);
          resolve(compressedFile);
        },
        "image/jpeg",
        quality,
      );
    };

    reader.readAsDataURL(file);
  });
}
