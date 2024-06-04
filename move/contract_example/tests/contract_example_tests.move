#[test_only]
module contract_example::contract_example_tests {
    use contract_example::contract_example::{
        Self,
        AdminCap,
        ExampleNFT
    };

    use sui::test_scenario::{Self as ts};

    #[test]
    fun test_contract_example() {
        let admin: address = @0x123;
        let user: address = @0x234;

        let mut scenario = ts::begin(admin);
        {
            let ctx = scenario.ctx();
            contract_example::init_for_testing(ctx);
        };

        scenario.next_tx(admin);
        {   
            let admin_cap = scenario.take_from_sender<AdminCap>();
            let nft = contract_example::mint_nft(&admin_cap, scenario.ctx());

            transfer::public_transfer(nft, user);

            scenario.return_to_sender<AdminCap>(admin_cap);
        };
        scenario.next_tx(user);
        {
            let nft = scenario.take_from_sender<ExampleNFT>();

            scenario.return_to_sender<ExampleNFT>(nft);
        };

        scenario.end();
    }
}
