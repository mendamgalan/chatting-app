const express = require("express");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    let message = await Message.create({
      conversation: conversationId,
      sender: req.userId,
      content
    });

    message = await Message.findById(message._id)
      .populate("sender", "username");

    const conversation = await Conversation.findById(conversationId);
    const receiverId = conversation?.participants
      .find((participant) => participant.toString() !== req.userId);

    const receiverSocketId = req.app.locals.onlineUsers?.get(
      receiverId?.toString()
    );

    if (receiverSocketId) {
      req.app.locals.io?.to(receiverSocketId).emit(
        "receive-message",
        message
      );
    }

    res.status(201).json(message);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.get("/:conversationId", auth, async (req, res) => {
  try {

    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .populate("sender", "username")
    .sort({ createdAt: 1 });

    res.json(messages);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;