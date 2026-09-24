"use client";

import * as React from "react";
import { cn, focusRing } from "./cn.js";
import { Icon } from "./Icon.js";

/**
 * Reveal-then-copy coupon code.
 *
 * Replaces two near-duplicate implementations (CouponReveal in the web app and
 * an inline version inside CouponCard) that both revealed the code in place and
 * then left a dead button behind — the user had to hand-select monospace text,
 * got no confirmation, and the merchant tab never opened. This follows the
 * standard pattern: first press reveals and copies, subsequent presses re-copy,
 * and the result is announced.
 *
 * `shopHref` is optional; when given, revealing also opens the merchant in a
 * new tab, which is what people expect from a coupon site.
 */
export function CouponCode({
  code,
  shopHref,
  className,
}: {
  code: string;
  shopHref?: string;
  className?: string;
}) {
  const [revealed, setRevealed] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "copied" | "failed">("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const announce = (next: "copied" | "failed") => {
    setStatus(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  };

  const handleClick = async () => {
    const firstReveal = !revealed;
    setRevealed(true);

    try {
      await navigator.clipboard.writeText(code);
      announce("copied");
    } catch {
      // Clipboard needs permission/secure context. The code is visible now,
      // so tell the user to copy it rather than failing silently.
      announce("failed");
    }

    if (firstReveal && shopHref) {
      window.open(shopHref, "_blank", "noopener,noreferrer");
    }
  };

  const label = !revealed
    ? "Reveal and copy code"
    : status === "copied"
      ? "Copied"
      : status === "failed"
        ? "Copy manually"
        : "Copy code again";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={revealed ? `Copy coupon code ${code}` : "Reveal and copy coupon code"}
        className={cn(
          "relative flex min-h-[48px] w-full items-center justify-center gap-2 overflow-hidden rounded-control border-[1.5px] border-dashed border-brand-300 bg-brand-50 px-3 text-center font-mono text-base font-bold tracking-widest text-brand-800 transition hover:bg-brand-100",
          focusRing
        )}
      >
        <span className={revealed ? undefined : "invisible"}>{code}</span>
        {!revealed ? (
          <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-brand-700 font-sans text-sm tracking-normal text-white">
            <Icon name="coupon" size={15} />
            Reveal code
          </span>
        ) : null}
      </button>

      <p
        aria-live="polite"
        className={cn(
          "mt-1.5 text-center text-micro font-semibold",
          status === "failed" ? "text-danger-700" : "text-savings-800"
        )}
      >
        {status === "copied"
          ? "Code copied to clipboard"
          : status === "failed"
            ? "Couldn’t copy automatically — select the code above"
            : revealed
              ? label
              : ""}
      </p>
    </div>
  );
}
