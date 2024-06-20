# minting-server

A system that can process multiple Sui transactions in parallel using
a producer-consumer worker scheme.

## Implementation details

- Runtime: https://bun.sh/
- Sequence and C4 diagrams can be found inside `docs/`

## Local Setup

To test the system locally, you need to first publish an example smart contract.
We provide an example contract in the `move` directory.

Simply run `cd move/ && chmod +x ./publish.sh && ./publish.sh` to deploy the contract to the Sui network.
A `.publish.res.json` file will be generated with important information that you will need to set up the cluster.
These fields are used to configure the `request_processor` service and test the system using an example smart contract.

Create a `.env` file to the root directory directory as indicated in the `.env.example` file.

Then, to set up the cluster simply run:

`docker compose up -d --build`

> Tip: to quickly test your changes back to back, rebuild the services use `docker compose down && docker compose up -d --build --force-recreate`.

This will generate a network of the containers:

- `request_handler`: The web server (producer) that accepts requests (jobs) and saves them to the `queue` service.
  You can access a [dashboard](https://github.com/felixmosh/bull-board) to monitor all the jobs on `localhost:3000`.
- `queue`: A redis database that contains the queue of the requests (jobs) to be processed.
- `request_processor`: A worker that processes (consumes) the requests that have been queued up.
- `notifier`: A websocket server that exposes (publishes) the results of the jobs to clients.
  You can open a websocket connection in your terminal with `websocat ws://localhost:3001`.
- `structurizr`: This is a service enables you to explore the C4 diagram of our implementation with an interactive UI on `localhost:8080`.

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
  --header 'User-Agent: insomnia/9.2.0' \
  --data '{
	"smart_contract_function_name": "mint_nft",
	"smart_contract_function_arguments": ["0x9320eaaf945570b1baf7607f98a9cf5585fdcb8ed09d46da93199fee16b48196"],
	"receiver_address": "0xe40c8cf8b53822829b3a6dc9aea84b62653f60b771e9da4bd4e214cae851b87b"
}'
```

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

Run with: `cd load_testing/ && k6 run mint.js`.

At the end of the test runs, a new `summary.html` file will be generated that contains the results of k6.

If you need statistics about average response time, requests per second etc from the moment a request is handled to the moment it's completed, use `bun stats.ts`.
