import { QueueObject } from "../../request_handler/queue";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { PTBExecutionContext } from "./executionContexts.ts";

/*
Aggregate all the move calls included in the queue objects into a single transaction.
*/
export async function aggregateMoveCallsIntoATransaction(
  queueObjects: QueueObject[],
) {
  // For every batch we create a new transaction and a new array of transaction results.
  // Multiple PTBs (queue objects) can be aggregated into a single transaction so its desirable that they
  // share the same transaction and transaction results.
  const tx = new Transaction();
  const transactionResults = new Array<TransactionResult>();
  for (const queueObject of queueObjects) {
    const execContext: PTBExecutionContext = new PTBExecutionContext(
      queueObject,
      transactionResults,
    );
    await execContext.prepareCall(tx);
  }
  return tx;
}
