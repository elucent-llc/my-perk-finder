import type { Metadata } from "next";
import { getSiteUrl } from "./site";

export const SITE_NAME = "MyPerkFinder";
export const SITE_TAGLINE = "Find better deals, coupons & perks";
export const DEFAULT_DESCRIPTION =
  "Discover verified product deals, coupon codes, and store promotions in one place. Compare savings, then shop at the merchant.";
/** Dynamic branded OG image route (see app/opengraph-image.tsx). */
export const DEFAULT_OG_IMAGE = "/opengraph-image";
export const TWITTER_HANDLE = "@myperkfinder";

/** Absolute URL for a path using NEXT_PUBLIC_SITE_URL (falls back to Railway/localhost). */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

interface BuildMetaInput {
  /** Final <title> text (used verbatim — no template suffix). */
  title: string;
  description: string;
  /** Clean canonical path, e.g. "/deals" or "/stores/best-buy". */
  path: string;
  /** Path or absolute URL to a social image. Defaults to the branded OG route. */
  image?: string;
  /** When true, emit noindex,follow (page stays crawlable but out of the index). */
  noindex?: boolean;
  ogType?: "website" | "article";
  keywords?: string[];
}

/** Build a complete Metadata object with canonical, Open Graph, and Twitter tags. */
export function buildMetadata(input: BuildMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.image
    ? input.image.startsWith("http")
      ? input.image
      : absoluteUrl(input.image)
    : absoluteUrl(DEFAULT_OG_IMAGE);

  return {
    title: { absolute: input.title },
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: input.ogType ?? "website",
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

/* ----------------------------- JSON-LD builders ---------------------------- */

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.svg"),
    description: DEFAULT_DESCRIPTION,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

interface ProductLdInput {
  title: string;
  slug: string;
  merchantName: string;
  brand?: string | null;
  imageUrl?: string | null;
  salePrice?: number | null;
  currency?: string | null;
  expiryDate?: string | null;
}

/**
 * Product + Offer JSON-LD. Returns null unless a valid positive price exists,
 * so coupon-only / price-less deals never emit Offer markup with a fake price.
 */
export function productLd(deal: ProductLdInput): object | null {
  if (deal.salePrice == null || !(deal.salePrice > 0)) return null;
  const url = absoluteUrl(`/deal/${deal.slug}`);
  const priceValidUntil = deal.expiryDate
    ? new Date(deal.expiryDate).toISOString().slice(0, 10)
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: deal.title,
    ...(deal.imageUrl ? { image: [deal.imageUrl] } : {}),
    ...(deal.brand ? { brand: { "@type": "Brand", name: deal.brand } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: deal.currency ?? "USD",
      price: Number(deal.salePrice.toFixed(2)),
      availability: "https://schema.org/InStock",
      url,
      ...(priceValidUntil ? { priceValidUntil } : {}),
      seller: { "@type": "Organization", name: deal.merchantName },
    },
  };
}

interface ArticleLdInput {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  image?: string | null;
}

/** Article JSON-LD for blog / guide pages. */
export function articleLd(a: ArticleLdInput): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    mainEntityOfPage: absoluteUrl(a.path),
    image: a.image ? [a.image.startsWith("http") ? a.image : absoluteUrl(a.image)] : undefined,
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
  };
}

/** "Updated Jul 2026"-style suffix for evergreen listing titles. */
export function monthYear(date: Date = new Date()): string {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}
