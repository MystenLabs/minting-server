import express, { Request, Response } from "express";
import { requestsQueue } from "./queue";
import { body, check, validationResult } from "express-validator";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { enqueueToBatchBuffer } from "./buffer";

export const app = express();

// Connect BullMQ UI board to monitor the jobs in a nice UI
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");
createBullBoard({
  queues: [new BullMQAdapter(requestsQueue)],
  serverAdapter: serverAdapter,
});
app.use("/", serverAdapter.getRouter());
app.use(express.json());
app.post(
  "/",
  check("commands").isArray(),
  check("commands.*.target").isString().notEmpty(),
  check("commands.*.arguments").isArray(),
  check("commands.*.typeArguments").optional().isArray(),
  async (req: Request, res: Response) => {
    // First check if there have been any errors on validation.
    const timestamp = Math.floor(new Date().getTime());
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    // Proceed to push the request to the queue.
    try {
      await enqueueToBatchBuffer(req, timestamp);
      res.status(202).send(`Accepted: Request was successfully queued.`);
    } catch (error) {
      res.status(500).send("Failed to interact with queuing service.");
    }
  },
);

app.get("/healthcheck", async (_: Request, res: Response) => {
  try {
    res.status(200).send("OK.");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error!");
  }
});
