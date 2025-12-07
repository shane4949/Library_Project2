// routes/admin.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const User = require("../models/User");
const Book = require("../models/Book");

const router = express.Router();

// All admin routes require auth + admin
router.use(requireAuth, requireAdmin);

/* ===========================
   USERS
   =========================== */

// GET /api/admin/users -> list all users
router.get("/users", async (req, res) => {
  const users = await User.find().select("name email role createdAt");
  res.json(users);
});

// GET /api/admin/users/:id -> one user
router.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("name email role createdAt");
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

// POST /api/admin/users -> create user
router.post("/users", async (req, res) => {
  const io = req.app.get("io");

  const { name, email, password, role = "member" } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, role, passwordHash });

  io?.emit("user:created", {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

// PUT /api/admin/users/:id -> edit user (name/email/role)
router.put("/users/:id", async (req, res) => {
  const io = req.app.get("io");
  const { name, email, role } = req.body;

  if (email) {
    const exists = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (exists) return res.status(400).json({ message: "Email already in use" });
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { ...(name && { name }), ...(email && { email }), ...(role && { role }) },
    { new: true, runValidators: true, select: "name email role" }
  );
  if (!updated) return res.status(404).json({ message: "Not found" });

  io?.emit("user:updated", updated);
  res.json(updated);
});

// PUT /api/admin/users/:id/password -> reset password
router.put("/users/:id/password", async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: "Missing newPassword" });

  const user = await User.findById(req.params.id).select("_id");
  if (!user) return res.status(404).json({ message: "Not found" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password reset" });
});

// POST /api/admin/users/:id/promote -> promote to admin
router.post("/users/:id/promote", async (req, res) => {
  const io = req.app.get("io");
  const user = await User.findById(req.params.id).select("role name email");
  if (!user) return res.status(404).json({ message: "Not found" });
  if (user.role === "admin") return res.json({ message: "Already admin" });

  user.role = "admin";
  await user.save();

  io?.emit("user:promoted", {
    id: user._id,
    name: user.name,
    email: user.email,
    newRole: user.role,
  });

  res.json({ message: "User promoted to admin" });
});

// DELETE /api/admin/users/:id -> delete user
router.delete("/users/:id", async (req, res) => {
  const io = req.app.get("io");

  if (req.params.id === req.user.userId) {
    return res.status(400).json({ message: "Admins cannot delete themselves" });
  }

  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Not found" });

  io?.emit("user:deleted", { userId: req.params.id });
  res.json({ message: "User deleted" });
});

/* ===========================
   BOOKS
   =========================== */

// GET /api/admin/books -> list all books (admin view)
router.get("/books", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json(books);
});

// GET /api/admin/books/:id -> one book
router.get("/books/:id", async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Not found" });
  res.json(book);
});

// POST /api/admin/books -> add new book
router.post("/books", async (req, res) => {
  const io = req.app.get("io");

  const {
    title, author, isbn,
    categories = [],
    copiesTotal = 1,
    coverImageUrl,
    description
  } = req.body;

  if (!title || !author || !isbn)
    return res.status(400).json({ message: "Missing fields" });

  const exists = await Book.findOne({ isbn });
  if (exists) return res.status(400).json({ message: "ISBN already exists" });

  const book = await Book.create({
    title,
    author,
    isbn,
    categories,
    copiesTotal,
    copiesAvailable: copiesTotal,
    coverImageUrl,
    description,
  });

  io?.emit("book:created", book);
  res.status(201).json(book);
});

// PUT /api/admin/books/:id -> edit book
router.put("/books/:id", async (req, res) => {
  const io = req.app.get("io");
  const update = req.body;

  if (update.isbn) {
    const exists = await Book.findOne({
      isbn: update.isbn,
      _id: { $ne: req.params.id },
    });
    if (exists) return res.status(400).json({ message: "ISBN already exists" });
  }

  if (
    update.copiesAvailable != null &&
    update.copiesTotal != null &&
    update.copiesAvailable > update.copiesTotal
  ) {
    return res.status(400).json({ message: "copiesAvailable cannot exceed copiesTotal" });
  }

  const book = await Book.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!book) return res.status(404).json({ message: "Not found" });

  io?.emit("book:updated", book);
  res.json(book);
});

// DELETE /api/admin/books/:id -> delete book
router.delete("/books/:id", async (req, res) => {
  const io = req.app.get("io");

  const deleted = await Book.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Not found" });

  io?.emit("book:deleted", { bookId: req.params.id });
  res.json({ message: "Book deleted" });
});

module.exports = router;
