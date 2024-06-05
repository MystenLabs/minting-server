import express from "express";
import { enqueRequest, requestsQueue } from "./queue";
import { generatePID } from "./utils/pid";
import { body, validationResult } from "express-validator";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

export const app = express();

// Connect BullMQ UI board to monitor the jobs in a nice UI
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");
createBullBoard({
  queues: [new BullMQAdapter(requestsQueue)],
  serverAdapter: serverAdapter,
});
app.use("/", serverAdapter.getRouter());

// Set up the express endpoints
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
      await enqueRequest({
        id: generatePID(),
        requestorAddress: req.body.address,
        type: req.body.type,
      });
      return res.status(202).send(`Accepted: Request was successfully queued.`);
    } catch (error) {
      return res.status(500).send("Failed to interact with queuing service.");
    }
  },
);

app.get("/healthcheck", async (_: express.Request, res: express.Response) => {
  try {
    return res.status(200).send("OK.");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error!");
  }
});