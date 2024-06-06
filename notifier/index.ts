const topic = "job-events"
const server = Bun.serve({
    port: 3001,
    fetch(request, server){
        if (server.upgrade(request)){
            return;
        }
        return new Response("Established websocket connection with the notifier service.");
    },
    websocket:{
        open(ws){
            ws.subscribe(topic);
            console.log("Notifier is up and running! Websocket connection is open.");
        },
        message(ws, message){
            console.log(`Incoming message: ${message}`);
            // TODO: only broadcast when receiving message from request processor
            // ie. authenticate the request processor using a token
            server.publish(topic, `Broadcasting: ${message}`);
        },
        close(_){
            console.log("Connection to notifier service has been closed!");
        }
    }
});

console.log(`Websocket server listening on ${server.port}`);
