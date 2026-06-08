const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ← adjust path to your User model

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // 1. Use.env instead of hardcoded string
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 2. Attach full user from DB, exclude password
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({
      success: false,
      message: "Token failed",
    });
  }
};

module.exports = protect;