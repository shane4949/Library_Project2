// models/Loan.js
const { Schema, model, Types } = require("mongoose");

const loanSchema = new Schema(
  {
    bookId: { type: Types.ObjectId, ref: "Book", required: true, index: true },
    memberId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    loanDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true }, // e.g. +14 days
    returnedDate: { type: Date, default: null },
  },
  { timestamps: true }
);

loanSchema.index({ memberId: 1, returnedDate: 1 }); // active loans by user
loanSchema.index({ bookId: 1, returnedDate: 1 });   // who has a title

module.exports = model("Loan", loanSchema);
