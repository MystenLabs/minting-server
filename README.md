# minting-server

A system that can process multiple Sui transactions in parallel using
a producer-consumer worker scheme.

## Implementation details

- Runtime: https://bun.sh/
- Sequence and C4 diagrams can be found inside `docs/`

## Local Setup

From the root directory run

`docker compose up -d --build`

This will generate a network of the containers:
- `request_handler`: The web server (producer) that accepts requests (jobs) and saves them to the `queue` service.
You can access a [dashboard](https://github.com/felixmosh/bull-board) to monitor all the jobs on `localhost:3000`.
- `queue`: A redis database that contains the queue of the requests (jobs) to be processed.
- `request_processor`: A worker that processes (consumes) the requests that have been queued up.
- `notifier`: A websocket server that exposes (publishes) the results of the jobs to clients.
You can open a websocket connection in your terminal with `websocat ws://localhost:3001`.
- `structurizr`: This is a service enables you to explore the C4 diagram of our implementation with an interactive UI on `localhost:8080`.

Try it out: Send a `POST` request to `localhost:3000` with a body like the following:

```json
{
  "address": "0x123...",
  "type": "mint"
}
```

## Tests

### Request Handler

The endpoint tests in the request handler require that the `queue` service is already up and running,
so if you need to try it out, make sure to run first from the repo's root dir `docker compose up -d queue`
and then `cd request_handler && bun test`.
