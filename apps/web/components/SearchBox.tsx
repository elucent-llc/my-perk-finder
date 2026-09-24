"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Icon, cn, focusRingWithin } from "@mpf/ui";

interface Suggestion {
  slug: string;
  title: string;
  merchantName: string;
  discountPercent: number;
}

/**
 * Search field with typeahead.
 *
 * `/api/search` existed, was indexed and cached, and nothing in the app ever called it —
 * search was a plain form post to a page that then hard-capped at 24 results. Typeahead
 * is table stakes for retail search, and it is also the cheapest way to rescue a query
 * that would otherwise return nothing.
 *
 * Built as a real ARIA 1.2 combobox (`aria-expanded` / `aria-controls` /
 * `aria-activedescendant` on the input, `role="listbox"` on the popup) with arrow-key and
 * Escape handling. The surrounding element is a GET form, so with JS disabled or before
 * hydration this degrades to exactly the behaviour it had before.
 */
export function SearchBox({
  defaultValue = "",
  autoFocus = false,
  placeholder = "Search deals, stores or brands",
  size = "md",
  className,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);
  const [items, setItems] = React.useState<Suggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = "search-suggestions";

  // Debounced, abortable lookup. Every keystroke firing a request would both waste the
  // shared Railway database and let a slow early response overwrite a newer one.
  React.useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { data?: Suggestion[] };
        setItems((json.data ?? []).slice(0, 6));
        setActive(-1);
        setOpen(true);
      } catch {
        // A failed suggestion lookup must never block the real search; the form
        // submission still works.
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const showList = open && items.length > 0;

  /**
   * "See all results" is the last option in the listbox, not a button inside it.
   *
   * It used to be a `<button>` in an `<li role="presentation">`. A `listbox` may only
   * contain `option` (or `group`) children, and an element marked presentational cannot
   * legally hold focusable content — so this was both invalid and, in practice,
   * unreachable: the only way to reach it by keyboard is Tab, and Tab blurs the input,
   * which closes the popup before the button can be activated. As an option it is
   * reachable with the same Down/Up/Enter the suggestions already use.
   */
  const seeAllIndex = items.length;
  const optionCount = items.length + 1;

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/deal/${slug}`);
  };

  const goToSearch = () => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  const activate = (index: number) => {
    if (index === seeAllIndex) goToSearch();
    else go(items[index]!.slug);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!showList) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      // Only hijack Enter when an option is highlighted; otherwise the form submits
      // and the user gets the full results page, which is what they asked for.
      e.preventDefault();
      activate(active);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(optionCount - 1);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form action="/search" method="get" role="search" className="flex gap-2">
        <div
          className={cn(
            "flex flex-1 items-center gap-2 rounded-control border border-slate-300 bg-white px-3 transition",
            // The wrapper carries the focus ring because the input itself is
            // borderless — previously the input had `outline-none` and nothing replaced
            // it, so keyboard users had no visible focus at all.
            focusRingWithin,
            size === "lg" ? "min-h-[52px]" : "min-h-[44px]"
          )}
        >
          <Icon name="search" size={18} className="shrink-0 text-ink-500" />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => items.length > 0 && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Search deals"
            autoFocus={autoFocus}
            autoComplete="off"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={showList}
            // Only while the listbox exists: an aria-controls pointing at an absent id is a
            // dangling reference, and some screen readers announce the control as broken.
            aria-controls={showList ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              showList && active >= 0 ? `${listboxId}-${active}` : undefined
            }
            className={cn(
              "w-full min-w-0 bg-transparent py-2 text-ui text-ink-800 outline-none placeholder:text-ink-500",
              size === "lg" && "text-base"
            )}
          />
          {value ? (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setItems([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-pill text-ink-500 transition hover:bg-slate-100 hover:text-ink-700"
            >
              <Icon name="close" size={15} />
            </button>
          ) : null}
        </div>

        <button
          type="submit"
          className={cn(
            "shrink-0 rounded-control bg-brand-700 px-4 font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            size === "lg" ? "min-h-[52px] text-ui" : "min-h-[44px] text-mini"
          )}
        >
          Search
        </button>
      </form>

      {/* Politely announced so screen-reader users know suggestions arrived without
          having to guess; visually hidden because the list itself is visible. */}
      <span className="sr-only" aria-live="polite">
        {loading
          ? "Searching"
          : showList
            ? `${items.length} suggestion${items.length === 1 ? "" : "s"} available`
            : ""}
      </span>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-dropdown mt-1.5 overflow-hidden rounded-card border border-slate-200 bg-white py-1 shadow-overlay"
        >
          {items.map((item, i) => (
            <li
              key={item.slug}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                // Fire before the input's blur so the navigation is not cancelled.
                e.preventDefault();
                activate(i);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-left",
                i === active ? "bg-brand-50" : "bg-white"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-mini font-semibold text-ink-800">
                  {item.title}
                </span>
                <span className="block truncate text-micro text-ink-500">
                  {item.merchantName}
                </span>
              </span>
              {item.discountPercent > 0 ? (
                <span className="shrink-0 rounded-pill bg-accent-700 px-2 py-0.5 text-micro font-bold text-white">
                  -{item.discountPercent}%
                </span>
              ) : null}
            </li>
          ))}
          <li
            id={`${listboxId}-${seeAllIndex}`}
            role="option"
            aria-selected={active === seeAllIndex}
            onMouseEnter={() => setActive(seeAllIndex)}
            onMouseDown={(e) => {
              e.preventDefault();
              activate(seeAllIndex);
            }}
            className={cn(
              "flex min-h-[44px] cursor-pointer items-center border-t border-slate-100 px-3 py-2 text-micro font-bold uppercase tracking-widest text-brand-700",
              active === seeAllIndex ? "bg-brand-50" : "bg-white"
            )}
          >
            See all results for “{value.trim()}”
          </li>
        </ul>
      ) : null}
    </div>
  );
}
