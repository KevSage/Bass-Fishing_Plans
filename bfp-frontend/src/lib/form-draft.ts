// src/lib/form-draft.ts
/**
 * Utilities for saving/restoring catch form drafts during page navigation.
 * Uses Capacitor Preferences for native apps (localStorage doesn't work reliably in Capacitor WebViews).
 */

import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "./platform";

const DRAFT_KEY = "bc_catch_form_draft";
const DRAFT_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export type CatchFormDraft = {
  lakeName: string;
  lure: string;
  color: string;
  species: string;
  weight: string;
  length: string;
  notes: string;
  photoUrl: string;
  photoPreview: string;
  caughtAt: string;
  source: string;
  // Weather
  temp: string;
  windSpeed: string;
  pressure: string;
  sky: string;
  // Manual date/time
  manualDate: string;
  manualTime: string;
  // Pending lake query (for LakeBuilder)
  pendingLakeQuery?: string;
};

// In-memory fallback for when both storage methods fail
let memoryDraft: { draft: CatchFormDraft; savedAt: number } | null = null;

export async function saveCatchFormDraftAsync(draft: CatchFormDraft): Promise<void> {
  try {
    console.log("[Draft] Saving draft:", {
      hasPhotoUrl: !!draft.photoUrl,
      photoUrlLength: draft.photoUrl?.length || 0,
      hasPhotoPreview: !!draft.photoPreview,
      photoPreviewLength: draft.photoPreview?.length || 0,
      lakeName: draft.lakeName,
    });

    // For native, don't store large base64 - just store the photoUrl
    // The photoPreview can be huge and Preferences has limits too
    let draftToSave = draft;
    const previewSizeKB = (draft.photoPreview?.length || 0) / 1024;
    if (previewSizeKB > 500) {
      console.log("[Draft] PhotoPreview too large (" + previewSizeKB.toFixed(0) + "KB), storing in memory only");
      // Store full draft in memory, minimal draft in Preferences
      memoryDraft = { draft, savedAt: Date.now() };
      draftToSave = { ...draft, photoPreview: "__MEMORY__" };
    }

    const payload = JSON.stringify({
      ...draftToSave,
      savedAt: Date.now(),
    });
    console.log("[Draft] Payload size:", (payload.length / 1024).toFixed(1), "KB");

    if (isNativePlatform()) {
      // Use Capacitor Preferences for native
      await Preferences.set({ key: DRAFT_KEY, value: payload });
      console.log("[Draft] Save successful (Capacitor Preferences)");
    } else {
      // Use localStorage for web
      localStorage.setItem(DRAFT_KEY, payload);
      console.log("[Draft] Save successful (localStorage)");
    }
  } catch (e) {
    console.error("[Draft] Failed to save form draft:", e);
    // Always save to memory as fallback
    memoryDraft = { draft, savedAt: Date.now() };
    console.log("[Draft] Saved to memory as fallback");
  }
}

// Sync wrapper for backwards compatibility
export function saveCatchFormDraft(draft: CatchFormDraft): void {
  // Fire and forget the async version
  saveCatchFormDraftAsync(draft).catch(e => {
    console.error("[Draft] Async save failed:", e);
  });
  // Also store in memory immediately as backup
  memoryDraft = { draft, savedAt: Date.now() };
}

export async function loadCatchFormDraftAsync(): Promise<CatchFormDraft | null> {
  try {
    let stored: string | null = null;

    if (isNativePlatform()) {
      const result = await Preferences.get({ key: DRAFT_KEY });
      stored = result.value;
      console.log("[Draft] Loading from Capacitor Preferences, stored:", !!stored);
    } else {
      stored = localStorage.getItem(DRAFT_KEY);
      console.log("[Draft] Loading from localStorage, stored:", !!stored);
    }

    // Check memory draft first if storage is empty or failed
    if (!stored && memoryDraft) {
      console.log("[Draft] Using memory fallback");
      if (Date.now() - memoryDraft.savedAt <= DRAFT_EXPIRY_MS) {
        const draft = memoryDraft.draft;
        memoryDraft = null;
        return draft;
      }
      memoryDraft = null;
      return null;
    }

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Check expiry
    if (Date.now() - parsed.savedAt > DRAFT_EXPIRY_MS) {
      console.log("[Draft] Draft expired");
      await clearCatchFormDraftAsync();
      return null;
    }

    // Remove savedAt from the returned object
    const { savedAt, ...draft } = parsed;

    // If photoPreview was stored in memory, restore it
    if (draft.photoPreview === "__MEMORY__" && memoryDraft) {
      console.log("[Draft] Restoring photoPreview from memory");
      draft.photoPreview = memoryDraft.draft.photoPreview;
      memoryDraft = null;
    }

    console.log("[Draft] Loaded draft:", {
      hasPhotoUrl: !!draft.photoUrl,
      photoUrlLength: draft.photoUrl?.length || 0,
      hasPhotoPreview: !!draft.photoPreview,
      photoPreviewLength: draft.photoPreview?.length || 0,
      lakeName: draft.lakeName,
    });
    return draft as CatchFormDraft;
  } catch (e) {
    console.error("[Draft] Failed to load form draft:", e);
    // Try memory fallback
    if (memoryDraft && Date.now() - memoryDraft.savedAt <= DRAFT_EXPIRY_MS) {
      console.log("[Draft] Using memory fallback after error");
      const draft = memoryDraft.draft;
      memoryDraft = null;
      return draft;
    }
    return null;
  }
}

// Sync wrapper - returns null, caller should use async version
export function loadCatchFormDraft(): CatchFormDraft | null {
  // For sync access, only memory draft is available
  if (memoryDraft && Date.now() - memoryDraft.savedAt <= DRAFT_EXPIRY_MS) {
    console.log("[Draft] Sync load: returning memory draft");
    const draft = memoryDraft.draft;
    return draft;
  }
  console.log("[Draft] Sync load: no memory draft available");
  return null;
}

export async function clearCatchFormDraftAsync(): Promise<void> {
  try {
    memoryDraft = null;
    if (isNativePlatform()) {
      await Preferences.remove({ key: DRAFT_KEY });
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  } catch (e) {
    console.error("[Draft] Failed to clear form draft:", e);
  }
}

export function clearCatchFormDraft(): void {
  memoryDraft = null;
  clearCatchFormDraftAsync().catch(e => {
    console.error("[Draft] Async clear failed:", e);
  });
}

export async function hasCatchFormDraftAsync(): Promise<boolean> {
  try {
    if (memoryDraft && Date.now() - memoryDraft.savedAt <= DRAFT_EXPIRY_MS) {
      return true;
    }

    let stored: string | null = null;
    if (isNativePlatform()) {
      const result = await Preferences.get({ key: DRAFT_KEY });
      stored = result.value;
    } else {
      stored = localStorage.getItem(DRAFT_KEY);
    }

    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return Date.now() - parsed.savedAt <= DRAFT_EXPIRY_MS;
  } catch {
    return memoryDraft !== null && Date.now() - memoryDraft.savedAt <= DRAFT_EXPIRY_MS;
  }
}

export function hasCatchFormDraft(): boolean {
  return memoryDraft !== null && Date.now() - memoryDraft.savedAt <= DRAFT_EXPIRY_MS;
}
