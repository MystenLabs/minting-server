import { expect, test } from "bun:test";
import { getSmartContractFunctionsConfig }  from "../utils/config";

test("smart_contract_config.yaml gets serialized successfully", async () => {
  const contractSetup = await getSmartContractFunctionsConfig();
  expect(contractSetup).toBeDefined();
});
