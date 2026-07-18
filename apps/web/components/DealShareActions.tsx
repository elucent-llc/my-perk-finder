"use client";

import { useState } from "react";
import { Button } from "@mpf/ui";

const SUPPORT_EMAIL = "services@elucent.co";

export function DealShareActions({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url, text: title });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this deal link:", url);
    }
  }

  const reportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Report deal: ${title}`
  )}&body=${encodeURIComponent(
    `I'd like to report a problem with this deal:\n\n${url}\n\nDetails:\n`
  )}`;

  return (
    <div className="mt-3 flex gap-2.5">
      <Button variant="outline" className="flex-1" type="button" onClick={share}>
        {copied ? "Link copied" : "Share"}
      </Button>
      <a href={reportHref} className="flex-1">
        <Button variant="outline" className="w-full" type="button">
          Report deal
        </Button>
      </a>
    </div>
  );
}
