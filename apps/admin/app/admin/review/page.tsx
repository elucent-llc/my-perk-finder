import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminReviewAlias({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = sp.page ? `?page=${sp.page}` : "";
  redirect(`/review${page}`);
}
