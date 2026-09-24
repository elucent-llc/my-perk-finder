import { StatCard, StatGrid, Panel, PanelHead, PanelBody, Table, Th, Td, Badge, STATUS_TONE } from "@mpf/ui";
import { AdminShell } from "@/components/admin/AdminShell";
import { getKpis, getReviewQueueData } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const kpis = await getKpis();
  const review = await getReviewQueueData(1, 8);

  return (
    <AdminShell title="Overview">
      <StatGrid className="mb-4">
        <StatCard label="Active offers" value={kpis.activeOffers.toLocaleString("en-US")} icon="🛒" />
        <StatCard label="Needs review" value={kpis.needsReview.toLocaleString("en-US")} icon="⚑" />
        <StatCard label="Expired today" value={kpis.expiredToday.toLocaleString("en-US")} icon="⏳" />
        <StatCard label="Imports today" value={kpis.importsToday.toLocaleString("en-US")} icon="⟳" />
        <StatCard label="Total clicks" value={kpis.clicksToday.toLocaleString("en-US")} icon="👆" />
        <StatCard label="Subscribers" value={kpis.emailSubscribers.toLocaleString("en-US")} icon="✉" />
      </StatGrid>

      <Panel>
        <PanelHead title="Offers needing review" headingLevel={2} />
        <Table>
          <thead>
            <tr>
              <Th>Offer</Th>
              <Th>Merchant</Th>
              <Th>Confidence</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {review.data.length === 0 ? (
              <tr>
                <Td colSpan={4} className="text-ink-500">
                  No offers in review queue.
                </Td>
              </tr>
            ) : (
              review.data.map((d) => (
                <tr key={d.id}>
                  <Td className="font-medium text-ink-800">{d.title}</Td>
                  <Td>{d.merchantName}</Td>
                  <Td>
                    <Badge tone="review">{Math.round((d.confidenceScore ?? 0) * 100)}%</Badge>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status}</Badge>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Panel>

      <Panel className="mt-4">
        <PanelHead title="Deployment note" headingLevel={2} />
        <PanelBody className="text-sm text-ink-600">
          Affiliate imports run on a Railway cron schedule (<code>myperkfinder-worker-awin-import</code>).
          Expired offers are archived daily by <code>myperkfinder-worker-expire-offers</code>.
        </PanelBody>
      </Panel>
    </AdminShell>
  );
}
