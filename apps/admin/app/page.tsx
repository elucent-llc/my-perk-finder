import { StatCard, StatGrid, Panel, PanelHead, PanelBody, Table, Th, Td, Badge, AlertBanner, STATUS_TONE } from "@mpf/ui";
import { AdminShell } from "@/components/AdminShell";
import { getKpis, getReviewQueue } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const kpis = await getKpis();
  const review = await getReviewQueue();

  return (
    <AdminShell title="Overview">
      <StatGrid className="mb-4">
        <StatCard label="Active offers" value={kpis.activeOffers.toLocaleString()} delta="▲ 4.2%" trend="up" icon="🛒" />
        <StatCard label="Needs review" value={kpis.needsReview.toLocaleString()} delta="▲ 37 today" trend="down" icon="⚑" />
        <StatCard label="Expired today" value={kpis.expiredToday.toLocaleString()} delta="auto-archived" icon="⏳" />
        <StatCard label="Imports today" value={kpis.importsToday.toLocaleString()} delta="11 ok · 1 partial" trend="up" icon="⟳" />
        <StatCard label="Clicks today" value={kpis.clicksToday.toLocaleString()} delta="▲ 8.1%" trend="up" icon="👆" />
        <StatCard label="Subscribers" value={kpis.emailSubscribers.toLocaleString()} delta="▲ 260" trend="up" icon="✉" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel>
          <PanelHead title="Offers needing review" />
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
              {review.map((d) => (
                <tr key={d.id}>
                  <Td className="font-medium text-slate-800">{d.title}</Td>
                  <Td>{d.merchantName}</Td>
                  <Td>
                    <Badge tone="review">{Math.round((d.confidenceScore ?? 0) * 100)}%</Badge>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHead title="Validation warnings" />
            <PanelBody className="flex flex-col gap-2">
              <AlertBanner tone="danger">12 offers: sale price &gt; regular price</AlertBanner>
              <AlertBanner tone="warning">8 offers: missing affiliate URL</AlertBanner>
              <AlertBanner tone="warning">31 offers: low confidence score</AlertBanner>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
