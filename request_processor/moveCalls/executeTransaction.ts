import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { aggregateMoveCallsIntoATransaction } from "./prepareTransaction";
import { ParallelTransactionExecutor } from "@mysten/sui/transactions";
import { QueueObject } from "../../request_handler/queue";
import { envVariables } from "../utils/config";
import { Transaction } from "@mysten/sui/transactions";

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
  Array.from(fromB64(envVariables.ADMIN_SECRET_KEY!))
);

const adminKeypair = Ed25519Keypair.fromSecretKey(
  adminPrivateKeyArray.slice(1)
);

const balance = await dryRunTransaction();

const executor = new ParallelTransactionExecutor({
  client: suiClient,
  signer: adminKeypair,
  coinBatchSize: parseInt(process.env.PTE_COIN_BATCH_SIZE ?? "20"),
  initialCoinBalance: BigInt(
    Number(balance) * 1000 ?? process.env.PTE_INITIAL_COIN_BALANCE
  ),
  minimumCoinBalance: BigInt(
    Number(balance) * 1000 ?? process.env.PTE_MINIMUM_COIN_BALANCE
  ),
  // The maximum number of gas coins to keep in the gas pool,
  // which also limits the maximum number of concurrent transactions
  maxPoolSize: parseInt(process.env.PTE_MAX_POOL_SIZE ?? "10"),
});

export async function dryRunTransaction(): Promise<string | undefined> {
  try {
    const tx = new Transaction();

    let nft = tx.moveCall({
      target: `${envVariables.PACKAGE_ADDRESS!}::${envVariables.MODULE_NAME}::mint_nft`,
      arguments: [tx.object(envVariables.ADMIN_CAP!)],
    });

    tx.transferObjects(
      [nft],
      tx.pure.address(
        "0x021318ee34c902120d579d3ed1c0a8e4109e67d386a97b841800b0a9763553ef"
      )
    );

    tx.setSender(envVariables.ADMIN_ADDRESS!);

    const txBytes = await tx.build({ client: suiClient });
    let resp = await suiClient.dryRunTransactionBlock({
      transactionBlock: txBytes,
    });
    if (resp.effects.status.status !== "success") {
      console.log(resp.effects);
      return undefined;
    }

    console.log("Success");
    const amount = resp.balanceChanges[0]?.amount;
    console.log(amount);
    return amount;
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

export async function executeTransaction(receivers: QueueObject[]) {
  const transaction = await aggregateMoveCallsIntoATransaction(receivers);
  const res = await executor.executeTransaction(transaction);

  return { effects: res.effects, digest: res.digest };
}
