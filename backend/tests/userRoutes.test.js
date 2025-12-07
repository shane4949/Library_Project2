// test/userRoutes.test.js
const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");

const userRoutes = require("../routes/users");
const User = require("../models/User");

describe("User routes", () => {
  let app;
  let adminToken;
  let memberToken;

  before(() => {
    process.env.JWT_SECRET = "testsecret";
    adminToken = jwt.sign(
      { userId: "admin123", role: "admin" },
      process.env.JWT_SECRET
    );
    memberToken = jwt.sign(
      { userId: "user123", role: "member" },
      process.env.JWT_SECRET
    );
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/users", userRoutes);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("GET /api/users/me should return current user's profile", async () => {
    const selectStub = sinon.stub().resolves({
      _id: "user123",
      name: "Test User",
      email: "user@test.com",
      role: "member",
    });
    sinon.stub(User, "findById").returns({ select: selectStub });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal("Test User");
    expect(selectStub.calledOnce).to.be.true;
  });

  it("PUT /api/users/me/password should return 400 when oldPassword is wrong", async () => {
    const existingHash = await bcrypt.hash("CorrectOld123", 10);
    const userDoc = {
      passwordHash: existingHash,
      save: sinon.stub().resolves(),
    };

    const selectStub = sinon.stub().resolves(userDoc);
    sinon.stub(User, "findById").returns({ select: selectStub });

    const res = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        oldPassword: "WrongOld",
        newPassword: "NewPass123",
      });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Old password incorrect");
    expect(userDoc.save.called).to.be.false;
  });

  it("PUT /api/users/me/password should update password when oldPassword is correct", async () => {
    const existingHash = await bcrypt.hash("CorrectOld123", 10);
    const saveStub = sinon.stub().resolves();
    const userDoc = {
      passwordHash: existingHash,
      save: saveStub,
    };

    const selectStub = sinon.stub().resolves(userDoc);
    sinon.stub(User, "findById").returns({ select: selectStub });

    const res = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        oldPassword: "CorrectOld123",
        newPassword: "BrandNew456",
      });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Password updated");
    expect(saveStub.calledOnce).to.be.true;
    // new hash shouldn't equal old hash
    expect(userDoc.passwordHash).to.not.equal(existingHash);
  });

  it("GET /api/users should return list for admin", async () => {
    const selectStub = sinon.stub().resolves([
      { _id: "1", name: "A", email: "a@test.com", role: "member" },
      { _id: "2", name: "B", email: "b@test.com", role: "admin" },
    ]);
    sinon.stub(User, "find").returns({ select: selectStub });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body[0].email).to.equal("a@test.com");
  });

  it("GET /api/users should reject non-admin", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal("Admin only");
  });
});
