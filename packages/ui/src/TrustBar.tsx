import * as React from "react";
import { Icon, type IconName } from "./Icon.js";

export interface TrustBarProps {
  items: { icon: IconName; label: string; value?: string }[];
  className?: string;
}

/** Compact credibility strip — live counts + reassurance, above the fold. */
export function TrustBar({ items, className }: TrustBarProps) {
  return (
    <div
      className={
        "mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 " +
        (className ?? "")
      }
    >
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-sm">
          <Icon name={it.icon} size={16} className="opacity-90" />
          {it.value ? <b className="font-extrabold">{it.value}</b> : null}
          <span className="opacity-90">{it.label}</span>
        </span>
      ))}
    </div>
  );
}
