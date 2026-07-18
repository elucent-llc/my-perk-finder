"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  ["Deals", "/deals"],
  ["Stores", "/stores"],
  ["Coupons", "/coupons"],
  ["About", "/about"],
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:border-brand-200 hover:text-brand-700"
      >
        {open ? (
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        ) : (
          <span aria-hidden className="flex flex-col gap-1">
            <span className="block h-0.5 w-4 rounded bg-current" />
            <span className="block h-0.5 w-4 rounded bg-current" />
            <span className="block h-0.5 w-4 rounded bg-current" />
          </span>
        )}
      </button>

      {open ? (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white px-5 py-4 shadow-card"
        >
          <nav className="flex flex-col gap-1">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
