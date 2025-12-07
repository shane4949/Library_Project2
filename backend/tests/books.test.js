require("dotenv").config();
const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;

const app = require("../app");
const Book = require("../models/Book");
const mongoose = require("mongoose");
const connectDB = require("../config/db");

describe("GET /api/books", () => {

  before(async () => {
    await connectDB(); 
    await Book.deleteMany({});
    await Book.create([
      { title: "Test Book 1", author: "Author A", isbn: "111111", copiesTotal: 5, copiesAvailable: 5 },
      { title: "Test Book 2", author: "Author B", isbn: "222222", copiesTotal: 3, copiesAvailable: 3 }
    ]);
  });

  it("should return a list of books", async () => {
    const res = await request(app).get("/api/books");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body.length).to.be.at.least(2);
    expect(res.body[0]).to.have.property("title");
    expect(res.body[0]).to.have.property("author");
    expect(res.body[0]).to.have.property("isbn");
  });

  after(async () => {
    await Book.deleteMany({});
    await mongoose.connection.close(); // Clean exit
  });
});
