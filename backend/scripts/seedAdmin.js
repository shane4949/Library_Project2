// scripts/seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

(async () => {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });

  let user = await User.findOne({ email });
  if (user) {
    console.log("Admin already exists:", email);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({ name: "Admin", email, passwordHash, role: "admin" });
    console.log(`✅ Seeded admin ${email} with password "${password}"`);
  }
  await mongoose.disconnect();
})();
