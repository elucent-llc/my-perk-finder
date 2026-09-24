import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

// No force-dynamic: this is a pure function of env vars and touches no DB, so it can be
// statically generated at build time.
/**
 * Crawl budget is spent on facet noise, not on hiding pagination.
 *
 * The previous rule was a blanket `/*?`, which disallows every URL carrying a query string.
 * That included `?page=2` onwards — the only way a crawler walks past the first 24 deals of
 * a listing — so on a catalogue of any size most deal pages were reachable from the sitemap
 * alone, with no internal link a crawler was permitted to follow. It also blocked shared
 * links that happen to carry a `utm_` tag from passing any equity to the page they point at.
 *
 * The genuine problem a blanket rule was reaching for is that the facets multiply: five
 * sorts x price bands x three booleans x brand is thousands of URLs over one result set.
 * So each of those parameters is named explicitly, `page` stays crawlable, and the facets
 * that have a real canonical route of their own (`?category=`, `?store=`, which duplicate
 * /category/[slug] and /stores/[slug]) are excluded there too.
 */
const CRAWL_NOISE_PARAMS = [
  "sort",
  "brand",
  "minPrice",
  "maxPrice",
  "minDiscount",
  "couponAvailable",
  "expiresSoon",
  "verifiedToday",
  "category",
  "store",
  "q",
  "utm_source",
  "utm_medium",
  "utm_campaign",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/search",
          // `/*?*name=` matches the parameter wherever it falls in the query string.
          ...CRAWL_NOISE_PARAMS.map((param) => `/*?*${param}=`),
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
