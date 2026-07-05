const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AdminDeal {
  id: string;
  title: string;
  slug: string;
  merchantName: string;
  category: string;
  salePrice: number;
  regularPrice: number;
  discountPercent: number;
  status: string;
  confidenceScore?: number | null;
  expiryDate?: string | null;
  validationFlags?: string[];
}

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const MOCK_KPIS = {
  activeOffers: 12480,
  needsReview: 218,
  expiredToday: 94,
  importsToday: 12,
  clicksToday: 38204,
  emailSubscribers: 54120,
};

export const MOCK_OFFERS: AdminDeal[] = [
  { id: "1", title: "Apple AirPods Pro (2nd Gen)", slug: "airpods", merchantName: "Best Buy", category: "Audio", salePrice: 189, regularPrice: 249, discountPercent: 24, status: "active", confidenceScore: 0.96, expiryDate: new Date(Date.now() + 2 * 864e5).toISOString(), validationFlags: [] },
  { id: "2", title: "Sony WH-1000XM5", slug: "sony", merchantName: "Amazon", category: "Audio", salePrice: 328, regularPrice: 399, discountPercent: 18, status: "needs_review", confidenceScore: 0.61, expiryDate: new Date(Date.now() + 5 * 864e5).toISOString(), validationFlags: ["discount_too_high"] },
  { id: "3", title: "Ninja Air Fryer Max XL", slug: "ninja", merchantName: "Target", category: "Home", salePrice: 119, regularPrice: 169, discountPercent: 30, status: "active", confidenceScore: 0.91, expiryDate: new Date(Date.now() + 3 * 864e5).toISOString(), validationFlags: [] },
  { id: "4", title: "Dell XPS 13 Laptop", slug: "dell", merchantName: "Dell", category: "Electronics", salePrice: 899, regularPrice: 1199, discountPercent: 25, status: "expired", confidenceScore: 0.79, expiryDate: new Date(Date.now() - 864e5).toISOString(), validationFlags: ["expired_date"] },
  { id: "5", title: "Cheap Laptop Deal", slug: "cheap", merchantName: "eBay", category: "Electronics", salePrice: 210, regularPrice: 180, discountPercent: 0, status: "rejected", confidenceScore: 0.4, validationFlags: ["sale_higher_than_regular"] },
];

export const MOCK_IMPORTS = [
  { id: "j1", source: "cj", status: "completed", offersFound: 6200, created: 410, updated: 1820, rejected: 120, needsReview: 37 },
  { id: "j2", source: "rakuten", status: "running", offersFound: 2140, created: 88, updated: 640, rejected: 30, needsReview: 12 },
  { id: "j3", source: "walmart", status: "partial_success", offersFound: 4900, created: 320, updated: 1100, rejected: 280, needsReview: 60 },
  { id: "j4", source: "merchant_email", status: "failed", offersFound: 0, created: 0, updated: 0, rejected: 0, needsReview: 0 },
];

export async function getKpis() {
  return safeGet("/api/admin/overview", MOCK_KPIS);
}
export async function getReviewQueue(): Promise<AdminDeal[]> {
  return safeGet<AdminDeal[]>("/api/admin/review", MOCK_OFFERS.filter((o) => o.status === "needs_review"));
}
export async function getOffers(): Promise<AdminDeal[]> {
  return safeGet<AdminDeal[]>("/api/admin/offers", MOCK_OFFERS);
}
export async function getImports() {
  return safeGet("/api/admin/imports", MOCK_IMPORTS);
}
