import { PACKAGE_ADDRESS, ADMIN_CAP } from "../utils/config";

import { Transaction } from "@mysten/sui/transactions";

export async function prepareTransactionBlock(receivers: string[]) {
    const txb = new Transaction();
    
    for (const receiver of receivers) {
        await addMoveCall(receiver, txb);
    }

    return txb;
}

const addMoveCall = async (
    receiver: string,
    txb: Transaction,
) => {

    let nft = txb.moveCall({
        target: `${PACKAGE_ADDRESS}::contract_example::mint_nft`,
        arguments: [
            txb.object(ADMIN_CAP)
        ],
    });

    txb.transferObjects([nft], txb.pure.address(receiver));

    return txb;
}
