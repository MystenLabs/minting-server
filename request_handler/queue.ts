import { Queue } from "bullmq";
import { generatePID } from "./utils/pid";

const redisConfig = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
};

export type QueueObject = {
  smart_contract_function_name: string;
  smart_contract_arguments: string[];
};

export const requestsQueue = new Queue("requests-queue", {
  connection: redisConfig,
});

/// Push a request to the queue in order to place it for consumption.
export async function enqueRequest(queueObjects: Array<QueueObject>) {
  await requestsQueue.add(
    `job-${generatePID()}`, // job name
    queueObjects, // payload
    {
      attempts: Number(process.env.JOB_RETRIES ?? 3),
      backoff: {
        type: "exponential",
        delay: Number(process.env.JOB_BACKOFF_DELAY ?? 1000),
      },
    }
  );
}
