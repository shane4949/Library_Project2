// routes/books.js (public endpoints)
const express = require("express");
const Book = require("../models/Book");
const router = express.Router();

// GET /api/books?search=foo
router.get("/", async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query = { $text: { $search: search } };
  const books = await Book.find(query).sort({ createdAt: -1 });
  res.json(books);
});

// GET /api/books/:id
router.get("/:id", async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Not found" });
  res.json(book);
});

module.exports = router;
