"use client";

import { useState } from "react";
import { Button } from "@mpf/ui";

async function patchOffer(id: string, status: string) {
  const res = await fetch(`/api/admin/offers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update offer (${res.status})`);
}

export function ReviewActions({ offerId }: { offerId: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  const act = async (status: string, label: string) => {
    setLoading(label);
    try {
      await patchOffer(offerId, status);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(`Could not ${label.toLowerCase()} offer.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="success" size="sm" disabled={!!loading} onClick={() => act("active", "Approve")}>
        {loading === "Approve" ? "…" : "✓ Approve"}
      </Button>
      <Button variant="outline" size="sm" disabled={!!loading} onClick={() => act("expired", "Mark expired")}>
        {loading === "Mark expired" ? "…" : "Mark expired"}
      </Button>
      <Button variant="danger" size="sm" disabled={!!loading} onClick={() => act("rejected", "Reject")}>
        {loading === "Reject" ? "…" : "Reject"}
      </Button>
    </div>
  );
}
