import { Job, Worker } from "bullmq";
import { executeTransaction } from "./moveCalls/executeTransaction";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
};

const socket = new WebSocket(`ws://notifier:3001`);
console.log("Connected to notifier websocket server");
console.log(socket);

const worker = new Worker(
  "requests-queue",
  async (job) => {
    try {
      job.updateProgress(10);
      console.log(
        `Executing transactions in bulk: ${JSON.stringify(job.data)}`,
      );
      const resp = await executeTransaction(job.data);
      job.updateProgress(90);
      if (resp.status === "failure") {
        throw new Error(`Transaction failed: ${resp.status}`);
      }
      job.updateProgress(100);
      return { jobId: job.id, digest: resp.digest };
    } catch (e) {
      console.error(`Error executing bulk of transactions: ${job.data} - `, e);
      throw e;
    }
  },
  {
    name: `worker-${process.env.HOSTNAME ? "container-" + process.env.HOSTNAME : "localhost"}`,
    connection: redisConfig,
    /*
    # REGARDING CONCURRENCY
    Even when having multiple workers in different machines, choose a high concurrency
    factor for every worker, so that the resources of every machine where the worker
    is running are used more efficiently.
    */
    concurrency: process.env.BULLMQ_WORKER_CONCURRENCY
      ? parseInt(process.env.BULLMQ_WORKER_CONCURRENCY)
      : 10,
  },
);

worker.on("completed", async (job: Job) => {
  // Send a message to the notifier server
  socket.send(
    JSON.stringify({
      jobData: job.data,
      returnValue: job.returnvalue,
    }),
  );
});

worker.on("failed", (job?: Job, err?: Error, prev?: string) => {
  if (!job || !err) {
    console.error(`Failed job is undefined or error is undefined`);
    return;
  }

  console.error(`Job failed: ${job.id} with error:`, err);

  socket.send(
    JSON.stringify({
      jobData: job.data,
      error: err.message,
    }),
  );

  // TODO add retry
});

worker.on("error", (err) => {
  // [WARNING] If the error handler is missing, the worker may stop processing jobs when an error is emitted!
  console.error("Worker error:", err);
});
