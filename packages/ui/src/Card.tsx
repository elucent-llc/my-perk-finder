import * as React from "react";
import { cn } from "./cn.js";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-slate-200 bg-white shadow-card-sm",
        className
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-slate-200 bg-white shadow-card-sm",
        className
      )}
      {...props}
    />
  );
}

export function PanelHead({
  title,
  action,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 border-b border-slate-200 px-4 py-3.5", className)}>
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
