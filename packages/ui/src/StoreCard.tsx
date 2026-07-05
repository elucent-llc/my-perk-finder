import * as React from "react";
import { Badge } from "./Badge.js";

export interface StoreCardData {
  name: string;
  slug: string;
  initials: string;
  dealsCount: number;
  couponsCount: number;
  verified?: boolean;
}

export function StoreCard({ store, href = "#" }: { store: StoreCardData; href?: string }) {
  return (
    <a
      href={href}
      className="block rounded-card border border-slate-200 bg-white p-4 text-center shadow-card-sm transition hover:border-brand-200"
    >
      <div className="mx-auto mb-2.5 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-500">
        {store.initials}
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
