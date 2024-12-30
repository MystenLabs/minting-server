import {
  isSmartContractQueueObject,
  QueueObject,
} from "../../request_handler/queue";
import { Transaction } from "@mysten/sui/transactions";
import {
  SmartContractExecutionContext,
  PTBExecutionContext,
  ExecutionContext,
} from "./executionContexts.ts";

/*
Aggregate all the move calls included in the queue objects into a single transaction.
*/
export async function aggregateMoveCallsIntoATransaction(
  queueObjects: QueueObject[],
) {
  const tx = new Transaction();
  for (const queueObject of queueObjects) {
    let execContext: ExecutionContext;
    if (isSmartContractQueueObject(queueObject)) {
      execContext = new SmartContractExecutionContext(queueObject);
    } else {
      execContext = new PTBExecutionContext(queueObject);
    }
    await execContext.prepareCall(tx);
  }

  return tx;
}
