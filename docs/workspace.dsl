!const SYSTEM_NAME "Minting Server"

workspace {
    model {
        client = softwareSystem  "Client System" "A client that needs to make transactions on Sui, either user or system."
        mintingServer = softwareSystem "${SYSTEM_NAME}" "Processes request and executes the transaction." {

                requestHandler = container "Request Handler API" "Buffers incoming requests in batches of size N, empties every X milliseconds or when full." "express.js"
                requestProcessor = container "Request Processor" "A service with a bullmq worker and Sui ParallelTransactionExecutor client that processes and executes queued requests. Executes a specified number of transactions concurrently based on setup." "BullMQ worker"


            database = container "Database" "Contains request queues for worker processing and tracks request states." "Redis" {
                tags "database"
            }

           requestMonitor = container "Request Monitor" "Monitors request states and system traffic in a GUI, logs activity, displays data on a dashboard. Hosted on localhost:3000." "Bull board"

           notifier = container "Notifier" "Provides a websocket for clients to subscribe and receive job completion notifications, informing them of request states. Hosted on: ws://localhost:3001" "Web Socket Server"
        }

        sui = softwareSystem "Sui Network" "The Blockchain system"

        # Context level relationships
        client -> mintingServer "Request for sui transaction"
        mintingServer -> sui "Executes transaction on"

        # Component level relationships
        client -> requestHandler "Sends POST request to"
        requestHandler -> database "Submits request for processing"
        database -> requestProcessor "Pulls requests from"
        requestProcessor -> sui "Makes transaction calls to"
        database -> requestMonitor "Job states get depicted on"

        requestProcessor -> notifier "Sends transaction results to"
        notifier -> client "Notifies client that the request's transactions has been completed"
    }

    views {
        systemContext mintingServer "Context" {
            include *
            autolayout lr
        }

        container mintingServer "Container" {
            include *

        }

        styles {
            element "database" {
                shape Cylinder
            }
        }

        themes default
    }
}
