const mongoose = require("mongoose");

async function connectDB(uri) {
  const dbUri =
    uri ??
    (process.env.NODE_ENV === "test"
      ? process.env.MONGODB_TEST_URI
      : process.env.MONGODB_URI);

  if (!dbUri) {
    throw new Error("MongoDB URI not defined");
  }

  await mongoose.connect(dbUri);
  console.log("MongoDB connected to:", dbUri);
}

module.exports = connectDB;
