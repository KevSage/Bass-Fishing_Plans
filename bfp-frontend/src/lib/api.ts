// src/lib/api.ts
// Updated to use new backend /plan/generate endpoint

import type { PlanGenerateResponse, PlanViewResponse, RateLimitError } from "../features/plan/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY;

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Handle rate limit errors specially
    if (res.status === 429) {
      const errorData = await res.json() as RateLimitError;
      throw new RateLimitError(errorData);
    }
    
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text || res.statusText}`);
  }
  
  return (await res.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text || res.statusText}`);
  }
  
  return (await res.json()) as T;
}

// Custom error class for rate limits
export class RateLimitError extends Error {
  error: "rate_limit_preview" | "rate_limit_member";
  seconds_remaining: number;
  upgrade_url?: string;

  constructor(data: RateLimitError) {
    super(data.message);
    this.name = "RateLimitError";
    this.error = data.error;
    this.seconds_remaining = data.seconds_remaining;
    this.upgrade_url = data.upgrade_url;
  }

  get hoursRemaining(): number {
    return this.seconds_remaining / 3600;
  }

  get daysRemaining(): number {
    return this.seconds_remaining / (24 * 3600);
  }
}

// Generate plan (unified endpoint for both preview and member)
export type GeneratePlanRequest = {
  email: string;
  latitude: number;
  longitude: number;
  location_name: string;
};

export async function generatePlan(
  payload: GeneratePlanRequest
): Promise<PlanGenerateResponse> {
  return await apiPost<PlanGenerateResponse>("/plan/generate", payload);
}

// View a saved plan
export async function viewPlan(token: string): Promise<PlanViewResponse> {
  return await apiGet<PlanViewResponse>(`/plan/view/${token}`);
}

// Subscribe (Stripe checkout)
export async function createCheckoutSession(email: string): Promise<{ checkout_url: string }> {
  return await apiPost<{ checkout_url: string }>("/billing/subscribe", { email });
}

// Legacy functions for backward compatibility
export async function generatePreview(payload: any): Promise<PlanGenerateResponse> {
  // Convert old payload format to new format
  const newPayload: GeneratePlanRequest = {
    email: payload.email,
    latitude: payload.lat ?? payload.latitude ?? 0,
    longitude: payload.lon ?? payload.longitude ?? 0,
    location_name: payload.water?.name ?? payload.location_name ?? "Unknown Lake",
  };
  
  return await generatePlan(newPayload);
}

export type MembersRequest = {
  email: string;
  water: { name: string; lat: number; lon: number; mapbox_place_id?: string };
  trip_date?: string;
};

export async function generateMemberPlan(
  payload: MembersRequest
): Promise<PlanGenerateResponse> {
  // Convert old payload format to new format
  const newPayload: GeneratePlanRequest = {
    email: payload.email,
    latitude: payload.water.lat,
    longitude: payload.water.lon,
    location_name: payload.water.name,
  };
  
  return await generatePlan(newPayload);
}
