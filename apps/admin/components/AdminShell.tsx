"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo, cn, focusRing } from "@mpf/ui";

/**
 * Only routes that exist.
 *
 * The previous list had fourteen entries pointing at four pages: "Merchants",
 * "Categories" and "Coupons" all navigated to /offers, and "Analytics", "Subscribers",
 * "Settings" and "Audit Log" all navigated to the overview. A menu that silently sends you
 * somewhere other than where you clicked is worse than a short menu — you cannot tell a
 * broken link from an unbuilt feature. Add entries back as the pages land.
 */
const NAV: Array<{ label: string; href: string }> = [
  { label: "Overview", href: "/" },
  { label: "Offers", href: "/offers" },
  { label: "Review queue", href: "/review" },
  { label: "Imports", href: "/imports" },
];

function isActive(pathname: string, href: string) {
  // "/" must match exactly or it would light up on every page.
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Admin chrome. See the sibling copy in apps/web for the full rationale; in short, the
 * `fixed w-60` rail plus `ml-60` content left a phone with 135px of usable width and no way
 * to dismiss the sidebar, nav targets were under 44px, the active section was never
 * indicated, and the "Admin" label failed AA against the near-black background.
 */
export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-screen bg-surface-sunken lg:flex">
      <aside className="bg-ink-900 text-slate-300 lg:fixed lg:inset-y-0 lg:left-0 lg:z-header lg:w-60 lg:overflow-y-auto lg:p-3">
        <div className="flex items-center gap-2.5 px-4 py-3 lg:px-2">
          <BrandLogo size={32} withWordmark={false} />
          <div>
            <div className="text-card font-bold text-white">MyPerkFinder</div>
            <div className="text-micro text-slate-400">Admin</div>
          </div>
        </div>

        <nav
          aria-label="Admin sections"
          className="border-t border-white/10 px-2 py-1.5 lg:mt-2 lg:border-0 lg:px-0 lg:py-0"
        >
          {/* Horizontal, scrollable tabs on phones; vertical rail from lg up. */}
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible">
            {NAV.map(({ label, href }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href} className="shrink-0 lg:shrink">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center whitespace-nowrap rounded-control px-3 text-card font-semibold transition",
                      focusRing,
                      active
                        ? "bg-white/15 text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 lg:ml-60">
        <header className="sticky top-0 z-header flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur sm:px-6">
          <h1 className="text-subhead font-extrabold tracking-tight text-ink-900 sm:text-xl">
            {title}
          </h1>
        </header>
        <main id="main" className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
