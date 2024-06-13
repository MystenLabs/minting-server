!constant SYSTEM_NAME "Minting Server"

workspace {
    model {
        client = softwareSystem  "Client System" "A client that needs to make a transaction."

        mintingServer = softwareSystem "${SYSTEM_NAME}" "Processes request and executes the transaction." {
     
                requestHandler = container "Request Handler API" "Checks the eligibility of the request. e.g. only one mint per client" "express.js"
                requestProducer = container "Request Producer" "Creates new requests and adds then in the Queue"
                requestConsumer = container "Request Consumer" "Consumes requests from the queue and executes them. Each consumer handles invocation of 1 Move Function"
            

            database = container "Database" "Contains request queues to be processed by workers and keeps track of the request states." "Redis" {
                tags "database"
            }

           requestMonitor = container "Request Monitor" "Tracks the request states and the traffic of the system. Keeps logs, displays them on a dashboard and sends alerts upon certain  conditions." "Grafana"

           notifier = container "Notifier" "Notifies the client regarding the state of the request." "Web Socket Server"
        }
        
        sui = softwareSystem "Sui Network" "The Blockchain system"

        # Context level relationships
        client -> mintingServer "Request for sui transaction"
        mintingServer -> sui "Executes transaction on"

        # Component level relationships
        client -> requestHandler "Sends request to"
        requestHandler -> requestProducer "Submits request for processing"
        requestProducer -> database "Checks eligibility of request based on business rules and adds request to the queue"
        database -> requestConsumer "Pulls requests from"
        requestConsumer -> sui "Makes transaction calls to specific Move function"
        database -> requestMonitor "Monitor pulls request data and logs"

        requestConsumer -> notifier "Sends transaction results to"
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
