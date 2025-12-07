const { expect } = require("chai");
const { hashPassword, comparePassword } = require("../utils/authUtils");

describe("Password Utils (Mocha + Chai)", () => {
  it("hashPassword() should return a hashed string", async () => {
    const password = "TestPassword123!";
    const hash = await hashPassword(password);

    expect(hash).to.be.a("string");
    expect(hash).to.not.equal(password);
    expect(hash.length).to.be.greaterThan(20);
  });

  it("comparePassword() should return true for correct password", async () => {
    const password = "Correct123!";
    const hash = await hashPassword(password);

    const result = await comparePassword(password, hash);
    expect(result).to.equal(true);
  });

  it("comparePassword() should return false for wrong password", async () => {
    const hash = await hashPassword("Correct123!");

    const result = await comparePassword("WrongPassword", hash);
    expect(result).to.equal(false);
  });
});
