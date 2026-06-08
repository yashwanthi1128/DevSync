const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "devsync_secret_key";

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name, email,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "collaborator", // FIX: was "owner"
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true, token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, bio: user.bio, skills: user.skills, github: user.github,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET is missing");
      return res.status(500).json({ 
        success: false, 
        message: "Server config error" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid Email or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid Email or Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // 2. Set cookie for mobile + Render
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,       // Required for https on Render
      sameSite: "none",   // Required for cross-site requests on mobile
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true, 
      token,
      user: {
        _id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role, 
        bio: user.bio, 
        skills: user.skills, 
        github: user.github,
      },
    });
  } catch (error) {
    console.log("Login error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser };