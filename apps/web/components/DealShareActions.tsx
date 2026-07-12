"use client";

import { useState } from "react";
import { Button } from "@mpf/ui";

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

  return (
    <div className="mt-3 flex gap-2.5">
      <Button variant="outline" className="flex-1" type="button" onClick={share}>
        {copied ? "Link copied" : "↗ Share"}
      </Button>
      <a
        href={`mailto:?subject=${encodeURIComponent(`Deal: ${title}`)}&body=${encodeURIComponent(url)}`}
        className="flex-1"
      >
        <Button variant="outline" className="w-full" type="button">
          ✉ Report / email
        </Button>
      </a>
    </div>
  );
}
