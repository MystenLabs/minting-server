import express from "express";
import { connectToQueue, pushRequestToQueue } from "./queue";
import { generatePID } from "./utils/pid";
import { body, validationResult } from "express-validator";

const app = express();
const port = 3000;
app.use(express.json());

app.post(
  "/",
  body("address").trim().notEmpty(),
  body("type").trim().notEmpty(), // TODO: define the valid types and add check using custom validation rule.
  async (req: express.Request, res: express.Response) => {
    // First check if there have been any errors on validation.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed to push the request to the queue.
    try {
      const queueClient = await connectToQueue();
      await pushRequestToQueue(
        {
          id: generatePID(),
          requestorAddress: req.body.address,
          type: req.body.type,
        },
        queueClient,
      );
      await queueClient.quit(); // Properly close the client after operation
      res.status(202).send(`Accepted: Request was successfully queued.`);
    } catch (error) {
      res.status(500).send("Failed to interact with queuing service.");
    }
  },
);

app.listen(port, () => {
  console.log(`RequestHandler running on port ${port}...`);
});
