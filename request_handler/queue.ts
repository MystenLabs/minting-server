import Bull from "bull";

export type QueueObject = {
  id: String;
  requestorAddress: String;
  type: String;
};

// TODO: Parse host & port from `.env`
const redisConfig = {
  host: "127.0.0.1", // Redis server address
  port: 6379, // Redis server port
  // username: TODO,
  // password: TODO
};

const requestsQueue = new Bull("requests-queue", {
  redis: redisConfig,
  // Rate limiting to X requests (max) per Y seconds (duration).
  limiter: {
    max: 1000, // TODO: move to .env
    duration: 5000, // TODO: move to .env
  },
});

// Requests are automatically dequeued.
// Here is defined how each request should be processed.
requestsQueue.process(async (job, done) => {
  console.log("Inside job process");
  job.progress(0);
  await new Promise((resolve) => setTimeout(resolve, 4000));
  job.progress(100);
  done();
});

/// Push a request to the queue in order to place it for consumption.
export async function enqueRequest(queueObject: QueueObject) {
  await requestsQueue.add(queueObject);
}
