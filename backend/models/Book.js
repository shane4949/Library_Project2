// models/Book.js
const { Schema, model } = require("mongoose");

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    author: { type: String, required: true, trim: true, index: true },

    // Keep ISBN unique (string so we don't lose leading zeroes)
    isbn: { type: String, required: true, unique: true, trim: true },

    // Optional metadata
    categories: [{ type: String, trim: true }],
    description: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },

    // Inventory
    copiesTotal: { type: Number, required: true, min: 0 },
    copiesAvailable: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Text search over common fields
bookSchema.index({ title: "text", author: "text", categories: "text" });

// Ensure copiesAvailable <= copiesTotal and default available == total on create
bookSchema.pre("validate", function (next) {
  if (this.isNew && (this.copiesAvailable === undefined || this.copiesAvailable === null)) {
    this.copiesAvailable = this.copiesTotal;
  }
  if (this.copiesAvailable > this.copiesTotal) {
    return next(new Error("copiesAvailable cannot exceed copiesTotal"));
  }
  next();
});

module.exports = model("Book", bookSchema);
