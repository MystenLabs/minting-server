import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { aggregateMoveCallsIntoATransaction } from "./prepareTransaction";
import { ParallelTransactionExecutor } from "@mysten/sui/transactions";
import { QueueObject } from "../../request_handler/queue";
import { envVariables } from "../utils/config";

type SuiNetwork = "mainnet" | "testnet" | "devnet";
const parseNetwork = (network: string | undefined): SuiNetwork => {
  if (network === "mainnet" || network === "testnet" || network === "devnet") {
    return network;
  } else {
    console.warn(`Invalid network: ${network}, defaulting to testnet`);
    return "testnet";
  }
};
const suiClient = new SuiClient({
  url: getFullnodeUrl(parseNetwork(process.env.SUI_NETWORK)),
});

let adminPrivateKeyArray = Uint8Array.from(
  Array.from(fromB64(envVariables.ADMIN_SECRET_KEY!)),
);

const adminKeypair = Ed25519Keypair.fromSecretKey(
  adminPrivateKeyArray.slice(1),
);

const executor = new ParallelTransactionExecutor({
  client: suiClient,
  signer: adminKeypair,
  coinBatchSize: parseInt(process.env.PTE_COIN_BATCH_SIZE ?? "20"),
  initialCoinBalance: BigInt(
    process.env.PTE_INITIAL_COIN_BALANCE ?? 5_000_000_000,
  ),
  minimumCoinBalance: BigInt(
    process.env.PTE_MINIMUM_COIN_BALANCE ?? 500_000_000,
  ),
  // The maximum number of gas coins to keep in the gas pool,
  // which also limits the maximum number of concurrent transactions
  maxPoolSize: parseInt(process.env.PTE_MAX_POOL_SIZE ?? "10"),
});

async function dryRunTransaction(receivers: string[]): Promise<any> {
    const transaction = await aggregateMoveCallsIntoATransaction([
        {smartContractFunctionName: 'mint_nft', 
        smartContractFunctionArguments: [ "0xdd33675337d769bc9cc4120e204afd8e3f6aa047b2a9ee5d6c6c1dcbc87bd169" ],
        receiverAddress: "0x021318ee34c902120d579d3ed1c0a8e4109e67d386a97b841800b0a9763553ef" ,
        timestamp: 0
    }]);

    const txBytes = await transaction.build({client: suiClient});
    await suiClient
    .dryRunTransactionBlock({
        transactionBlock: txBytes,
    })
    .then((resp) => {
        if (resp.effects.status.status !== "success") {
            console.log(resp.effects);
            return 0;
          }
          console.log("Success");
          console.log(resp.balanceChanges);
          return resp.balanceChanges;
        })
        .catch((err) => {
          console.log(err);
        });
}

export async function executeTransaction(receivers: QueueObject[]) {
  const transaction = await aggregateMoveCallsIntoATransaction(receivers);
  const res = await executor.executeTransaction(transaction);

  return { effects: res.effects, digest: res.digest };
}
