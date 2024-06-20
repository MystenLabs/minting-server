import Redis from "ioredis";
import { readFileSync } from "fs";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
});

async function calculateAverages() {
  try {
    const avgLuaScript = readFileSync("calculate_averages.lua", "utf8");
    const medianLuaScript = readFileSync("median_response_time.lua", "utf8");
    const rpsScript = readFileSync("rps.lua", "utf8");
    const avgResult: any = await redis.eval(avgLuaScript, 0);
    const medianResult: any = await redis.eval(medianLuaScript, 0);
    const rpsResult: any = await redis.eval(rpsScript, 0);
    const avgFinishedTime = avgResult;
    const medianResponseTime = medianResult;
    const rps = rpsResult;
    console.log(`Average Finished Time: ${avgFinishedTime} ms`);
    console.log(`Median Response Time: ${medianResponseTime} ms`);
    console.log(`Rquests Per Second: ${rps}`);
  } catch (error) {
    console.error("Error running Lua script:", error);
  }
}

async function main() {
  try {
    await calculateAverages();
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    redis.disconnect();
  }
}

main().catch((err) => {
  console.log("Error:", err);
});
