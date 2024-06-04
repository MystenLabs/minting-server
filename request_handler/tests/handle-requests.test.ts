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
