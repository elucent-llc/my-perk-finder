import Link from "next/link";
import { BrandLogo } from "@mpf/ui";

const NAV: Array<[string, string]> = [
  ["Overview", "/admin"],
  ["Offers", "/admin/offers"],
  ["Review Queue", "/admin/review"],
  ["Imports", "/admin/imports"],
  ["← Public site", "/"],
];

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 w-60 overflow-y-auto bg-slate-900 p-3 text-slate-300">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <BrandLogo size={32} withWordmark={false} />
          <div>
            <div className="text-sm font-bold text-white">MyPerkFinder</div>
            <div className="text-[11px] text-slate-500">Admin</div>
          </div>
        </div>
        <nav className="mt-2 flex flex-col gap-0.5">
          {NAV.map(([label, href]) => (
            <Link
              key={label + href}
              href={href}
              className="rounded-lg px-3 py-2 text-[13.5px] hover:bg-white/5 hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="ml-60 flex-1">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-6 py-3.5 backdrop-blur">
          <h1 className="text-lg font-bold">{title}</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
