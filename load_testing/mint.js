import http from "k6/http";
import { Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const responseTimeTrend = new Trend("response_time");

export const options = {
  iterations: 5000,
};

export function handleSummary(data) {
  console.log(
    `Average response time: ${data.metrics["response_time"].values["p(95)"]} ms`
  );
  return {
    "summary.html": htmlReport(data),
  };
}

export default function () {
  const url = "http://localhost:3000/";
  const payload = JSON.stringify({
    smartContractFunctionName: "mint_nft",
    smartContractFunctionArguments: [
      "0xc44fb22cb1786b4eae31ada831bb0fa2549612ea1dabec5231a792c9fa921f46",
    ],
    receiverAddress:
      "0xe40c8cf8b53822829b3a6dc9aea84b62653f60b771e9da4bd4e214cae851b87b",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = http.post(url, payload, params);
  responseTimeTrend.add(response.timings.duration);
}
