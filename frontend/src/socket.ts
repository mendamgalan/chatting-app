import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL);

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket error:", err);
});

export default socket;