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
  const availableFunctionsInContract =
    smartContractFunctionConfig.smart_contract_functions.map((x) => x.name);

  const invalidMoveCall = !availableFunctionsInContract.includes(queueObject.smart_contract_function_name);
  if (invalidMoveCall) {
    throw new Error(`Function ${queueObject.smart_contract_arguments} not present in the smart contract. Available functions: ${availableFunctionsInContract}`);
  }

  const functionArgumentsTypes = smartContractFunctionConfig
    .smart_contract_functions
    .filter(f => f.name == queueObject.smart_contract_function_name)
    .map(f => f.types_of_arguments)

  let nft;
  if (functionArgumentsTypes.length == 0) {
    nft = tx.moveCall({
      target: `${envVariables.PACKAGE_ADDRESS!}::contract_example::${queueObject.smart_contract_function_name}`,
    });
  } else {
    nft = tx.moveCall({
      target: `${envVariables.PACKAGE_ADDRESS!}::contract_example::${queueObject.smart_contract_function_name}`,
      arguments: queueObject.smart_contract_arguments.map(
        (argument, i) => {
          switch (functionArgumentsTypes[0][i]) {
            case "object": {
              return tx.object(argument);
            }
            default: {
              return tx.pure(argument as any);
            }
          }
        }
      ),
    });
  }

  // TODO - remove this line or move it to the contract code
  tx.transferObjects([nft], tx.pure.address("0xe40c8cf8b53822829b3a6dc9aea84b62653f60b771e9da4bd4e214cae851b87b"));

  return tx;
};
