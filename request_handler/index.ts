import express from "express";
import { connectToQueue, pushRequestToQueue } from "./queue";
import { generatePID } from "./utils/pid";

const app = express();
const port = 3000;
app.use(express.json());
app.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const queueClient = await connectToQueue();
    await pushRequestToQueue(
      {
        id: generatePID(),
        requestorAddress: req.body.address,
      },
      queueClient,
    );
    await queueClient.quit(); // Properly close the client after operation
    res.status(202).send(`Accepted: Request was successfully queued.`);
  } catch (error) {
    res.status(500).send("Failed to interact with queuing service.");
  }
});

app.listen(port, () => {
  console.log(`RequestHandler running on port ${port}...`);
});
