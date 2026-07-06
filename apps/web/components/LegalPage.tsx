import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-800">{title}</span>
        </nav>
        <h1 className="mb-6 text-3xl font-extrabold text-slate-900">{title}</h1>
        <div className="prose prose-slate max-w-none space-y-4 text-sm leading-relaxed text-slate-700">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
