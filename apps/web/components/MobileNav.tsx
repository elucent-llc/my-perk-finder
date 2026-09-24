"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, focusRing } from "@mpf/ui";
import { NAV_ITEMS, FOOTER_LINKS, isActivePath } from "@/components/nav-items";

/** Focusable descendants, in DOM order, excluding anything disabled or hidden. */
function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
}

/**
 * Mobile navigation drawer.
 *
 * This previously locked body scroll while remaining a plain <div>: no dialog
 * semantics, no backdrop, no focus movement, and no containment. The rest of
 * the page stayed in the tab order *behind* an opaque overlay, so tabbing past
 * the last link landed on invisible content that could not be scrolled to.
 * It is now a real modal dialog: focus moves in on open, is trapped while open,
 * and is restored to the trigger on close.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();
  const pathname = usePathname() ?? "/";

  const close = useCallback(() => setOpen(false), []);

  // Close on route change — otherwise the drawer survives navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the drawer.
    focusables(panel!)[0]?.focus();

    // Preserve whatever inline overflow the document already had rather than
    // blindly clearing it on cleanup.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = focusables(panel);
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;

      // Wrap focus at both ends so it cannot escape behind the overlay.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Restore focus to the trigger, not to wherever the browser guesses.
      (triggerRef.current ?? previouslyFocused)?.focus();
    };
  }, [open, close]);

  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-[48px] items-center rounded-control px-3 text-ui font-semibold transition",
      focusRing,
      active ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-slate-100 hover:text-brand-700"
    );

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-control border border-slate-200 text-ink-700 transition hover:border-brand-300 hover:text-brand-700",
          focusRing
        )}
      >
        {open ? (
          <span aria-hidden className="text-xl leading-none">
            ×
          </span>
        ) : (
          <span aria-hidden className="flex flex-col gap-1">
            <span className="block h-0.5 w-4 rounded-pill bg-current" />
            <span className="block h-0.5 w-4 rounded-pill bg-current" />
            <span className="block h-0.5 w-4 rounded-pill bg-current" />
          </span>
        )}
      </button>

      {open ? (
        <>
          {/* Backdrop: dismisses on click, which the old drawer had no way to do. */}
          <div
            className="fixed inset-0 top-[var(--header-h,57px)] z-dropdown bg-ink-900/30"
            onClick={close}
            aria-hidden
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 top-full z-overlay max-h-[calc(100vh-57px)] overflow-y-auto border-b border-slate-200 bg-white px-5 pb-6 pt-4 shadow-overlay"
          >
            <h2 id={titleId} className="sr-only">
              Site menu
            </h2>
            <ul className="flex flex-col gap-0.5">
              <li>
                <Link href="/search" onClick={close} className={itemClass(isActivePath(pathname, "/search"))}>
                  Search deals
                </Link>
              </li>
              {NAV_ITEMS.map(({ label, href }) => {
                const active = isActivePath(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={itemClass(active)}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <hr className="my-3 border-slate-200" />

            <ul className="flex flex-col gap-0.5">
              {FOOTER_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={close}
                    className={cn(
                      "flex min-h-[44px] items-center rounded-control px-3 text-sm text-ink-600 transition hover:bg-slate-100",
                      focusRing
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
