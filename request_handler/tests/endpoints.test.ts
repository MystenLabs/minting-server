import { expect, test } from "bun:test";
import { app } from "../app";
import request  from "supertest";

test("Healthcheck endpoint returns status 200", async () => {
  await request(app)
    .get("/healthcheck")
    .then(response => {
      expect(response.statusCode).toBe(200);
    })
})

test("Accept request for processing", async () => {
  await request(app)
    .post("/")
    .send({
      "smart_contract_function_name": "mint_nft",
	    "smart_contract_function_arguments": ["0x9320eaaf945570b1baf7607f98a9cf5585fdcb8ed09d46da93199fee16b48196"],
			"receiver_address": "0xe40c8cf8b53822829b3a6dc9aea84b62653f60b771e9da4bd4e214cae851b87b"
    })
    .then(response => {
      expect(response.statusCode).toBe(202);
    })
})
