const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;

const app = require("../app"); 

describe("GET /", () => {
  it("should return 200 and a message", async () => {
    const res = await request(app).get("/");

    expect(res.status).to.equal(200);
    expect(res.text).to.match(/Library API is running/);
  });
});
