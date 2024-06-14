import { QueueObject } from "../../request_handler/queue";
import { Transaction } from "@mysten/sui/transactions";
import { envVariables, smartContractFunctionConfig } from "../utils/config.ts";

/*
Aggregate all the move calls included in the queue objects into a single transaction.
*/
export async function aggregateMoveCallsIntoATransaction(
  queueObjects: QueueObject[],
) {
  const tx = new Transaction();
  for (const queueObject of queueObjects) {
    await addMoveCall(queueObject, tx);
  }

  return tx;
}

/*
Adds a move call to the transaction.
*/
const addMoveCall = async (queueObject: QueueObject, tx: Transaction) => {
  const receiver = queueObject.requestorAddress as string;
  const functionsPresentInTheSmartContract =
    smartContractFunctionConfig.smart_contract_functions.map((x) => x.name);
  
  let nft = tx.moveCall({
    target: `${envVariables.PACKAGE_ADDRESS!}::contract_example::mint_nft`,
    arguments: [tx.object(envVariables.ADMIN_CAP!)],
  });

  tx.transferObjects([nft], tx.pure.address(receiver));

  return tx;
};
