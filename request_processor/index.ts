import { Job, Worker } from "bullmq";
import { executeTransaction } from "./moveCalls/executeTransaction";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  // TODO username: process.env.REDIS_USER,
  // TODO password: process.env.REDIS_PASSWORD,
};

const socket = new WebSocket(`ws://notifier:3001`);
console.log('Connected to notifier websocket server');
console.log(socket)

const worker = new Worker(
  "requests-queue",
  // Example job processing - this is the place where we will do the minting
  async (job) => {
    // TODO: add move calls here
    console.log(`Processing ${job.data.id} - ts: ` + Date.now());

    if (job.data.type === 'mint') {
      try {
        job.updateProgress(10)
        const resp = await executeTransaction([job.data.requestorAddress]);
        job.updateProgress(90)
        if (resp.status === 'failure') {
          throw new Error(`Transaction failed: ${resp.status}`);
        }
        job.updateProgress(100);
        return { jobId: job.id, result: resp.status, digest: resp.digest };
      } catch (e) {
        console.error(`Error executing transaction for job ${job.data.id}:`, e);
        throw e;
      }
    } else {
      return { jobId: job.id, result: "Transaction failed: No such transaction type." };
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
    concurrency: 10,
  },
);

worker.on('completed', async (job: Job) => {
  // Send a message to the notifier server
  socket.send(JSON.stringify(
    {
      jobData: job.data,
      returnValue: job.returnvalue
    }
  ));
})

worker.on('failed', (job?: Job, err?: Error, prev?: string) => {
  if (!job || !err) {
    console.error(`Failed job is undefined or error is undefined`);
    return;
  }

  console.error(`Job failed: ${job.id} with error:`, err);

  socket.send(JSON.stringify({
    jobData: job.data,
    error: err.message,
  }));

  // TODO add retry
});


worker.on('error', err => {
  // [WARNING] If the error handler is missing, the worker may stop processing jobs when an error is emitted!
  console.error("Worker error:", err);
});
