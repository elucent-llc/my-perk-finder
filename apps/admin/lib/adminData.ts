import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AdminDeal {
  id: string;
  title: string;
  slug: string;
  merchantName: string;
  category: string;
  salePrice: number | null;
  regularPrice: number | null;
  discountPercent: number;
  status: string;
  confidenceScore?: number | null;
  expiryDate?: string | null;
  validationFlags?: string[];
}

export interface ReviewQueueResult {
  data: AdminDeal[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

async function authHeaders(): Promise<HeadersInit> {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (secret) return { Authorization: `Bearer ${secret}` };

  // Fall back to session cookie value (same secret stored after login).
  const jar = await cookies();
  const cookieSecret = jar.get("mpf_admin_local")?.value;
  if (cookieSecret) return { Authorization: `Bearer ${cookieSecret}` };
  return {};
}

async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Admin API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getKpis() {
  return adminGet<{
    activeOffers: number;
    needsReview: number;
    expiredToday: number;
    importsToday: number;
    clicksToday: number;
    emailSubscribers: number;
  }>("/api/admin/overview");
}

export async function getReviewQueue(page = 1, pageSize = 50): Promise<ReviewQueueResult> {
  return adminGet<ReviewQueueResult>(`/api/admin/review?page=${page}&pageSize=${pageSize}`);
}

export async function getOffers(): Promise<AdminDeal[]> {
  return adminGet<AdminDeal[]>("/api/admin/offers");
}

export async function getImports() {
  return adminGet<
    Array<{
      id: string;
      source: string;
      status: string;
      offersFound: number;
      created: number;
      updated: number;
      rejected: number;
      needsReview: number;
    }>
  >("/api/admin/imports");
}
