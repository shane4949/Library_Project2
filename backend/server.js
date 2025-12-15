// server.js
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");

// Only connect DB & start server if NOT testing
if (process.env.NODE_ENV !== "test") {
  startServer();
}

async function startServer() {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:81", "http://localhost:5173"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }
  });

  app.set("io", io);

  let online = 0;

  io.on("connection", socket => {
    online++;
    io.emit("presence", { online });

    socket.on("disconnect", () => {
      online--;
      io.emit("presence", { online });
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
}

module.exports = startServer;
