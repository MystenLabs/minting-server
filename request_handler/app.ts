import express from "express";
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
  check("smartContractFunctionName").trim().notEmpty(),
  check("smartContractFunctionArguments").isArray(),
  check("receiverAddress").optional().isString(),
  async (req: express.Request, res: express.Response) => {
    // First check if there have been any errors on validation.
    const timestamp = Math.floor(new Date().getTime());
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed to push the request to the queue.
    try {
      await enqueueToBatchBuffer(req, timestamp);
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
