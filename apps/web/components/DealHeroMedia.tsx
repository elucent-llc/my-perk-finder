"use client";

import * as React from "react";
import { resolveStoreLogoUrl } from "@mpf/ui";

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
      <div className="overflow-hidden rounded-card bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl!}
          alt={title}
          className="h-[340px] w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  if (showLogo) {
    return (
      <div className="grid h-[340px] place-items-center rounded-card bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={merchantLogo!}
          alt=""
          className="h-24 w-24 object-contain"
          onError={() => setLogoFailed(true)}
        />
        <p className="mt-3 text-sm font-semibold text-slate-500">{merchantName}</p>
      </div>
    );
  }

  return (
    <div className="grid h-[340px] place-items-center rounded-card bg-gradient-to-br from-brand-500 to-emerald-700 px-6 text-center text-white/90">
      <div>
        <p className="text-lg font-extrabold">{merchantName}</p>
        <p className="mt-2 line-clamp-3 text-sm opacity-90">{title}</p>
      </div>
    </div>
  );
}
