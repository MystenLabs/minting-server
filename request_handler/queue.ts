import * as redis from "redis";

export type QueueObject = {
  id: String;
  requestorAddress: String;
  // type: TBD
};

/// Establishes a connection with the queue and returns a client
/// that is able to make reads and writes to it.
export async function connectToQueue() {
  const redisClient = redis.createClient({
    socket: {
      host: "localhost",
      port: 6379,
    },
  });

  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  await redisClient.connect();

  return redisClient;
}

/// Push a request to the queue in order to place it for consumption.
export async function pushRequestToQueue(
  queueObject: QueueObject,
  queueClient: any,
) {
  await queueClient.LPUSH("requests-queue", JSON.stringify(queueObject));
}

/// Deque a request.
export async function popRequestFromQueue(queueClient: redis.RedisClientType) {
  await queueClient.RPOP("requests-queue");
}
