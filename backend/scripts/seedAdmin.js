// scripts/seedAdmin.js
require("dotenv").config()
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("../models/User")

;(async () => {
  try {
    const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com"
    const password = process.env.SEED_ADMIN_PASSWORD || "password"

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,
    })

    let user = await User.findOne({ email })

    if (user) {
      console.log("Admin already exists:", email)
    } else {
      const passwordHash = await bcrypt.hash(password, 10)

      await User.create({
        name: "Admin",
        email,
        passwordHash, // ✅ REQUIRED by your schema
        role: "admin",
      })

      console.log(`✅ Seeded admin ${email}`)
    }

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error("❌ Seed admin failed", err)
    process.exit(1)
  }
})()
