"use client";

import * as React from "react";
import { cn, focusRing } from "./cn.js";

const STORAGE_KEY = "mpf.saved-deals";

function readSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    // Private-mode / quota / malformed JSON — favourites are non-essential.
    return [];
  }
}

function writeSaved(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("mpf:saved-deals-changed"));
  } catch {
    /* ignore */
  }
}

/** Read the saved-deal ids. Exported so a /saved page can reuse the same store. */
export function getSavedDealIds(): string[] {
  return readSaved();
}

/**
 * Save/unsave a deal.
 *
 * DealCard has always rendered a heart wired to an `onSave` prop, but no call
 * site ever passed one, so the control never appeared and `savesCount` had no
 * way to move. This makes it work without requiring accounts: ids live in
 * localStorage, read after mount so server and client markup agree.
 */
export function SaveDealButton({
  dealId,
  title,
  className,
}: {
  dealId: string;
  title: string;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setSaved(readSaved().includes(dealId));
    sync();
    setReady(true);
    // Keep every card in sync when one of them toggles.
    window.addEventListener("mpf:saved-deals-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mpf:saved-deals-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [dealId]);

  const toggle = () => {
    const current = readSaved();
    const next = current.includes(dealId)
      ? current.filter((id) => id !== dealId)
      : [...current, dealId];
    writeSaved(next);
    setSaved(next.includes(dealId));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={ready ? saved : undefined}
      // Names the specific deal rather than a generic "Save deal", which is
      // ambiguous when 24 identical buttons are on one page.
      aria-label={saved ? `Remove ${title} from saved deals` : `Save ${title} for later`}
      // z-10 keeps it above DealCard's stretched card link.
      className={cn(
        "relative z-10 grid h-11 w-11 place-items-center rounded-pill border bg-white/95 transition",
        saved
          ? "border-danger-100 text-danger-600"
          : "border-slate-200 text-ink-500 hover:border-danger-100 hover:text-danger-600",
        focusRing,
        className
      )}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path
          d="M12 20s-7-4.5-7-9.5A4 4 0 0112 8a4 4 0 017 2.5C19 15.5 12 20 12 20z"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only" aria-live="polite">
        {ready && saved ? "Saved" : ""}
      </span>
    </button>
  );
}
