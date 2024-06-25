import http from "k6/http";
import { Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const responseTimeTrend = new Trend("response_time");

export function handleSummary(data) {
  console.log(
    `Average response time: ${data.metrics["response_time"].values["p(95)"]} ms`,
  );
  return {
    "summary.html": htmlReport(data),
  };
}

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: "constant-arrival-rate",
      rate: 300,
      timeUnit: "1s",
      duration: "10m",
      preAllocatedVUs: 10,
      maxVUs: 20,
    },
  },
};

export default function () {
  const url = "http://localhost:3000/";
  const payload = JSON.stringify({
    smartContractFunctionName: "mint_nft",
    smartContractFunctionArguments: [
      "0xdd33675337d769bc9cc4120e204afd8e3f6aa047b2a9ee5d6c6c1dcbc87bd169",
    ],
    receiverAddress:
      "0x021318ee34c902120d579d3ed1c0a8e4109e67d386a97b841800b0a9763553ef",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = http.post(url, payload, params);
  responseTimeTrend.add(response.timings.duration);
}
