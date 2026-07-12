import Link from "next/link";
import { Panel, Table, Th, Td, Badge, formatPrice, Button } from "@mpf/ui";
import { AdminShell } from "@/components/AdminShell";
import { ReviewActions } from "@/components/ReviewActions";
import { getReviewQueue } from "@/lib/adminData";
import { VALIDATION_FLAG_LABELS, type ValidationFlag } from "@mpf/types";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const queue = await getReviewQueue(page, 50);

  return (
    <AdminShell title="Review Queue">
      <p className="mb-4 text-sm text-slate-500">
        {queue.total} offers need review · page {queue.page} of {queue.totalPages}
      </p>
      <Panel>
        <Table>
          <thead>
            <tr>
              <Th>Confidence</Th>
              <Th>Offer</Th>
              <Th>Merchant</Th>
              <Th>Sale</Th>
              <Th>Flags</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {queue.data.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-slate-500">
                  No offers in review queue.
                </Td>
              </tr>
            ) : (
              queue.data.map((d) => (
                <tr key={d.id}>
                  <Td>
                    <Badge tone="review">{Math.round((d.confidenceScore ?? 0) * 100)}%</Badge>
                  </Td>
                  <Td className="font-medium text-slate-800">{d.title}</Td>
                  <Td>{d.merchantName}</Td>
                  <Td>{d.salePrice != null && d.salePrice > 0 ? formatPrice(d.salePrice) : "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {(d.validationFlags ?? []).length === 0 ? (
                        <span className="text-xs text-slate-400">none</span>
                      ) : (
                        (d.validationFlags ?? []).map((f) => (
                          <Badge key={f} tone="urgent">
                            {VALIDATION_FLAG_LABELS[f as ValidationFlag] ?? f}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td>
                    <ReviewActions offerId={d.id} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Panel>
      {queue.totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-3">
          {page > 1 ? (
            <Link href={`/review?page=${page - 1}`}>
              <Button variant="outline">Previous</Button>
            </Link>
          ) : null}
          {page < queue.totalPages ? (
            <Link href={`/review?page=${page + 1}`}>
              <Button variant="outline">Next</Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}
