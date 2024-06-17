import { QueueObject, enqueRequest } from "./queue";
import express from "express";

const maxBatchSize = parseInt(process.env.BUFFER_SIZE ?? "10");
const staleBufferTimeout = parseInt(
  process.env.STALE_BUFFER_TIMEOUT_MS ?? "10000",
);
let staleBufferIntervalRunning = false;
let batchBuffer = new Array<QueueObject>();

/*
Enqueues a batch of requests to the batch buffer.
The batch buffer is a queue of requests that will be sent to the queue service when
the buffer is full or when the buffer has been idle for a certain amount of time.
*/
export async function enqueueToBatchBuffer(req: express.Request) {
  const bufferIsFull = batchBuffer.length >= maxBatchSize;
  if (bufferIsFull) {
    console.log(
      `Buffer is full (${batchBuffer.length}/${maxBatchSize}), sending batch to queue...`,
    );
    await enqueRequest(batchBuffer);
    batchBuffer = []; // Empty the buffer
  } else {
    console.log(
      `Adding request to buffer... ${batchBuffer.length}/${maxBatchSize}`,
    );
    batchBuffer.push({
      smartContractFunctionName: req.body.smartContractFunctionName,
      smartContractFunctionArguments: req.body.smartContractFunctionArguments,
      receiverAddress: req.body.receiverAddress,
    } as QueueObject);
    if (!staleBufferIntervalRunning) {
      staleBufferIntervalRunning = true;
      setTimeout(async () => {
        staleBufferIntervalRunning = false;
        if (batchBuffer.length > 0) {
          console.log(
            `Stale buffer detected (size ${batchBuffer.length}/${maxBatchSize}). Sending batch to queue...`,
          );
          await enqueRequest(batchBuffer);
          batchBuffer = []; // Empty the buffer
        }
      }, staleBufferTimeout);
    }
  }
}
