import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:82";

export const socket = io(URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
