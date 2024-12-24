import { fromBase64 } from "@mysten/sui/utils";
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
  Array.from(fromBase64(envVariables.ADMIN_SECRET_KEY!)),
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

export async function executeTransaction(receivers: QueueObject[]) {
  const transaction = await aggregateMoveCallsIntoATransaction(receivers);
  const res = await executor.executeTransaction(transaction);

  return { effects: res.effects, digest: res.digest };
}
