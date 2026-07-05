import { Queue, type QueueOptions } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";

export const QUEUE_NAMES = {
  import: "mpf:import",
  llm: "mpf:llm-extraction",
  email: "mpf:email",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Shared Redis connection for BullMQ (maxRetriesPerRequest must be null). */
export function createRedisConnection(): IORedis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const opts: RedisOptions = { maxRetriesPerRequest: null };
  return new IORedis(url, opts);
}

// ---- Job payload contracts ----
export interface ImportJobPayload {
  source: string;
  importJobId: string;
  triggeredBy?: string;
}
export interface LlmExtractionPayload {
  rawRecordId: string;
  text: string;
}
export interface EmailJobPayload {
  type: "daily_digest" | "price_drop" | "coupon_expiry";
  subscriberId: string;
  dealId?: string;
}

const baseOptions = (connection: IORedis): QueueOptions => ({
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

/** Factory that builds all queues from a single connection. */
export function createQueues(connection: IORedis = createRedisConnection()) {
  const opts = baseOptions(connection);
  return {
    connection,
    importQueue: new Queue<ImportJobPayload>(QUEUE_NAMES.import, opts),
    llmQueue: new Queue<LlmExtractionPayload>(QUEUE_NAMES.llm, opts),
    emailQueue: new Queue<EmailJobPayload>(QUEUE_NAMES.email, opts),
  };
}

export type Queues = ReturnType<typeof createQueues>;
