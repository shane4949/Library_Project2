const mongoose = require("mongoose");

async function connectDB(uri = process.env.MONGODB_URI) {
  try {
    await mongoose.connect(uri, {
      dbName: process.env.DB_NAME,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB error", err);
    throw err;
  }
}

module.exports = connectDB;
