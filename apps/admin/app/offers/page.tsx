import { Panel, Table, Th, Td, Badge, Chip, Button, formatPrice, STATUS_TONE } from "@mpf/ui";
import { AdminShell } from "@/components/AdminShell";
import { getOffers } from "@/lib/adminData";

export const dynamic = "force-dynamic";

const STATUSES = ["All", "Draft", "Active", "Needs Review", "Expired", "Rejected", "Archived"];

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <AdminShell title="Offers">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s, i) => (
          <Chip key={s} active={i === 0}>
            {s}
          </Chip>
        ))}
      </div>
      <Panel>
        <Table>
          <thead>
            <tr>
              <Th>Offer</Th>
              <Th>Merchant</Th>
              <Th>Category</Th>
              <Th>Sale</Th>
              <Th>Reg</Th>
              <Th>Disc</Th>
              <Th>Status</Th>
              <Th>Conf.</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {offers.map((d) => (
              <tr key={d.id}>
                <Td className="font-medium text-slate-800">{d.title}</Td>
                <Td>{d.merchantName}</Td>
                <Td>{d.category}</Td>
                <Td>{formatPrice(d.salePrice)}</Td>
                <Td className="text-slate-400">{formatPrice(d.regularPrice)}</Td>
                <Td>{d.discountPercent}%</Td>
                <Td>
                  <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status}</Badge>
                </Td>
                <Td>{d.confidenceScore ? `${Math.round(d.confidenceScore * 100)}%` : "—"}</Td>
                <Td>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </AdminShell>
  );
}
