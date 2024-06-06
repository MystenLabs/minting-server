import { Job, Worker } from "bullmq";

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
    job.updateProgress(0);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    job.updateProgress(25);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    job.updateProgress(50);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    job.updateProgress(75);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    job.updateProgress(100);

    // TODO Add the result of the sui transaction here.
    return {jobId: job.id, result: "OK"}
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

worker.on('completed', async (job: Job) => {
  // Send a message to the notifier server
  socket.send(`COMPLETED: ${JSON.stringify(job.returnvalue)}`);
})

worker.on('progress', async (job: Job) => {
  // Called whenever a job is moved to failed by any worker.
  socket.send(`PROGRESS: job ${job.id} - ${ job.progress }%`)
});

worker.on('error', err => {
  // [WARNING] If the error handler is missing, the worker may stop processing jobs when an error is emitted!
  console.error(err);
});
