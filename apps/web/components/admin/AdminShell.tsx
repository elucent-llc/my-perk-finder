"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo, Icon, cn, focusRing } from "@mpf/ui";

const NAV: Array<{ label: string; href: string }> = [
  { label: "Overview", href: "/admin" },
  { label: "Offers", href: "/admin/offers" },
  { label: "Review queue", href: "/admin/review" },
  { label: "Imports", href: "/admin/imports" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Admin chrome.
 *
 * The old shell was desktop-only in a way that made it unusable rather than merely
 * cramped: a `fixed w-60` sidebar with `ml-60` content meant that on a 375px phone the
 * navigation covered 240px and the actual page had 135px to work in, with no way to
 * dismiss it. The rail now only becomes a fixed rail at `lg`; below that it collapses to a
 * horizontally scrollable row of tabs above the content. No JS is needed for that — it is
 * a flex-direction change — so the only reason this is a client component is `usePathname`
 * for the active-section state, which the sidebar never showed at all. Being unable to tell
 * which section you are in is a much bigger problem in a tool with four near-identical
 * table pages than it is on the public site.
 *
 * Other fixes: nav targets were ~36px and are now 44px (SC 2.5.8); the "Admin" label was
 * `text-ink-500` on near-black, about 3:1 and below AA for text; the focus ring was the
 * browser default over a dark background; and the `← Public site` arrow was a text glyph
 * inside the link label, which screen readers read out as part of the name.
 */
export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-screen bg-surface-sunken lg:flex">
      <aside className="bg-ink-900 text-slate-300 lg:fixed lg:inset-y-0 lg:left-0 lg:z-header lg:w-60 lg:overflow-y-auto lg:p-3">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-2">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={32} withWordmark={false} />
            <div>
              <div className="text-card font-bold text-white">MyPerkFinder</div>
              <div className="text-micro text-slate-400">Admin</div>
            </div>
          </div>
          <Link
            href="/"
            className={cn(
              "inline-flex min-h-[44px] items-center gap-1.5 rounded-control px-2 text-mini font-semibold text-slate-300 hover:bg-white/10 hover:text-white lg:hidden",
              focusRing
            )}
          >
            <Icon name="arrow-left" size={14} />
            Public site
          </Link>
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

        <div className="hidden lg:mt-4 lg:block lg:border-t lg:border-white/10 lg:pt-3">
          <Link
            href="/"
            className={cn(
              "flex min-h-[44px] items-center gap-1.5 rounded-control px-3 text-card font-semibold text-slate-300 hover:bg-white/10 hover:text-white",
              focusRing
            )}
          >
            <Icon name="arrow-left" size={14} />
            Public site
          </Link>
        </div>
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
