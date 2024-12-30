import { Queue } from "bullmq";
import { generatePID } from "./utils/pid";

const redisConfig = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
};

export type ExecutionContextValues = "SmartContract" | "PTB";

export type SmartContractQueueObject = {
  executionContext: ExecutionContextValues;
  timestamp: number;
  smartContractFunctionName: string;
  smartContractFunctionArguments: string[];
  receiverAddress?: string;
};

export type PTBArgument = {
  type: "object" | "pure" | "command-result";
  value: string;
};

export type PTBCommand = {
  target: string;
  arguments: PTBArgument[];
  typeArguments: string[];
};

export type PTBQueueObject = {
  executionContext: ExecutionContextValues;
  timestamp: number;
  commands: PTBCommand[];
};

export type QueueObject = SmartContractQueueObject | PTBQueueObject;

export const isSmartContractQueueObject = (
  x: any,
): x is SmartContractQueueObject => x.executionContext === "SmartContract";

export const isPTBQueueObject = (x: any): x is PTBQueueObject =>
  x.executionContext === "PTB";

export const requestsQueue = new Queue("requests-queue", {
  connection: redisConfig,
});

/// Push a request to the queue in order to place it for consumption.
export async function enqueRequest(queueObjects: Array<QueueObject>) {
  await requestsQueue.add(
    `job-${generatePID()}`, // job name
    queueObjects, // payload
    {
      attempts: Number(process.env.JOB_RETRIES ?? 3),
      backoff: {
        type: "exponential",
        delay: Number(process.env.JOB_BACKOFF_DELAY ?? 1000),
      },
    },
  );
}
