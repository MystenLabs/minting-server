import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { ADMIN_SECRET_KEY } from "../utils/config";
import { prepareTransaction} from "./prepareTransaction";
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
  coinBatchSize: 20,
  initialCoinBalance: 5_000_000_000n,
  minimumCoinBalance: 500_000_000n,
  // The maximum number of gas coins to keep in the gas pool,
  // which also limits the maximum number of concurrent transactions
  maxPoolSize: 10,
})

export async function executeTransaction(receivers: string[]) {
    const transaction = await prepareTransaction(receivers)
    const res = await executor.executeTransaction(transaction)

    return {status: res.effects, digest: res.digest};
}
