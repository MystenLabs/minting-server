import { envVariables } from "../utils/config";
import { SUI_FRAMEWORK_ADDRESS } from "@mysten/sui/utils";

export const checkIfResultIndexIsValid = (
  commandIndex: number,
  resultIndex: number,
) => {
  if (isNaN(resultIndex)) {
    throw new Error(
      `Invalid index. Result index '${resultIndex}' is not a number.`,
    );
  }
  if (resultIndex >= commandIndex) {
    throw new Error(
      `Invalid index. Result index '${resultIndex}' is greater or equal to the number of commands '${commandIndex}' that have been processed.`,
    );
  }
};

export const createTarget = (
  ptbTarget: string,
): `${string}::${string}::${string}` => {
  const packageAddress = envVariables.PACKAGE_ADDRESS!;
  const moduleName = envVariables.MODULE_NAME!;

  const processTarget = ptbTarget.split("::");

  if (processTarget.length > 2) {
    throw new Error(`Format of "package::module::function" not handled`);
  }

  // If target contains a module name, we assume its one of the allowed std or sui modules
  // TODO: Add more modules as needed
  if (processTarget.length === 2) {
    switch (processTarget[0]) {
      case "kiosk":
        return `${SUI_FRAMEWORK_ADDRESS}::kiosk::${processTarget[1]}`;
      case "transfer":
        return `${SUI_FRAMEWORK_ADDRESS}::transfer::${processTarget[1]}`;
      default:
        throw new Error(`Unsupported module: ${processTarget[1]}`);
    }
  }

  // Otherwise, we assume its a function name of a smart contract
  return `${packageAddress}::${moduleName}::${processTarget[0]}`;
};
