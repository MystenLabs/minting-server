import { fromB64 } from "@mysten/sui.js/utils";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { ADMIN_SECRET_KEY } from "../lib/config";
import { prepareTransactionBlock } from "./prepareTransaction";
import { TransactionBlock } from "@mysten/sui.js/transactions";


const suiClient = new SuiClient({url: getFullnodeUrl('testnet')});

let adminPrivateKeyArray = Uint8Array.from(
    Array.from(fromB64(ADMIN_SECRET_KEY))
);

const adminKeypair = Ed25519Keypair.fromSecretKey(
    adminPrivateKeyArray.slice(1)
);

const adminAddress = adminKeypair.getPublicKey().toSuiAddress();

export async function executeTransactionBlock(receivers: string[]) {
    const txBlock = await prepareTransactionBlock(receivers)
    const res = await suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txBlock,
        signer: adminKeypair,
        requestType: "WaitForLocalExecution",
        options: {
            showEffects: true
        }
    });

    return res.effects?.status.status;
}