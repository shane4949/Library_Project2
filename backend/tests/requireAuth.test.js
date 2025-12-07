const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/auth");

describe("requireAuth middleware", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "testsecret";
  });

  function mockRes() {
    return {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  }

  it("should return 401 if no token is provided", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = sinon.spy();

    requireAuth(req, res, next);

    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledWith({ message: "Missing token" })).to.be.true;
    expect(next.called).to.be.false;
  });

  it("should return 401 for invalid token", () => {
    const req = { headers: { authorization: "Bearer invalid.token" } };
    const res = mockRes();
    const next = sinon.spy();

    requireAuth(req, res, next);

    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledWith({ message: "Invalid/expired token" })).to.be.true;
  });

  it("should call next() for valid token", () => {
    const token = jwt.sign({ userId: "123", role: "user" }, process.env.JWT_SECRET);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = sinon.spy();

    requireAuth(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(req.user.userId).to.equal("123");
  });
});
