import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getSitemap } from "@/lib/api";

// Cannot be prerendered: the Railway build has no route to postgres.railway.internal.
// The 5000-row query is cached for an hour in lib/api, so crawler hits do not each pay
// for it.
export const dynamic = "force-dynamic";

/**
 * Dynamic sitemap. Includes only public, indexable, active content.
 * Excludes /admin, /api/*, /search, and any filter/query URLs by construction
 * (we never emit query strings here).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/deals"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/coupons"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/stores"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const legalEntries: MetadataRoute.Sitemap = [
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/affiliate-disclosure",
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const { deals, stores, categories } = await getSitemap();
    dynamicEntries = [
      ...stores.map((s) => ({
        url: absoluteUrl(`/stores/${s.slug}`),
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...categories.map((c) => ({
        url: absoluteUrl(`/category/${c.slug}`),
        lastModified: c.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...deals.map((d) => ({
        url: absoluteUrl(`/deal/${d.slug}`),
        lastModified: d.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // If the DB is unreachable at request time, still serve the static sitemap.
  }

  return [...staticEntries, ...legalEntries, ...dynamicEntries];
}
