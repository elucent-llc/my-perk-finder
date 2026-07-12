"use client";

import * as React from "react";
import { Badge } from "./Badge.js";
import { merchantInitials, resolveStoreLogoUrl } from "./store-logos.js";

export interface StoreCardData {
  name: string;
  slug: string;
  dealsCount: number;
  couponsCount: number;
  verified?: boolean;
  logoUrl?: string | null;
}

export function StoreCard({ store, href = "#" }: { store: StoreCardData; href?: string }) {
  const logoUrl = resolveStoreLogoUrl(store.slug, store.logoUrl);
  const [logoFailed, setLogoFailed] = React.useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <a
      href={href}
      className="block rounded-card border border-slate-200 bg-white p-4 text-center shadow-card-sm transition hover:border-brand-200"
    >
      <div className="mx-auto mb-2.5 grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-slate-100 bg-white text-sm font-bold text-slate-500">
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl!}
            alt=""
            className="h-9 w-9 object-contain"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          merchantInitials(store.name)
        )}
      </div>
      <div className="text-sm font-bold text-slate-800">{store.name}</div>
      <div className="mt-0.5 text-[11.5px] text-slate-500">
        {store.dealsCount} deals · {store.couponsCount} coupons
      </div>
      {store.verified ? (
        <div className="mt-2">
          <Badge tone="verified">✓ Verified</Badge>
        </div>
      ) : null}
    </a>
  );
}
