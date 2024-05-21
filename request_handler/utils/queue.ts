import * as redis from 'redis';

export async function connectToQueue() {
  const redisClient = redis.createClient({
    socket: {
      host: 'queue',
      port: 6379
    }
  });

  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();

  return redisClient;
};
