import { Worker } from "bullmq";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  // TODO username: process.env.REDIS_USER,
  // TODO password: process.env.REDIS_PASSWORD,
};

new Worker(
  "requests-queue",
  // Example job processing - this is the place where we will do the minting
  async (job) => {
    // TODO: add move calls here
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
    name: `worker-${process.env.HOSTNAME ? "container-" + process.env.HOSTNAME : "localhost"}`,
    connection: redisConfig,
    /*
    # REGARDING CONCURRENCY
    Even when having multiple workers in different machines, choose a high concurrency
    factor for every worker, so that the resources of every machine where the worker
    is running are used more efficiently.
    */
    concurrency: 1,
  },
);
