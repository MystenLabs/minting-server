import express from "express";
import { connectToQueue } from "./utils/queue";

const app = express();
const port = 3000;

app.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const redisClient = await connectToQueue();
    await redisClient.set('request-handler', 'rh-value');

    const value = await redisClient.get('request-handler');
    await redisClient.quit(); // Properly close the client after operation

    res.status(202).send(`Added entry to redis: ${value}`);
  } catch (error) {
    console.error('Error to interact with queuing service:', error);
    res.status(500).send('Failed to interact with queuing service.');
  }
});

app.listen(port, () => {
  console.log(`RequestHandler running on port ${port}...`);
});
