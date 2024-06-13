import { QueueObject } from "../../request_handler/queue";
import { Transaction } from "@mysten/sui/transactions";
import { envVariables } from "../utils/config.ts";

export async function prepareTransaction(jobData: QueueObject[]) {
    const tx = new Transaction();
    const receivers = jobData.map(data => data.requestorAddress)
    for (const receiver of receivers) {
        await addMoveCall(String(receiver), tx);
    }

    return tx;
}

const addMoveCall = async (
    receiver: string,
    tx: Transaction,
) => {

    let nft = tx.moveCall({
        target: `${envVariables.PACKAGE_ADDRESS!}::contract_example::mint_nft`,
        arguments: [
            tx.object(envVariables.ADMIN_CAP!)
        ],
    });

    tx.transferObjects([nft], tx.pure.address(receiver));

    return tx;
}
