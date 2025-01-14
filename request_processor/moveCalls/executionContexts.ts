import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { PTBCommand, PTBQueueObject } from "../../request_handler/queue";
import { envVariables, smartContractFunctionConfig } from "../utils/config";
import { checkIfResultIndexIsValid, createTarget } from "../utils/helpers";

export abstract class ExecutionContext {
  protected context: String;

  constructor(context: String) {
    this.context = context;
  }

  abstract prepareCall(tx: Transaction): Promise<void>;
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
      const ptbTarget = createTarget(command.target);
      const ptbTargetFunctionName = ptbTarget.split("::")[2];

      // Function validation
      const availableFunctionsInContract = (
        await smartContractFunctionConfig()
      ).smartContractFunctions.map((x) => x.name);

      const invalidMoveCall = !availableFunctionsInContract.includes(
        ptbTargetFunctionName,
      );
      // TODO: This will throw an error if framework functions are not included in the smart contract config yaml.
      if (invalidMoveCall) {
        throw new Error(
          `Function ${ptbTargetFunctionName} not present in the smart contract. Available functions: ${availableFunctionsInContract}`,
        );
      }

      const functionArgumentsTypes = (
        await smartContractFunctionConfig()
      ).smartContractFunctions
        .filter((f) => f.name == ptbTargetFunctionName)
        .flatMap((f) => f.argumentTypes);

      let result = tx.moveCall({
        target: ptbTarget,
        typeArguments: command.typeArguments,
        arguments: command.arguments.map((arg, index) => {
          switch (arg.type) {
            case "request-input":
              // TODO: Should probably support more granular types of arguments (e.g: string, array, address, u8, u64, etc)
              if (functionArgumentsTypes[index] === "object") {
                return tx.object(arg.value);
              } else {
                // TODO: Typescript is not liking this
                return tx["pure"][functionArgumentsTypes[index]](
                  arg.value as any,
                );
              }
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
