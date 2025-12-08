// app.js
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const publicBookRoutes = require("./routes/books");
const loanRoutes = require("./routes/Loans");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/books", publicBookRoutes);
app.use("/api/Loans", loanRoutes);

app.get("/", (_req, res) => res.send("Library API is running"));

module.exports = app;
