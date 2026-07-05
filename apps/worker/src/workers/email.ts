import { Worker } from "bullmq";
import type IORedis from "ioredis";
import { QUEUE_NAMES, type EmailJobPayload } from "@mpf/jobs";
import { prisma } from "@mpf/db";
import { sendEmail } from "../providers/email.js";

export function startEmailWorker(connection: IORedis) {
  return new Worker<EmailJobPayload>(
    QUEUE_NAMES.email,
    async (job) => {
      const { type, subscriberId, dealId } = job.data;
      const sub = await prisma.subscriber.findUnique({ where: { id: subscriberId } });
      if (!sub) return { skipped: true };

      const subjects: Record<EmailJobPayload["type"], string> = {
        daily_digest: "Your daily MyPerkFinder deals",
        price_drop: "Price drop on a deal you saved 🎉",
        coupon_expiry: "A coupon you saved is expiring soon ⏳",
      };

      const deal = dealId ? await prisma.deal.findUnique({ where: { id: dealId } }) : null;
      const html = `<h1>${subjects[type]}</h1>${deal ? `<p>${deal.title}</p>` : "<p>Fresh deals inside.</p>"}`;

      const res = await sendEmail({ to: sub.email, subject: subjects[type], html });
      return { sent: true, mocked: res.mocked };
    },
    { connection, concurrency: 5 }
  );
}
