"use client";
import { useState } from "react";

export function CouponReveal({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="relative w-full overflow-hidden rounded-lg border-[1.5px] border-dashed border-brand-300 bg-brand-50 p-2.5 text-center font-mono font-bold tracking-widest text-brand-700"
    >
      {revealed ? code : "•••••••"}
      {!revealed ? (
        <span className="absolute inset-0 grid place-items-center bg-brand-600 font-sans tracking-normal text-white">
          Reveal Code →
        </span>
      ) : null}
    </button>
  );
}
