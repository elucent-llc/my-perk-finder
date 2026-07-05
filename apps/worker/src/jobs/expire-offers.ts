import { prisma } from "@mpf/db";

/** Mark active offers past expiryDate as expired. */
export async function expireOffers(log: (msg: string) => void): Promise<{ expired: number }> {
  const result = await prisma.deal.updateMany({
    where: {
      status: "active",
      expiryDate: { lt: new Date() },
    },
    data: { status: "expired" },
  });

  log(`Marked ${result.count} offer(s) as expired`);
  return { expired: result.count };
}
