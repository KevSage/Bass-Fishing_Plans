/**
 * API Client for Bass Clarity Backend
 */
import { API_BASE_URL, APP_CONFIG } from '@/constants/config';

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  secondsRemaining: number;

  constructor(message: string, secondsRemaining: number) {
    super(message);
    this.name = 'RateLimitError';
    this.secondsRemaining = secondsRemaining;
  }

  get hoursRemaining(): number {
    return Math.ceil(this.secondsRemaining / 3600);
  }
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  token?: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.apiTimeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      const data = await response.json();
      throw new RateLimitError(
        data.message || 'Rate limit exceeded',
        data.seconds_remaining || 3600
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `Request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof RateLimitError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * GET request helper
 */
export function apiGet<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>('GET', path, token);
}

/**
 * POST request helper
 */
export function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
  token?: string
): Promise<T> {
  return apiRequest<T>('POST', path, token, body);
}

/**
 * PUT request helper
 */
export function apiPut<T>(
  path: string,
  body: Record<string, unknown>,
  token?: string
): Promise<T> {
  return apiRequest<T>('PUT', path, token, body);
}

/**
 * DELETE request helper
 */
export function apiDelete<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>('DELETE', path, token);
}

// ============================================
// Member Status API
// ============================================

export interface MemberStatus {
  email: string;
  is_member: boolean;
  has_subscription: boolean;
  rate_limit_allowed: boolean;
  rate_limit_seconds: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  next_billing_date: number | null;
  cancel_at_period_end: boolean | null;
  plan_interval: string | null;
  plan_amount: number | null;
}

export async function getMemberStatus(token: string): Promise<MemberStatus> {
  return apiGet<MemberStatus>('/members/status', token);
}
