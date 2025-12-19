// src/lib/api.ts
import type { PlanResponse } from "../features/plan/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
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
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function generatePreview(payload: any): Promise<PlanResponse> {
  return await apiPost<PlanResponse>("/plan/preview", payload);
}

export type MembersRequest = {
  email: string;
  water: { name: string; lat: number; lon: number; mapbox_place_id?: string };
  trip_date?: string;
};

export async function generateMemberPlan(
  payload: MembersRequest
): Promise<PlanResponse> {
  return await apiPost<PlanResponse>("/plan/members", payload);
}
