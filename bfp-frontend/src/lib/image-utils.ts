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

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);

    img.onload = () => {
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
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          // Recreate a File object with the same name/type
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality,
      );
    };

    reader.readAsDataURL(file);
  });
}
