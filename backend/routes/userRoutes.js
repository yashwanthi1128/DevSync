const express = require("express");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// GET profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, bio, github, skills } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, github, skills },
      { new: true }         // return updated doc
    ).select("-password");

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;