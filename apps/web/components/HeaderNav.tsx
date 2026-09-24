"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, focusRing } from "@mpf/ui";
import { NAV_ITEMS, isActivePath } from "@/components/nav-items";

/**
 * Desktop navigation. Split out as a client component purely so the current
 * section can be marked — the app previously had no active state and no
 * aria-current anywhere, so there was no "you are here" signal at all.
 */
export function HeaderNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map(({ label, href }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-control px-3 text-card font-semibold transition",
                  focusRing,
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-slate-100 hover:text-brand-700"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
