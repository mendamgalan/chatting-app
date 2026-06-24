require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);

const onlineUsers = new Map();

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.locals.io = io;
app.locals.onlineUsers = onlineUsers;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register-user", (userId) => {
    console.log("REGISTER EVENT RECEIVED:", userId);

    onlineUsers.set(userId, socket.id);

    console.log("User registered:", userId);
  });

  socket.on("send-message", (data) => {
    console.log("SEND MESSAGE:", data);

    const { receiverId, message } = data;

    const receiverSocketId =
      onlineUsers.get(receiverId);

    console.log(
      "Receiver Socket:",
      receiverSocketId
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "receive-message",
        message
      );

      console.log("MESSAGE DELIVERED");
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});