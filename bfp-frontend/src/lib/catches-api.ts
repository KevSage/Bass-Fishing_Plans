// src/lib/catches-api.ts
/**
 * API client for catch logging endpoints.
 * Talks to FastAPI backend on Render.
 */
import { getApiBaseUrl, isNativePlatform } from "./platform";

// Use platform-aware API base URL
const getApiBase = () => getApiBaseUrl();

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
  temp?: number;
  wind_speed?: number;
  wind_direction?: string;
  pressure?: number;
  sky_condition?: string;
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
  temp?: number;
  wind_speed?: number;
  wind_direction?: string;
  pressure?: number;
  sky_condition?: string;
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
  anchors?: { lat: number; lng: number }[]; // Added anchors type
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

  const response = await fetch(`${getApiBase()}${endpoint}`, {
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

/**
 * List catches for mobile app using email instead of JWT.
 * Uses the mobile-auth endpoint that accepts email directly.
 */
export async function listCatchesMobile(
  email: string,
  userId: string,
  limit = 500,
  offset = 0,
): Promise<{ catches: CatchRecord[]; total: number }> {
  const response = await fetch(`${getApiBase()}/mobile-auth/catches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, user_id: userId, limit, offset }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch catches: ${response.status}`);
  }

  return response.json();
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
    `/catches/by-lake/${encodeURIComponent(lakeId)}?lake_type=${lakeType}`,
    {},
    token,
  );
}

// Fix: Use apiRequest to ensure API_BASE and Authorization headers are attached
export async function updateCatch(
  catchId: string,
  data: CreateCatchInput,
  token: string,
): Promise<CatchRecord> {
  return apiRequest(
    `/catches/${catchId}`, // Prepend slash to ensure correct path
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
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
    anchors?: { lat: number; lng: number }[];
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

export async function updateCustomLake(
  lakeId: string,
  payload: {
    name?: string;
    lat?: number;
    lng?: number;
    city?: string | null;
    state?: string | null;
    anchors?: Array<{ lat: number; lng: number }>;
  },
  token: string,
): Promise<{ success: boolean }> {
  return apiRequest(
    `/custom-lakes/${lakeId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

// --- NEW FUNCTION FOR LAKE BUILDER ---
export async function updateCustomLakeGeometry(
  lakeId: string,
  anchors: { lat: number; lng: number }[],
  token: string,
  acres?: number,
): Promise<{ success: boolean }> {
  return apiRequest(
    `/custom-lakes/${lakeId}/geometry`,
    {
      method: "PUT",
      body: JSON.stringify({ anchors, acres }),
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
    `/favorites/${encodeURIComponent(lakeId)}?lake_type=${lakeType}`,
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

export async function resolveLakeMobile(
  lat: number,
  lng: number,
  email: string,
  userId: string,
  radiusKm = 1.0,
): Promise<ResolvedLake> {
  const response = await fetch(`${getApiBase()}/mobile-auth/resolve-lake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      user_id: userId,
      lat,
      lng,
      radius_km: radiusKm,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to resolve lake: ${response.status}`);
  }
  return response.json();
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

// =============================================================================
// MOBILE-SPECIFIC API FUNCTIONS
// =============================================================================

/**
 * List favorites for mobile app using email instead of JWT.
 */
export async function listFavoritesMobile(
  email: string,
  userId: string,
): Promise<{ favorites: FavoriteLake[]; total: number }> {
  const response = await fetch(`${getApiBase()}/mobile-auth/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, user_id: userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.status}`);
  }

  return response.json();
}

/**
 * Add a lake to favorites for mobile app using email instead of JWT.
 */
export async function addFavoriteMobile(
  email: string,
  userId: string,
  lakeId: string,
  lakeType: LakeType,
): Promise<{ success: boolean; added: boolean; lake_id: string; lake_type: LakeType }> {
  const response = await fetch(`${getApiBase()}/mobile-auth/add-favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, user_id: userId, lake_id: lakeId, lake_type: lakeType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add favorite: ${response.status}`);
  }

  return response.json();
}

/**
 * Remove a favorite lake for mobile app using email instead of JWT.
 */
export async function removeFavoriteMobile(
  email: string,
  userId: string,
  lakeId: string,
  lakeType: LakeType,
): Promise<{ success: boolean; removed_id: string | null }> {
  const response = await fetch(`${getApiBase()}/mobile-auth/remove-favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, user_id: userId, lake_id: lakeId, lake_type: lakeType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to remove favorite: ${response.status}`);
  }

  return response.json();
}

/**
 * List custom lakes for mobile app using email instead of JWT.
 */
export async function listCustomLakesMobile(
  email: string,
  userId: string,
): Promise<{ lakes: CustomLake[]; total: number }> {
  const response = await fetch(`${getApiBase()}/mobile-auth/custom-lakes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, user_id: userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch custom lakes: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a custom lake for mobile app using email instead of JWT.
 */
export async function createCustomLakeMobile(
  email: string,
  userId: string,
  input: {
    name: string;
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    anchors?: { lat: number; lng: number }[];
  },
): Promise<
  | { success: boolean; lake_id: string; already_existed?: boolean }
  | { success: false; error: string; existing_lake?: CustomLake }
> {
  const response = await fetch(`${getApiBase()}/mobile-auth/create-custom-lake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      user_id: userId,
      ...input,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create custom lake: ${response.status}`);
  }

  return response.json();
}

/**
 * List plan history for mobile app using email instead of JWT.
 */
export async function listPlanHistoryMobile(
  email: string,
  userId: string,
  limit = 10,
  offset = 0,
): Promise<{ plans: any[]; total: number; has_more: boolean }> {
  const response = await fetch(`${getApiBase()}/mobile-auth/plan-history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, user_id: userId, limit, offset }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch plan history: ${response.status}`);
  }

  return response.json();
}
