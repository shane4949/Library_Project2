// tests/authRoutes.test.js
const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const sinon = require("sinon");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");

const authRoutes = require("../routes/auth");
const User = require("../models/User");

describe("POST /auth/login", () => {
  let app;
  let findOneStub;

  before(() => {
    process.env.JWT_SECRET = "testsecret";
  });

  beforeEach(() => {
    // fresh express app for each test
    app = express();
    app.use(express.json());
    app.use("/auth", authRoutes);

    // stub User.findOne for each test
    findOneStub = sinon.stub(User, "findOne");
  });

  afterEach(() => {
    // restore all stubs/spies
    sinon.restore();
  });

  it("should return token for valid login", async () => {
    const passwordHash = await bcrypt.hash("Password123", 10);

    // instead of .resolves(...)
    findOneStub.callsFake(async () => ({
      _id: "123",
      email: "test@example.com",
      passwordHash,
      role: "user",
      name: "Test User",
    }));

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "Password123" });

    expect(res.status).to.equal(200);
    expect(res.body.token).to.exist;

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.userId).to.equal("123");
  });

  it("should return 400 when user does not exist", async () => {
    // simulate "no user found"
    findOneStub.callsFake(async () => null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nouser@example.com", password: "whatever" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("User not found");
  });

  it("should return 400 for wrong password", async () => {
    const passwordHash = await bcrypt.hash("CorrectPass", 10);

    findOneStub.callsFake(async () => ({
      _id: "123",
      email: "test@example.com",
      passwordHash,
      role: "user",
      name: "Test User",
    }));

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "WrongPass" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid password");
  });
});
