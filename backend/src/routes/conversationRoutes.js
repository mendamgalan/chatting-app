const express = require("express");
const Conversation = require("../models/Conversation");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { participantId } = req.body;

    const conversation = await Conversation.create({
      participants: [
        req.userId,
        participantId
      ]
    });

    res.status(201).json(conversation);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    }).populate("participants", "username email");

    res.json(conversations);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;