import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { prepareTransaction} from "./prepareTransaction";
import { ParallelTransactionExecutor } from "@mysten/sui/transactions";
import { QueueObject } from "../../request_handler/queue";
import { getEnvVariables } from "../utils/config";

const envVariables = getEnvVariables();
type SuiNetwork = 'mainnet' | 'testnet' | 'devnet';
const parseNetwork = (network: string | undefined): SuiNetwork => {
  if (network === 'mainnet' || network === 'testnet' || network === 'devnet') {
    return network;
  } else {
    return 'testnet';
  }
}
const suiClient = new SuiClient({url: getFullnodeUrl(
  parseNetwork(process.env.SUI_NETWORK)
)});

let adminPrivateKeyArray = Uint8Array.from(
    Array.from(fromB64(envVariables.ADMIN_SECRET_KEY!))
);

const adminKeypair = Ed25519Keypair.fromSecretKey(
    adminPrivateKeyArray.slice(1)
);

const executor = new ParallelTransactionExecutor({
  client: suiClient,
  signer: adminKeypair,
  coinBatchSize: 20,
  initialCoinBalance: BigInt(process.env.PTE_INITIAL_COIN_BALANCE ?? 5_000_000_000),
  minimumCoinBalance: BigInt(process.env.PTE_MINIMUM_COIN_BALANE ?? 500_000_000),
  // The maximum number of gas coins to keep in the gas pool,
  // which also limits the maximum number of concurrent transactions
  maxPoolSize: parseInt(process.env.PTE_MAX_POOL_SIZE ?? '10'),
})

export async function executeTransaction(receivers: QueueObject[]) {
    const transaction = await prepareTransaction(receivers)
    const res = await executor.executeTransaction(transaction)

    return {status: res.effects, digest: res.digest};
}
