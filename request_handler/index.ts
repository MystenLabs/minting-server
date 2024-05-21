import express from "express";
import { connectToQueue } from "./utils/queue";

const app = express();
const port = 3000;

app.post("/", async (req: any, res: any) => {
  try {
    const redisClient = await connectToQueue();
    await redisClient.set('request-handler', 'rh-value');
    const value = await redisClient.get('request-handler');
    await redisClient.quit(); // Properly close the client after operation
    res.send(`Added entry to redis: ${value}`);
  } catch (error) {
    console.error('Error interacting with Redis:', error);
    res.status(500).send('Failed to interact with Redis');
  }
});

app.listen(port, () => {
  console.log(`RequestHandler running on port ${port}...`);
});
