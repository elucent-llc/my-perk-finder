import {
  getAdminOverview,
  getReviewQueue,
  listAdminOffers,
  listImportJobs,
} from "@/lib/server/deals";

export type { SerializedDeal as AdminDeal } from "@/lib/server/serialize";

export async function getKpis() {
  return getAdminOverview();
}

export async function getReviewQueueData() {
  return getReviewQueue();
}

export async function getOffers() {
  return listAdminOffers({});
}

export async function getImports() {
  return listImportJobs();
}
