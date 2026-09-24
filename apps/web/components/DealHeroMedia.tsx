"use client";

import * as React from "react";
import Image from "next/image";
import { logoNeedsUnoptimized, resolveStoreLogoUrl } from "@mpf/ui";

/**
 * The deal page's hero image — almost always the LCP element, so it is the single most
 * important image on the site to get right.
 *
 * Three fixes:
 *  - `next/image` instead of a raw `<img>`, so the merchant's full-resolution asset is
 *    resized and served as AVIF/WebP. Feed imagery is routinely 1500px+ for a slot that
 *    renders at most 480px wide. `priority` also removes it from the lazy-load queue,
 *    which is what was delaying the LCP paint.
 *  - A 4:3 aspect ratio box instead of `h-[340px]`. The fixed height cropped portrait
 *    product shots to a letterbox strip on phones, and 340px of a 375px-tall viewport is
 *    most of the fold.
 *  - `sizes` matching the real two-column layout, so phones do not download the desktop
 *    asset.
 *
 * This stays a client component (unlike DealCard, which shed `"use client"` precisely to
 * avoid hydrating 24 of them) because affiliate feeds regularly carry image URLs that
 * 404 once a merchant rotates their CDN, and one dead hero on the page a visitor landed
 * on is worth the cost of a single hydration boundary.
 */
export function DealHeroMedia({
  title,
  merchantName,
  imageUrl,
  merchantLogoUrl,
}: {
  title: string;
  merchantName: string;
  imageUrl?: string | null;
  merchantLogoUrl?: string | null;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const [logoFailed, setLogoFailed] = React.useState(false);
  const merchantLogo = resolveStoreLogoUrl(merchantName, merchantLogoUrl);
  const showProduct = Boolean(imageUrl) && !imageFailed;
  const showLogo = !showProduct && Boolean(merchantLogo) && !logoFailed;

  if (showProduct) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-muted">
        <Image
          src={imageUrl!}
          alt={title}
          fill
          // Full width below md, then half of the 1024px max-width container.
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
          priority
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  if (showLogo) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-card bg-surface-muted">
        <div className="text-center">
          <Image
            src={merchantLogo!}
            alt=""
            width={96}
            height={96}
            sizes="96px"
            // Brand icons are SVG, which the optimizer rejects. See logoNeedsUnoptimized.
            // Here the failure was quiet rather than visible — onError dropped straight
            // through to the gradient — so every popular merchant lost its logo fallback.
            unoptimized={logoNeedsUnoptimized(merchantLogo!)}
            className="mx-auto h-24 w-24 object-contain"
            priority
            onError={() => setLogoFailed(true)}
          />
          <p className="mt-3 text-card font-semibold text-ink-600">{merchantName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid aspect-[4/3] place-items-center rounded-card bg-gradient-to-br from-brand-600 to-brand-900 px-6 text-center text-white">
      <div>
        <p className="text-lg font-extrabold">{merchantName}</p>
        <p className="mt-2 line-clamp-3 text-card text-white/90">{title}</p>
      </div>
    </div>
  );
}
