// routes/users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const router = express.Router();

/* ==== SELF (any logged-in user) ==== */

// GET /api/users/me  → current profile
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("name email role createdAt");
  res.json(user);
});

// PUT /api/users/me  → update name/email
router.put("/me", requireAuth, async (req, res) => {
  const { name, email } = req.body;
  // optional: prevent email clash
  if (email) {
    const exists = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (exists) return res.status(400).json({ message: "Email already in use" });
  }
  const updated = await User.findByIdAndUpdate(
    req.user.userId,
    { ...(name && { name }), ...(email && { email }) },
    { new: true, runValidators: true, select: "name email role" }
  );
  res.json(updated);
});

// PUT /api/users/me/password  → change password (verify old)
router.put("/me/password", requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: "Missing fields" });

  const user = await User.findById(req.user.userId).select("passwordHash");
  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ message: "Old password incorrect" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password updated" });
});

/* ==== ADMIN (manage anyone) ==== */

// GET /api/users  → list users (basic fields)
router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await User.find().select("name email role createdAt");
  res.json(users);
});

// GET /api/users/:id  → user details
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).select("name email role createdAt");
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

// PUT /api/users/:id  → admin edit (name/email/role)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
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
  res.json(updated);
});

// PUT /api/users/:id/password  → admin reset password (no old required)
router.put("/:id/password", requireAuth, requireAdmin, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: "Missing newPassword" });
  const user = await User.findById(req.params.id).select("_id");
  if (!user) return res.status(404).json({ message: "Not found" });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password reset" });
});

module.exports = router;
