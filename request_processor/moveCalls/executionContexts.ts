import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import {
  ExecutionContextValues,
  PTBCommand,
  PTBQueueObject,
  SmartContractQueueObject,
} from "../../request_handler/queue";
import { envVariables, smartContractFunctionConfig } from "../utils/config";
import { checkIfResultIndexIsValid } from "../utils/helpers";

export abstract class ExecutionContext {
  protected context: ExecutionContextValues;

  constructor(context: ExecutionContextValues) {
    this.context = context;
  }

  abstract prepareCall(tx: Transaction): Promise<void>;
}

export class SmartContractExecutionContext extends ExecutionContext {
  protected smartContractFunctionName: string;
  protected smartContractFunctionArguments: string[];
  protected receiverAddress?: string;
  protected timestamp: number;
  constructor(queueObject: SmartContractQueueObject) {
    super("SmartContract");
    this.smartContractFunctionName = queueObject.smartContractFunctionName;
    this.smartContractFunctionArguments =
      queueObject.smartContractFunctionArguments;
    this.receiverAddress = queueObject.receiverAddress;
    this.timestamp = queueObject.timestamp;
  }

  /*
  // Adds a move call based on the received queue object (inside a worker job) to the transaction object.
  */
  async prepareCall(tx: Transaction): Promise<void> {
    const availableFunctionsInContract = (
      await smartContractFunctionConfig()
    ).smartContractFunctions.map((x) => x.name);

    const invalidMoveCall = !availableFunctionsInContract.includes(
      this.smartContractFunctionName,
    );
    if (invalidMoveCall) {
      throw new Error(
        `Function ${this.smartContractFunctionArguments} not present in the smart contract. Available functions: ${availableFunctionsInContract}`,
      );
    }

    const functionArgumentsTypes = (
      await smartContractFunctionConfig()
    ).smartContractFunctions
      .filter((f) => f.name == this.smartContractFunctionName)
      .flatMap((f) => f.typesOfArguments);

    let suiObject;
    const noFunctionArgumentsDeclaredinContract =
      functionArgumentsTypes.length == 0;
    if (noFunctionArgumentsDeclaredinContract) {
      suiObject = tx.moveCall({
        target: `${envVariables.PACKAGE_ADDRESS!}::${envVariables.MODULE_NAME}::${this.smartContractFunctionName}`,
      });
    } else {
      suiObject = tx.moveCall({
        target: `${envVariables.PACKAGE_ADDRESS!}::${envVariables.MODULE_NAME}::${this.smartContractFunctionName}`,

        // Depending on the smart contract configuration, map the arguments to the correct object type.
        arguments: this.smartContractFunctionArguments.map((argument, i) => {
          switch (functionArgumentsTypes[i]) {
            case "object": {
              return tx.object(argument);
            }
            default: {
              return tx.pure(argument as any);
            }
          }
        }),
      });
    }

    // Transfer the sui object to the receiver address if it is present.
    if (suiObject && this.receiverAddress) {
      tx.transferObjects([suiObject], tx.pure.address(this.receiverAddress));
    }
  }
}

export class PTBExecutionContext extends ExecutionContext {
  protected commands: PTBCommand[];
  protected timestamp: number;
  constructor(ptbExecution: PTBQueueObject) {
    super("PTB");
    this.commands = ptbExecution.commands;
    this.timestamp = ptbExecution.timestamp;
  }

  async prepareCall(tx: Transaction): Promise<void> {
    // TODO: Should results be stored per PTB execution or per buffer aggregated execution?
    const transactionResults = new Array<TransactionResult>();
    for (const [index, command] of this.commands.entries()) {
      let result = tx.moveCall({
        target: command.target,
        typeArguments: command.typeArguments,
        arguments: command.arguments.map((arg) => {
          switch (arg.type) {
            case "object":
              return tx.object(arg.value);
            case "pure":
              // TODO: Should probably support more granular types of arguments (e.g: string, array, address, u8, u64, etc)
              return tx.pure(arg.value as any);
            case "command-result":
              const indexes = arg.value.split("-");
              if (indexes.length == 1) {
                // If the result index is a single number, return the result at that index.

                const resultIndex = parseInt(indexes[0]);
                checkIfResultIndexIsValid(index, resultIndex);
                return transactionResults[resultIndex];
              } else if (indexes.length == 2) {
                // If the result index is two numbers separated by a dash, return the result at the nested index.

                const resultDep1Index = parseInt(indexes[0]);
                checkIfResultIndexIsValid(index, resultDep1Index);

                const resultDep2Index = parseInt(indexes[1]);
                if (isNaN(resultDep2Index)) {
                  throw new Error(
                    `Invalid index. Result index '${resultDep2Index}' is not a number.`,
                  );
                }
                const nestedResultsLength =
                  transactionResults[resultDep1Index].length;
                if (resultDep2Index > nestedResultsLength) {
                  throw new Error(
                    `Invalid index. Result index '${resultDep2Index}' is greater than the number of nested results '${nestedResultsLength}' at command result '${resultDep1Index}'.`,
                  );
                }

                return transactionResults[resultDep1Index][resultDep2Index];
              } else {
                // If the result index is not a single number or a two numbers separated by a dash, throw an error.
                throw new Error(
                  "Invalid command result index format. Supports a depth of up to 2.",
                );
              }
            default:
              throw new Error(`"${arg.type}" is not a valid argument type.`);
          }
        }),
      });
      transactionResults.push(result);
    }
  }
}
