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
Adds a move call based on the received queue object (inside a worker job) to the transaction object.
*/
const addMoveCall = async (queueObject: QueueObject, tx: Transaction) => {
  const availableFunctionsInContract =
    smartContractFunctionConfig.smart_contract_functions.map((x) => x.name);

  const invalidMoveCall = !availableFunctionsInContract.includes(queueObject.smart_contract_function_name);
  if (invalidMoveCall) {
    throw new Error(`Function ${queueObject.smart_contract_function_arguments} not present in the smart contract. Available functions: ${availableFunctionsInContract}`);
  }

  const functionArgumentsTypes = smartContractFunctionConfig
    .smart_contract_functions
    .filter(f => f.name == queueObject.smart_contract_function_name)
    .map(f => f.types_of_arguments)

  let suiObject;
  const noFunctionArgumentsDeclaredinContract = functionArgumentsTypes.length == 0;
  if (noFunctionArgumentsDeclaredinContract) {
    suiObject = tx.moveCall({
      target: `${envVariables.PACKAGE_ADDRESS!}::${envVariables.SMART_CONTRACT_NAME}::${queueObject.smart_contract_function_name}`,
    });
  } else {
    suiObject = tx.moveCall({
      target: `${envVariables.PACKAGE_ADDRESS!}::${envVariables.SMART_CONTRACT_NAME}::${queueObject.smart_contract_function_name}`,

      // Depending on the smart contract configuration, map the arguments to the correct object type.
      arguments: queueObject.smart_contract_function_arguments.map(
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

  // Transfer the sui object to the receiver address if it is present.
  if (suiObject && queueObject.receiver_address) {
    tx.transferObjects([suiObject], tx.pure.address(queueObject.receiver_address));
  }

  return tx;
};
