import * as React from "react";
import { cn } from "./cn.js";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, delta, trend = "neutral", icon }: StatCardProps) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card-sm">
      {icon ? (
        <div className="float-right grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </div>
      ) : null}
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1.5 text-2xl font-extrabold text-slate-900">{value}</div>
      {delta ? (
        <div
          className={cn(
            "mt-0.5 text-xs font-bold",
            trend === "up" && "text-savings-600",
            trend === "down" && "text-danger-600",
            trend === "neutral" && "text-slate-500"
          )}
        >
          {delta}
        </div>
      ) : null}
    </div>
  );
}

export function StatGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5", className)}
      {...props}
    />
  );
}
