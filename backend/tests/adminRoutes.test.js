// test/adminRoutes.test.js
const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const express = require("express");

const adminRoutes = require("../routes/admin");
const User = require("../models/User");
const Book = require("../models/Book"); 

describe("Admin routes (users)", () => {
  let app;
  let adminToken;
  let memberToken;
  let ioMock;

  before(() => {
    process.env.JWT_SECRET = "testsecret";
    adminToken = jwt.sign(
      { userId: "admin123", role: "admin" },
      process.env.JWT_SECRET
    );
    memberToken = jwt.sign(
      { userId: "member123", role: "member" },
      process.env.JWT_SECRET
    );
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // fake socket.io object
    ioMock = { emit: sinon.spy() };
    app.set("io", ioMock);

    app.use("/api/admin", adminRoutes);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should reject non-admin with 403 on /users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal("Admin only");
  });

  it("GET /api/admin/users should return list of users for admin", async () => {
    // User.find().select(...)
    const selectStub = sinon.stub().resolves([
      { _id: "1", name: "Alice", email: "alice@test.com", role: "member" },
      { _id: "2", name: "Bob", email: "bob@test.com", role: "admin" },
    ]);
    sinon.stub(User, "find").returns({ select: selectStub });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body).to.have.length(2);
    expect(res.body[0].email).to.equal("alice@test.com");
  });

  it("POST /api/admin/users should create user and emit event", async () => {
    // no existing user with this email
    sinon.stub(User, "findOne").resolves(null);

    const createStub = sinon.stub(User, "create").resolves({
      _id: "new123",
      name: "New User",
      email: "new@example.com",
      role: "member",
    });

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New User",
        email: "new@example.com",
        password: "Password123",
        role: "member",
      });

    expect(res.status).to.equal(201);
    expect(createStub.calledOnce).to.be.true;
    expect(ioMock.emit.calledOnce).to.be.true;
    expect(ioMock.emit.firstCall.args[0]).to.equal("user:created");
    expect(res.body).to.include({
      id: "new123",
      name: "New User",
      email: "new@example.com",
      role: "member",
    });
  });

  it("DELETE /api/admin/users/:id should prevent admin deleting themselves", async () => {
    const res = await request(app)
      .delete("/api/admin/users/admin123")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Admins cannot delete themselves");
  });

  it("DELETE /api/admin/users/:id should delete other user and emit event", async () => {
    const deleteStub = sinon
      .stub(User, "findByIdAndDelete")
      .resolves({ _id: "user999" });

    const res = await request(app)
      .delete("/api/admin/users/user999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(deleteStub.calledOnce).to.be.true;
    expect(ioMock.emit.calledOnce).to.be.true;
    expect(ioMock.emit.firstCall.args[0]).to.equal("user:deleted");
    expect(ioMock.emit.firstCall.args[1]).to.deep.equal({ userId: "user999" });
    expect(res.body.message).to.equal("User deleted");
  });
});
