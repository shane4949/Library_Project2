// routes/loans.js
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Book = require("../models/Book");
const Loan = require("../models/Loan");
const router = express.Router();

router.use(requireAuth);

// GET /api/loans/my ...
router.get("/my", async (req, res) => {
  const memberId = req.user.userId;
  const loans = await Loan.find({ memberId })
    .sort({ returnedDate: 1, createdAt: -1 })
    .populate("bookId", "title"); // helpful for UI
  res.json(loans);
});

// POST /api/loans/borrow
router.post("/borrow", async (req, res) => {
  const io = req.app.get("io");
  const memberId = req.user.userId;
  const { bookId } = req.body;
  if (!bookId) return res.status(400).json({ message: "Missing bookId" });

  const existing = await Loan.findOne({ memberId, bookId, returnedDate: null });
  if (existing) return res.status(400).json({ message: "You already borrowed this book" });

  const book = await Book.findOneAndUpdate(
    { _id: bookId, copiesAvailable: { $gt: 0 } },
    { $inc: { copiesAvailable: -1 } },
    { new: true }
  );
  if (!book) return res.status(400).json({ message: "No copies available" });

  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  const loan = await Loan.create({
    bookId,
    memberId,
    loanDate: new Date(),
    dueDate: new Date(Date.now() + twoWeeks),
  });

  // 🔊 notify all clients about new availability for this book
  io.emit("book:availability", { bookId: book._id.toString(), copiesAvailable: book.copiesAvailable });

  res.status(201).json({ message: "Borrowed", loan, book });
});

// PUT /api/loans/:id/return
router.put("/:id/return", async (req, res) => {
  const io = req.app.get("io");
  const memberId = req.user.userId;

  const loan = await Loan.findOne({ _id: req.params.id, memberId, returnedDate: null });
  if (!loan) return res.status(404).json({ message: "Active loan not found" });

  loan.returnedDate = new Date();
  await loan.save();

  const book = await Book.findByIdAndUpdate(loan.bookId, { $inc: { copiesAvailable: 1 } }, { new: true });

  // 🔊 notify all clients
  io.emit("book:availability", { bookId: loan.bookId.toString(), copiesAvailable: book.copiesAvailable });

  res.json({ message: "Returned", loanId: loan._id });
});

module.exports = router;
