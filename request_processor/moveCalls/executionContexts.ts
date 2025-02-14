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
  protected transactionResults: TransactionResult[];
  // As multiple PTB requests can be aggregated into a single transaction,
  // the offset is used to keep the result arguments in sync with the command results.
  protected offset: number;
  protected timestamp: number;
  constructor(
    ptbExecution: PTBQueueObject,
    transactionResults: TransactionResult[],
  ) {
    super("PTB");
    this.commands = ptbExecution.commands;
    this.timestamp = ptbExecution.timestamp;
    this.transactionResults = transactionResults;
    this.offset = this.transactionResults.length;
  }

  async prepareCall(tx: Transaction): Promise<void> {
    for (const [commandIndex, command] of this.commands.entries()) {
      const ptbTarget = createTarget(command.target);
      // Function validation
      const availableFunctionsInContract = (
        await smartContractFunctionConfig()
      ).smartContractFunctions.map((x) => x.name);

      // This also validates framework calls as well as smart contract calls
      // TODO: if this is not desired we can make this in separate validation functions
      const invalidMoveCall = !availableFunctionsInContract.includes(
        command.target,
      );
      if (invalidMoveCall) {
        throw new Error(
          `Function ${command.target} not present in the smart contract. Available functions: ${availableFunctionsInContract}`,
        );
      }

      const functionArgumentsTypes = (
        await smartContractFunctionConfig()
      ).smartContractFunctions
        .filter((f) => f.name == command.target)
        .flatMap((f) => f.argumentTypes);

      // Validate that the number of arguments matches the number of argument types
      if (command.arguments.length !== functionArgumentsTypes.length) {
        throw new Error(
          `Number of request arguments '${command.arguments.length}' does not match the number of argument types '${functionArgumentsTypes.length}' for function '${command.target}'.`,
        );
      }

      const typeArguments = (
        await smartContractFunctionConfig()
      ).smartContractFunctions
        .filter((f) => f.name == command.target)
        .flatMap((f) => f.typeArguments);

      // Construct the arguments for the move call
      let args = command.arguments.map((arg, argumentIndex) => {
        switch (arg.type) {
          case "request-input":
            switch (functionArgumentsTypes[argumentIndex]) {
              case "object":
                return tx.object(arg.value);
              case "address":
                return tx.pure.address(arg.value as string);
              case "string":
                return tx.pure.string(arg.value as string);
              case "bool":
                return tx.pure.bool(arg.value.toLowerCase() === "true");
              case "u8":
                return tx.pure.u8(parseInt(arg.value));
              case "u16":
                return tx.pure.u16(parseInt(arg.value));
              case "u32":
                return tx.pure.u32(parseInt(arg.value));
              case "u64":
                return tx.pure.u64(arg.value as string);
              case "u128":
                return tx.pure.u128(arg.value as string);
              case "u256":
                return tx.pure.u256(arg.value as string);
              default:
                throw new Error(
                  `Unsupported argument type: ${functionArgumentsTypes[argumentIndex]}`,
                );
            }
          case "command-result":
            const indexes = arg.value.split("-");
            if (indexes.length == 1) {
              // If the result index is a single number, return the result at that index.

              const resultIndex = this.offset + parseInt(indexes[0]);
              checkIfResultIndexIsValid(commandIndex, resultIndex);
              return this.transactionResults[resultIndex];
            } else if (indexes.length == 2) {
              // If the result index is two numbers separated by a dash, return the result at the nested index.

              const resultDep1Index = this.offset + parseInt(indexes[0]);
              checkIfResultIndexIsValid(commandIndex, resultDep1Index);

              const resultDep2Index = parseInt(indexes[1]);
              if (isNaN(resultDep2Index)) {
                throw new Error(
                  `Invalid index. Result index '${resultDep2Index}' is not a number.`,
                );
              }
              const nestedResultsLength =
                this.transactionResults[resultDep1Index].length;
              if (resultDep2Index > nestedResultsLength) {
                throw new Error(
                  `Invalid index. Result index '${resultDep2Index}' is greater than the number of nested results '${nestedResultsLength}' at command result '${resultDep1Index}'.`,
                );
              }

              return this.transactionResults[resultDep1Index][resultDep2Index];
            } else {
              // If the result index is not a single number or a two numbers separated by a dash, throw an error.
              throw new Error(
                "Invalid command result index format. Supports a depth of up to 2.",
              );
            }
          default:
            throw new Error(`"${arg.type}" is not a valid argument type.`);
        }
      });
      let result = tx.moveCall({
        target: ptbTarget,
        typeArguments: typeArguments,
        arguments: [...args],
      });
      this.transactionResults.push(result);
    }
  }
}
