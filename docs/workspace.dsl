!constant SYSTEM_NAME "Minting Server"

workspace {
    model {
        client = softwareSystem "Client" "A client that needs to make a transaction."

        mintingServer = softwareSystem "${SYSTEM_NAME}" "Processes request and executes the transaction." {
            group worker {
                requestHandler = container "Request Handler API" "Checks the eligibility of the request. e.g. only one mint per client" "express.js"
                requestProcessor = container "Request Processor" "Processes requests and executes them."
            }

            database = container "Database" "Contains request queues to be processed by workers and keeps track of the request states." "Redis" {
                tags "database"
            }

           requestMonitor = container "Request Monitor" "Tracks the request states and the traffic of the system. Keeps logs, displays them on a dashboard and sends alerts upon certain  conditions." "Grafana"

           notifier = container "Notifier" "Notifies the client regarding the state of the request." "Web Socket Server"
        }
        
        sui = softwareSystem "Sui Network" "Contains the smart contract."

        # Context level relationships
        client -> mintingServer "Request for sui transaction"
        mintingServer -> sui "Executes transaction on"

        # Component level relationships
        client -> requestHandler "Sends request to"
        requestHandler -> database "Checks eligibility of request based on business rules and adds request to the queue"
        database -> requestProcessor "Pulls requests from"
        requestProcessor -> sui "Makes transaction calls to"
        database -> requestMonitor "Monitor pulls request data and logs"

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