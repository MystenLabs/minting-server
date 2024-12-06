# minting-server

A system that can process multiple Sui transactions in parallel using
a producer-consumer worker scheme.

## QuickStart

### 1. Publish Your Smart Contracts

Ensure that your smart contract is published and accessible. Refer to [the official guide](https://docs.sui.io/guides/developer/first-app/publish) for detailed instructions on how to publish a Sui smart contract(package).

### 2. Download and unzip the latest release

Download the latest release from [releases](https://github.com/MystenLabs/minting-server/releases). Extract the contents of the downloaded file and navigate to the extracted folder, which will be your working directory.

The release file includes the following:

- `smart_contract_config.yaml`: Specifies your contract's functions and the object types of their arguments.
- `deploy.sh`: A script that deploys your minting server container network.
- `docker-compose.yaml`: Defines the minting server services.

### 3. Configure Environment and Smart Contract Files

Fill in the mandatory fields in the `.env` and `smart_contract_config.yaml` files to match your environment and contract specifics.

### 4. Deploy the Container

Run `chmod u+x deploy.sh && ./deploy.sh` to deploy the entire container setup, ensuring all necessary components and configurations are correctly initialized and running.

### 5. Access the Dashboard

Monitor the progress of the jobs by accessing the dashboard at the URL where you deployed the service, on port 3000.

The Dashboard provides comprehensive information about active, completed, and failed jobs.
![Dashboard Overview](/media/DashboardOverview.png)

It offers detailed insights into the status of completed jobs and error messages for failed transactions.
![Completed Jobs](/media/CompletedJobs.png)
![Failed Jobs](/media/FailedJobs.png)

## Implementation details

- Runtime: https://bun.sh/
- Sequence and C4 diagrams can be found inside `docs/`

## Local Setup

To test the system locally, you need to first publish an example smart contract.
We provide an example contract in the `move` directory.

[Optional] Export an `ADMIN_ADDRESS` in your terminal with the address you want to use as the admin. Otherwise, the current CLI selected address will be used.

[Optional] Export an `ADMIN_PHRASE` in your terminal if you want to use a brand new wallet. Otherwise, the current CLI selected wallet will be used.

Simply run `cd move/ && chmod +x ./publish.sh && ./publish.sh` to deploy the contract to the Sui network.
A `.publish.res.json` file will be generated with important information that you will need to set up the cluster.
These fields are used to configure the `request_processor` service and test the system using an example smart contract.

Create a `.env` file to the root directory as indicated in the `.env.example` file.

Then, to set up the cluster simply run:

`docker compose up -d --build`

> Tip: to quickly test your changes back to back, rebuild the services use `docker compose down && docker compose up -d --build --force-recreate`.

This will generate a network of the containers:

- `request_handler`: The web server (producer) that accepts requests (jobs) and saves them to the `queue` service.
  You can access a [dashboard](https://github.com/felixmosh/bull-board) to monitor all the jobs on `localhost:3000`.
- `queue`: A redis database that contains the queue of the requests (jobs) to be processed.
- `request_processor`: A worker that processes (consumes) the requests that have been queued up.
- `notifier`: A websocket server that exposes (publishes) the results of thef jobs to clients.
  You can open a websocket connection in your terminal with `websocat ws://localhost:3001`.

It is also necessary to create a `request_processor/smart_contract_config.yaml` where for each function
of the smart contract you must provide the function name the function arguments types.

e.g. assuming the smart contract has a function `mint_nft` that takes an `object` as an argument and a
`modify_nft` function that takes a `pure` type argument and an `object` type argument, the configuration file would look like this:

```yaml
smart_contract_functions:
  - name: "mint_nft" #
    types_of_arguments: ["object"]
  - name: "modify_nft" #
    types_of_arguments: ["pure", "object"]
```

So if you want to test the system (calling the `mint_nft`),
you can send a POST request to the `request_handler` service with the following curl command:

```bash
curl --request POST \
  --url 'http://localhost:3000/?=' \
  --header 'Content-Type: application/json' \
  --data '{
	"smartContractFunctionName": "mint_nft",
	"smartContractFunctionArguments": ["0x9320eaaf945570b1baf7607f98a9cf5585fdcb8ed09d46da93199fee16b48196"],
	"receiverAddress": "0xe40c8cf8b53822829b3a6dc9aea84b62653f60b771e9da4bd4e214cae851b87b"
}'
```

## Architecture diagrams

The architecture of the system is described in the `docs/` directory.
To edit the diagrams, you can edit the `docs/workspace.dsl` file.

To see an interactive version of the diagrams: being on the project's root directory,
run an instance of a `structurizr` container with: `docker run -it --rm -p 8080:8080 -v ./docs:/usr/local/structurizr structurizr/lite:latest `

Access the UI on `localhost:8080`.

## Tests

### Request Handler

The endpoint tests in the request handler require that the `queue` service is already up and running,
so if you need to try it out, make sure to run first from the repo's root dir `docker compose up -d queue`
and then `cd request_handler && bun test`.

### Load testing

Install k6 with `brew install k6`.

Install ioredis with `bun install ioredis`.

export the redis password as an env variable
`export REDIS_PASSWORD=<your_password>` so that it can be read by `stats.ts`.

Run with: `cd load_testing/ && k6 run --vus <number of virtual users> --duration <time in seconds> mint.js`.

For example vus = 2 and duration = 30s

At the end of the test runs, a new `summary.html` file will be generated that contains the results of k6.

If you need statistics about average response time, requests per second etc from the moment a request is handled to the moment it's completed, use `bun stats.ts`.

## Calculate gas cost

To define the variables PTE_INITIAL_COIN_BALANCE and PTE_MINIMUM_COIN_BALANCE, use the dryRunTransactionBlock method from [Typescript SDK](https://sdk.mystenlabs.com/typescript). This approach helps you estimate the transaction costs by simulating the execution without actually performing it.

For example, you can use a script like the following:

```typescript
const tx = new Transaction();

let result = tx.moveCall({
target: // contract function to call,
arguments: [
// the arguments of your function
   ],
});

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
```

Note that the result of this function will vary based on the move calls included in the transaction and the specific arguments provided.
