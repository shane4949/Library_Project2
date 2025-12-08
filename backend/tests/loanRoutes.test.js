const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const sinon = require("sinon");
const express = require("express");
const jwt = require("jsonwebtoken");

const Loan = require("../models/Loan");
const Book = require("../models/Book");
const loanRoutes = require("../routes/Loans");

describe("Loan Routes", () => {
  let app;
  let ioMock;
  let memberToken = jwt.sign(
    { userId: "user123", role: "member" },
    "testsecret"
  );

  before(() => {
    process.env.JWT_SECRET = "testsecret";
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    ioMock = { emit: sinon.spy() };
    app.set("io", ioMock);

    app.use("/api/Loans", loanRoutes);
  });

  afterEach(() => {
    sinon.restore();
  });

  /* -----------------------------------------
     GET /api/loans/my
  -----------------------------------------*/
  it("GET /my should return user's loans", async () => {
    const populateStub = sinon.stub().resolves([
      { _id: "l1", bookId: { title: "Book A" }, returnedDate: null }
    ]);

    sinon.stub(Loan, "find").returns({
      sort: () => ({ populate: populateStub })
    });

    const res = await request(app)
      .get("/api/Loans/my")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(1);
    expect(populateStub.calledOnce).to.be.true;
  });

  /* -----------------------------------------
     POST /api/loans/borrow
  -----------------------------------------*/
  it("POST /borrow should return 400 if bookId missing", async () => {
    const res = await request(app)
      .post("/api/Loans/borrow")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Missing bookId");
  });

  it("POST /borrow should block if user already has active loan", async () => {
    sinon.stub(Loan, "findOne").callsFake(async () => ({
      _id: "loan123",
      returnedDate: null
    }));

    const res = await request(app)
      .post("/api/Loans/borrow")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ bookId: "book123" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("You already borrowed this book");
  });

  it("POST /borrow should block if no copies available", async () => {
    sinon.stub(Loan, "findOne").callsFake(async () => null);

    sinon
      .stub(Book, "findOneAndUpdate")
      .callsFake(async () => null);

    const res = await request(app)
      .post("/api/Loans/borrow")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ bookId: "book123" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("No copies available");
  });

  it("POST /borrow should create loan and emit event", async () => {
    sinon.stub(Loan, "findOne").callsFake(async () => null);

    sinon.stub(Book, "findOneAndUpdate").callsFake(async () => ({
      _id: "book123",
      copiesAvailable: 4
    }));

    sinon.stub(Loan, "create").callsFake(async () => ({
      _id: "loan999",
      bookId: "book123",
      memberId: "user123"
    }));

    const res = await request(app)
      .post("/api/Loans/borrow")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ bookId: "book123" });

    expect(res.status).to.equal(201);
    expect(ioMock.emit.calledOnce).to.be.true;
    expect(ioMock.emit.firstCall.args[0]).to.equal("book:availability");
  });

  /* -----------------------------------------
     PUT /api/loans/:id/return
  -----------------------------------------*/
  it("PUT /:id/return should return 404 if active loan not found", async () => {
    sinon.stub(Loan, "findOne").callsFake(async () => null);

    const res = await request(app)
      .put("/api/Loans/123/return")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal("Active loan not found");
  });

  it("PUT /:id/return should complete return and emit event", async () => {
    const saveStub = sinon.stub().resolves();

    sinon.stub(Loan, "findOne").callsFake(async () => ({
      _id: "loan123",
      bookId: "book123",
      returnedDate: null,
      save: saveStub
    }));

    sinon
      .stub(Book, "findByIdAndUpdate")
      .callsFake(async () => ({ _id: "book123", copiesAvailable: 7 }));

    const res = await request(app)
      .put("/api/Loans/loan123/return")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Returned");
    expect(ioMock.emit.calledOnce).to.be.true;
    expect(ioMock.emit.firstCall.args[0]).to.equal("book:availability");
  });
});
