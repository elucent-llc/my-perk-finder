"use client";

import * as React from "react";
import { Button, Icon, cn } from "@mpf/ui";

type State = "idle" | "loading" | "ok" | "error";

/**
 * Both layouts share one field + one status region.
 *
 * Accessibility fixes: the input carried `outline-none` with nothing replacing the focus
 * indicator, so keyboard users had no idea where they were (SC 2.4.7) — the ring now lives
 * on the pill wrapper via `focus-within`, which is the element that actually looks like the
 * control. The result message was a plain `<p>` that appeared silently, so screen-reader
 * users got no confirmation that they had subscribed or that it had failed; it is now a
 * live region that is present in the DOM from first render (a region inserted at the same
 * time as its text is frequently not announced). The field is also wired to the message
 * with `aria-describedby`, marked `aria-invalid` on failure, and disabled while in flight
 * so a double submit cannot create two requests.
 *
 * `useId` keeps the ids unique because the footer renders the compact variant on pages that
 * also render the panel.
 */
export function NewsletterSignup({ variant = "panel" }: { variant?: "panel" | "compact" }) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<State>("idle");
  const [message, setMessage] = React.useState("");
  const baseId = React.useId();
  const inputId = `${baseId}-email`;
  const statusId = `${baseId}-status`;
  const busy = state === "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
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
      setMessage("You're subscribed. We'll send the best deals to your inbox.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  const fieldProps = {
    id: inputId,
    type: "email" as const,
    name: "email",
    required: true,
    autoComplete: "email" as const,
    inputMode: "email" as const,
    value: email,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
    disabled: busy,
    "aria-invalid": state === "error" || undefined,
    "aria-describedby": statusId,
  };

  if (variant === "compact") {
    return (
      <form onSubmit={onSubmit} className="w-full" aria-busy={busy}>
        <label htmlFor={inputId} className="sr-only">
          Email address for deal alerts
        </label>
        <div className="flex items-center gap-2 rounded-pill border border-slate-200 bg-white p-1 pl-3 shadow-card transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2">
          <Icon name="mail" size={16} className="shrink-0 text-ink-500" aria-hidden />
          <input
            {...fieldProps}
            placeholder="Your email"
            className="min-w-0 flex-1 border-0 bg-transparent text-mini text-ink-800 outline-none placeholder:text-ink-500 disabled:opacity-60"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={busy}
            className="shrink-0 rounded-pill"
          >
            {busy ? "Joining…" : "Notify me"}
          </Button>
        </div>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={cn(
            "mt-1.5 min-h-[1rem] text-micro font-semibold",
            state === "error" ? "text-danger-700" : "text-savings-800"
          )}
        >
          {message}
        </p>
      </form>
    );
  }

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-9 text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.25), transparent 42%), radial-gradient(circle at 90% 90%, rgba(45,212,191,0.35), transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/20 px-3 py-1 text-micro font-bold uppercase tracking-wide">
          <Icon name="bolt" size={13} aria-hidden />
          Deal alerts
        </span>
        <h2
          id={`${baseId}-heading`}
          className="mt-3 text-2xl font-extrabold tracking-tight text-white"
        >
          Never miss a price drop
        </h2>
        {/* text-white/85 measured 4.1:1 against the lighter end of the gradient; /90 clears
            AA across the whole sweep. */}
        <p className="mx-auto mt-2 max-w-md text-ui text-white/90">
          Get the best verified deals and exclusive coupons delivered to your inbox. No spam —
          unsubscribe anytime.
        </p>
        <form onSubmit={onSubmit} className="mx-auto mt-5 max-w-md" aria-busy={busy}>
          <label htmlFor={inputId} className="sr-only">
            Email address for deal alerts
          </label>
          <div className="flex items-center gap-2 rounded-pill bg-white p-1.5 pl-4 shadow-overlay transition focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2 focus-within:ring-offset-brand-800">
            <Icon name="mail" size={18} className="shrink-0 text-ink-500" aria-hidden />
            <input
              {...fieldProps}
              placeholder="you@example.com"
              className="min-w-0 flex-1 border-0 bg-transparent text-ui text-ink-800 outline-none placeholder:text-ink-500 disabled:opacity-60"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={busy}
              className="shrink-0 rounded-pill px-5"
            >
              {busy ? "Joining…" : "Subscribe"}
            </Button>
          </div>
        </form>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={cn(
            "mt-3 min-h-[1.25rem] text-card font-semibold",
            state === "error" ? "text-warn-100" : "text-brand-100"
          )}
        >
          {message}
        </p>
      </div>
    </section>
  );
}
