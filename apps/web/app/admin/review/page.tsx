import { Panel, Table, Th, Td, Badge, formatPrice } from "@mpf/ui";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { getReviewQueueData } from "@/lib/adminData";
import { VALIDATION_FLAG_LABELS, type ValidationFlag } from "@mpf/types";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const queue = await getReviewQueueData();

  return (
    <AdminShell title="Review Queue">
      <p className="mb-4 text-sm text-slate-500">{queue.length} offers need review</p>
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
            {queue.map((d) => (
              <tr key={d.id}>
                <Td>
                  <Badge tone="review">{Math.round((d.confidenceScore ?? 0) * 100)}%</Badge>
                </Td>
                <Td className="font-medium text-slate-800">{d.title}</Td>
                <Td>{d.merchantName}</Td>
                <Td>{formatPrice(d.salePrice ?? 0)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {(d.validationFlags ?? []).map((f) => (
                      <Badge key={f} tone="urgent">
                        {VALIDATION_FLAG_LABELS[f as ValidationFlag] ?? f}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td>
                  <ReviewActions offerId={d.id} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </AdminShell>
  );
}
