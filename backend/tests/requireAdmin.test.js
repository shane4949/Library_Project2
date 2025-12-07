const { expect } = require("chai");
const sinon = require("sinon");
const { requireAdmin } = require("../middleware/auth");

describe("requireAdmin middleware", () => {
  function mockRes() {
    return {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  }

  it("should return 403 if user is not admin", () => {
    const req = { user: { role: "user" } };
    const res = mockRes();
    const next = sinon.spy();

    requireAdmin(req, res, next);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ message: "Admin only" })).to.be.true;
  });

  it("should allow admin users", () => {
    const req = { user: { role: "admin" } };
    const res = mockRes();
    const next = sinon.spy();

    requireAdmin(req, res, next);

    expect(next.calledOnce).to.be.true;
  });
});
