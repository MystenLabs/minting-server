import { Queue } from "bullmq";
import { generatePID } from "./utils/pid";

const redisConfig = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  // TODO username: process.env.REDIS_USER,
  // TODO password: process.env.REDIS_PASSWORD,
};

export type QueueObject = {
  id: String;
  requestorAddress: String;
  type: String;
};

export const requestsQueue = new Queue("requests-queue", {
  connection: redisConfig,
});

/// Push a request to the queue in order to place it for consumption.
export async function enqueRequest(queueObject: QueueObject) {
  await requestsQueue.add(
    `job-${generatePID()}`, // job name
    queueObject, // payload
  );
}
