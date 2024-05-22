import { Queue, Worker } from "bullmq";
import { generatePID } from "./utils/pid";

// TODO: Parse host & port from `.env`
const redisConfig = {
  host: "127.0.0.1", // Redis server address
  port: 6379, // Redis server port
  // username: TODO,
  // password: TODO
};

export type QueueObject = {
  id: String;
  requestorAddress: String;
  type: String;
};

const requestsQueue = new Queue("requests-queue", {
  connection: redisConfig,
});

// Create 5 workers
for (let i = 0; i < 5; i++) {
  /*
  When a worker instance is created, it launches the processor immediately
  */
  new Worker(
    "requests-queue",
    async (job) => {
      console.log(`Processing ${job.data.id} - ts: ` + Date.now());
      job.updateProgress(0);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      job.updateProgress(25);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      job.updateProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      job.updateProgress(75);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      job.updateProgress(100);
    },
    {
      connection: redisConfig,
      /*
      # REGARDING CONCURRENCY
      Even when having multiple workers in different machines, choose a high concurrency
      factor for every worker, so that the resources of every machine where the worker
      is running are used more efficiently.
      */
      concurrency: 200, // number of jobs a single worker can do in parallel
    },
  );
}

/// Push a request to the queue in order to place it for consumption.
export async function enqueRequest(queueObject: QueueObject) {
  await requestsQueue.add(
    `job-${generatePID()}`, // job name
    queueObject, // payload
  );
}
