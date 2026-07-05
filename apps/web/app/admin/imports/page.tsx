import { Panel, Table, Th, Td, Badge } from "@mpf/ui";
import { AdminShell } from "@/components/admin/AdminShell";
import { getImports } from "@/lib/adminData";

export const dynamic = "force-dynamic";

const importTone: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  completed: "active",
  running: "verified",
  failed: "expired",
  partial_success: "review",
  pending: "neutral",
};

export default async function AdminImportsPage() {
  const jobs = await getImports();

  return (
    <AdminShell title="Imports">
      <p className="mb-4 text-sm text-slate-500">
        Imports are scheduled via Railway cron (<code>myperkfinder-worker-awin-import</code>, every 6 hours).
        Manual runs: <code>pnpm worker:import-awin</code> locally or trigger the cron service in Railway.
      </p>
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
              <Th>Error</Th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <Td colSpan={8} className="text-slate-500">
                  No import jobs yet.
                </Td>
              </tr>
            ) : (
              jobs.map((j) => (
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
                  <Td className="max-w-xs truncate text-xs text-red-600">{j.error ?? "—"}</Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Panel>
    </AdminShell>
  );
}
