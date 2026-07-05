import { Panel, Table, Th, Td, Badge, Button } from "@mpf/ui";
import { AdminShell } from "@/components/AdminShell";
import { getImports } from "@/lib/adminData";

export const dynamic = "force-dynamic";

// Map import statuses to available Badge tones.
const importTone: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  completed: "active",
  running: "verified",
  failed: "expired",
  partial_success: "review",
  pending: "neutral",
};

export default async function ImportsPage() {
  const jobs = await getImports();

  return (
    <AdminShell title="Imports">
      <div className="mb-4 flex justify-end">
        <Button variant="primary" size="sm">⟳ Run import now</Button>
      </div>
      <Panel>
        <Table>
          <thead>
            <tr>
              <Th>Source</Th>
              <Th>Status</Th>
              <Th>Found</Th>
              <Th>Created</Th>
              <Th>Updated</Th>
              <Th>Rejected</Th>
              <Th>Needs review</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <Td className="font-medium text-slate-800">{j.source}</Td>
                <Td>
                  <Badge tone={importTone[j.status] ?? "neutral"}>{j.status}</Badge>
                </Td>
                <Td>{j.offersFound.toLocaleString()}</Td>
                <Td>{j.created.toLocaleString()}</Td>
                <Td>{j.updated.toLocaleString()}</Td>
                <Td>{j.rejected.toLocaleString()}</Td>
                <Td>{j.needsReview.toLocaleString()}</Td>
                <Td>
                  {j.status === "failed" || j.status === "partial_success" ? (
                    <Button variant="warn" size="sm">Retry</Button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </AdminShell>
  );
}
