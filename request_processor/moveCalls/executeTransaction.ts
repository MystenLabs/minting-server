import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { ADMIN_SECRET_KEY } from "../utils/config";
import { prepareTransaction} from "./prepareTransaction";
import { Job } from "bullmq";


const suiClient = new SuiClient({url: getFullnodeUrl('testnet')});

let adminPrivateKeyArray = Uint8Array.from(
    Array.from(fromB64(ADMIN_SECRET_KEY))
);

const adminKeypair = Ed25519Keypair.fromSecretKey(
    adminPrivateKeyArray.slice(1)
);

const adminAddress = adminKeypair.getPublicKey().toSuiAddress();

export async function executeTransaction(receivers: string[], job: Job) {
    const transaction = await prepareTransaction(receivers)
    job.updateProgress(50);
    const res = await suiClient.signAndExecuteTransaction({
        transaction: transaction,
        signer: adminKeypair,
        requestType: "WaitForLocalExecution",
        options: {
            showEffects: true
        }
    });

    return {status: res.effects?.status.status, digest: res.digest};
}