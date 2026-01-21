// src/lib/catches-api.ts
/**
 * API client for catch logging endpoints.
 * Talks to FastAPI backend on Render.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://your-api.onrender.com";

// =============================================================================
// TYPES
// =============================================================================

export type CatchSource = "camera" | "library" | "manual";
export type LakeType = "known" | "custom" | "unresolved";
export type BassSpecies = "largemouth" | "smallmouth" | "spotted";

export type CatchRecord = {
  id: string;
  date: string;
  time: string | null;
  species: string;
  weight: number | null;
  length: number | null;
  lure: string | null;
  color: string | null;
  notes: string | null;
  photo_url: string | null;
  lat: number;
  lng: number;
  lake_id: string | null;
  lake_type: LakeType;
  lake_name: string | null;
  city: string | null;
  state: string | null;
  source: CatchSource;
  created_at: string;
};

export type CreateCatchInput = {
  date: string; // YYYY-MM-DD
  species: string;
  lat: number;
  lng: number;
  time?: string; // HH:MM
  weight?: number;
  length?: number;
  lure?: string;
  color?: string;
  notes?: string;
  photo_url?: string;
  lake_id?: string;
  lake_type?: LakeType;
  lake_name?: string;
  city?: string;
  state?: string;
  source?: CatchSource;
};

export type CustomLake = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
  catch_count: number;
  created_at: string;
};

export type FavoriteLake = {
  lake_id: string;
  lake_type: LakeType;
  name: string;
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
  catch_count?: number;
  added_at: string;
};

export type ResolvedLake = {
  resolved: boolean;
  lake_type: LakeType;
  lake_id: string | null;
  lake_name: string | null;
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
};

// =============================================================================
// HELPERS
// =============================================================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// CATCHES API
// =============================================================================

export async function createCatch(
  input: CreateCatchInput,
  token: string,
): Promise<{ success: boolean; catch_id: string }> {
  return apiRequest(
    "/catches",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function listCatches(
  token: string,
  limit = 50,
  offset = 0,
): Promise<{ catches: CatchRecord[]; total: number; has_more: boolean }> {
  return apiRequest(`/catches?limit=${limit}&offset=${offset}`, {}, token);
}

export async function getCatch(
  catchId: string,
  token: string,
): Promise<{ catch: CatchRecord }> {
  return apiRequest(`/catches/${catchId}`, {}, token);
}

export async function deleteCatch(
  catchId: string,
  token: string,
): Promise<{ success: boolean; deleted_id: string }> {
  return apiRequest(`/catches/${catchId}`, { method: "DELETE" }, token);
}

export async function listCatchesByLake(
  lakeId: string,
  lakeType: LakeType,
  token: string,
): Promise<{ catches: CatchRecord[]; total: number }> {
  return apiRequest(
    `/catches/by-lake/${lakeId}?lake_type=${lakeType}`,
    {},
    token,
  );
}

// =============================================================================
// CUSTOM LAKES API
// =============================================================================

export async function createCustomLake(
  input: {
    name: string;
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  },
  token: string,
): Promise<
  | { success: boolean; lake_id: string }
  | { success: false; error: string; existing_lake: CustomLake }
> {
  return apiRequest(
    "/custom-lakes",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function listCustomLakes(
  token: string,
): Promise<{ lakes: CustomLake[]; total: number }> {
  return apiRequest("/custom-lakes", {}, token);
}

export async function renameCustomLake(
  lakeId: string,
  newName: string,
  token: string,
): Promise<{ success: boolean; lake_id: string; new_name: string }> {
  return apiRequest(
    `/custom-lakes/${lakeId}`,
    {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    },
    token,
  );
}

export async function deleteCustomLake(
  lakeId: string,
  token: string,
): Promise<{ success: boolean; deleted_id: string | null }> {
  return apiRequest(`/custom-lakes/${lakeId}`, { method: "DELETE" }, token);
}

// =============================================================================
// FAVORITES API
// =============================================================================

export async function addFavorite(
  lakeId: string,
  lakeType: LakeType,
  token: string,
): Promise<{
  success: boolean;
  added: boolean;
  lake_id: string;
  lake_type: LakeType;
}> {
  return apiRequest(
    "/favorites",
    {
      method: "POST",
      body: JSON.stringify({ lake_id: lakeId, lake_type: lakeType }),
    },
    token,
  );
}

export async function removeFavorite(
  lakeId: string,
  lakeType: LakeType,
  token: string,
): Promise<{ success: boolean; removed_id: string | null }> {
  return apiRequest(
    `/favorites/${lakeId}?lake_type=${lakeType}`,
    { method: "DELETE" },
    token,
  );
}

export async function listFavorites(
  token: string,
): Promise<{ favorites: FavoriteLake[]; total: number }> {
  return apiRequest("/favorites", {}, token);
}

// =============================================================================
// LAKE RESOLUTION API
// =============================================================================

export async function resolveLake(
  lat: number,
  lng: number,
  token: string,
  radiusKm = 1.0,
): Promise<ResolvedLake> {
  return apiRequest(
    "/lakes/resolve",
    {
      method: "POST",
      body: JSON.stringify({ lat, lng, radius_km: radiusKm }),
    },
    token,
  );
}
export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  token: string,
): Promise<{ upload_url: string; public_url: string }> {
  return apiRequest(
    "/uploads/presigned",
    {
      method: "POST",
      body: JSON.stringify({ file_name: fileName, content_type: contentType }),
    },
    token,
  );
}

export async function uploadFileToR2(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });
  if (!response.ok) throw new Error("Failed to upload image to cloud");
}
