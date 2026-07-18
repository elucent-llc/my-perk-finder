"use client";

import * as React from "react";
import { Button, Icon } from "@mpf/ui";

type State = "idle" | "loading" | "ok" | "error";

export function NewsletterSignup({ variant = "panel" }: { variant?: "panel" | "compact" }) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<State>("idle");
  const [message, setMessage] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setState("ok");
      setMessage("You're in! We'll send the best deals to your inbox.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (variant === "compact") {
    return (
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pl-3 shadow-sm focus-within:border-brand-300">
          <Icon name="mail" size={16} className="shrink-0 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            aria-label="Email address"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <Button type="submit" size="sm" variant="primary" className="shrink-0 rounded-full">
            {state === "loading" ? "…" : "Notify me"}
          </Button>
        </div>
        {message ? (
          <p className={`mt-1.5 text-xs ${state === "error" ? "text-danger-600" : "text-savings-700"}`}>
            {message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-9 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.25), transparent 42%), radial-gradient(circle at 90% 90%, rgba(45,212,191,0.35), transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
          <Icon name="bolt" size={13} />
          Deal alerts
        </span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Never miss a price drop</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
          Get the best verified deals and exclusive coupons delivered to your inbox. No spam —
          unsubscribe anytime.
        </p>
        <form onSubmit={onSubmit} className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-lg">
          <Icon name="mail" size={18} className="shrink-0 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
          />
          <Button type="submit" variant="primary" className="shrink-0 rounded-full px-5">
            {state === "loading" ? "Joining…" : "Subscribe"}
          </Button>
        </form>
        {message ? (
          <p className={`mt-3 text-sm font-semibold ${state === "error" ? "text-amber-200" : "text-teal-100"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
