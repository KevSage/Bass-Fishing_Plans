/**
 * Capacitor Camera Utility
 * Provides native camera access on iOS/Android, falls back to web on browsers
 */
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export type PhotoSource = 'camera' | 'library';

export interface CapturedPhoto {
  file: File;
  webPath: string;
  source: PhotoSource;
}

/**
 * Check if running on native platform (iOS/Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if camera plugin is available
 */
export function isCameraAvailable(): boolean {
  return Capacitor.isPluginAvailable('Camera');
}

/**
 * Request camera permissions (iOS requires explicit permission)
 */
export async function requestCameraPermissions(): Promise<boolean> {
  if (!isNativePlatform()) return true;

  try {
    const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    return status.camera === 'granted' && status.photos === 'granted';
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
}

/**
 * Convert Capacitor Photo to File object
 */
async function photoToFile(photo: Photo, source: PhotoSource): Promise<File> {
  // Get the image as base64 or fetch from webPath
  let blob: Blob;

  if (photo.base64String) {
    // Convert base64 to blob
    const byteCharacters = atob(photo.base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    blob = new Blob([byteArray], { type: `image/${photo.format}` });
  } else if (photo.webPath) {
    // Fetch from webPath
    const response = await fetch(photo.webPath);
    blob = await response.blob();
  } else {
    throw new Error('No image data available');
  }

  // Create File object with timestamp name
  const timestamp = Date.now();
  const filename = `catch_${timestamp}.${photo.format || 'jpeg'}`;

  return new File([blob], filename, {
    type: `image/${photo.format || 'jpeg'}`,
    lastModified: timestamp,
  });
}

/**
 * Take a photo using native camera
 */
export async function takeNativePhoto(): Promise<CapturedPhoto> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    saveToGallery: true,
    correctOrientation: true,
  });

  const file = await photoToFile(photo, 'camera');

  return {
    file,
    webPath: photo.webPath || '',
    source: 'camera',
  };
}

/**
 * Pick a photo from library using native picker
 */
export async function pickNativePhoto(): Promise<CapturedPhoto> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Photos,
    correctOrientation: true,
  });

  const file = await photoToFile(photo, 'library');

  return {
    file,
    webPath: photo.webPath || '',
    source: 'library',
  };
}

/**
 * Show action sheet to choose camera or library
 * On native: shows native options
 * On web: triggers file input
 */
export async function capturePhoto(preferredSource?: PhotoSource): Promise<CapturedPhoto | null> {
  if (!isNativePlatform()) {
    // On web, return null - caller should use file input
    return null;
  }

  try {
    // Request permissions first
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    if (preferredSource === 'camera') {
      return await takeNativePhoto();
    } else if (preferredSource === 'library') {
      return await pickNativePhoto();
    }

    // If no preference, use Camera.getPhoto with Prompt source
    // This shows a native action sheet on iOS
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      saveToGallery: true,
      correctOrientation: true,
      promptLabelHeader: 'Add Photo',
      promptLabelPhoto: 'Choose from Library',
      promptLabelPicture: 'Take Photo',
    });

    // Determine source based on how user chose
    const source: PhotoSource = photo.saved ? 'camera' : 'library';
    const file = await photoToFile(photo, source);

    return {
      file,
      webPath: photo.webPath || '',
      source,
    };
  } catch (error: any) {
    // User cancelled or error
    if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
      return null;
    }
    console.error('Capture photo error:', error);
    throw error;
  }
}
