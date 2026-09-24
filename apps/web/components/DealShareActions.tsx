"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink, Icon } from "@mpf/ui";

const SUPPORT_EMAIL = "services@elucent.co";

/**
 * Share / report pair under the deal CTA.
 *
 * Two fixes beyond styling: the "Link copied" confirmation was a silent label swap with
 * no live region, so screen-reader users got no feedback at all, and the report action
 * was a `<Button>` nested inside an `<a>` — invalid HTML with two competing roles. The
 * copy timeout also leaked if the component unmounted mid-flight.
 */
export function DealShareActions({ title, url }: { title: string; url: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (next: "copied" | "manual") => {
    setStatus(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  };

  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url, text: title });
        return;
      }
    } catch {
      // The user dismissed the share sheet, or it is unavailable — fall through to copy.
    }
    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
    } catch {
      flash("manual");
      window.prompt("Copy this deal link:", url);
    }
  }

  const reportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Report deal: ${title}`
  )}&body=${encodeURIComponent(
    `I'd like to report a problem with this deal:\n\n${url}\n\nDetails:\n`
  )}`;

  return (
    <div className="mt-3">
      <div className="flex gap-2.5">
        <Button variant="outline" className="flex-1" onClick={share}>
          <Icon name="share" size={15} />
          Share
        </Button>
        <ButtonLink href={reportHref} variant="outline" className="flex-1">
          <Icon name="mail" size={15} />
          Report deal
        </ButtonLink>
      </div>
      <p aria-live="polite" className="mt-1.5 text-center text-micro font-semibold text-savings-800">
        {status === "copied"
          ? "Link copied to clipboard"
          : status === "manual"
            ? "Copy the link from the prompt"
            : ""}
      </p>
    </div>
  );
}
