module contract_example::contract_example {

    public struct AdminCap has key{
        id: UID
    }

    public struct ExampleNFT has key, store {
        id: UID,
        field: u64
    }

    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };

        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    public fun mint_nft(_cap: &AdminCap, ctx: &mut TxContext): ExampleNFT {
        ExampleNFT {
            id: object::new(ctx),
            field: 0
        }
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
