import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { ADMIN_SECRET_KEY } from "../utils/config";
import { prepareTransaction} from "./prepareTransaction";
import { Job } from "bullmq";
import { ParallelTransactionExecutor } from "@mysten/sui/transactions";


const suiClient = new SuiClient({url: getFullnodeUrl('testnet')});

let adminPrivateKeyArray = Uint8Array.from(
    Array.from(fromB64(ADMIN_SECRET_KEY))
);

const adminKeypair = Ed25519Keypair.fromSecretKey(
    adminPrivateKeyArray.slice(1)
);

const executor = new ParallelTransactionExecutor({
  client: suiClient,
  signer: adminKeypair,

  // The maximum number of gas coins to keep in the gas pool,
  // which also limits the maximum number of concurrent transactions
  maxPoolSize: 50,
})

export async function executeTransaction(receivers: string[], job: Job) {
    const transaction = await prepareTransaction(receivers)
    job.updateProgress(50);

    const res = await executor.executeTransaction(transaction)

    return {status: res.effects, digest: res.digest};
}
