import { PACKAGE_ADDRESS, ADMIN_CAP } from "../lib/config";

import { TransactionBlock } from "@mysten/sui.js/transactions";

export async function prepareTransactionBlock(receivers: string[]) {
    const txb = new TransactionBlock();
    
    for (const receiver of receivers) {
        await addMoveCall(receiver, txb);
    }

    return txb;
}

const addMoveCall = async (
    receiver: string,
    txb: TransactionBlock,
) => {
    let nft = txb.moveCall({
        target: `${PACKAGE_ADDRESS}::contract_example::mint_nft`,
        arguments: [
            txb.object(ADMIN_CAP)
        ],
    });

    txb.transferObjects([nft], txb.pure(receiver));

    return txb;
}
