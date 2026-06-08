const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token missing",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user without password
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user;
      return next();

    } catch (error) {
      console.error("Auth error:", error.name, error.message);

      let message = "Not authorized";
      if (error.name === "TokenExpiredError") message = "Token expired";
      if (error.name === "JsonWebTokenError") message = "Invalid token";

      return res.status(401).json({
        success: false,
        message,
      });
    }
  }

  // No "Bearer" header at all
  return res.status(401).json({
    success: false,
    message: "Not authorized, no token",
  });
};

module.exports = protect;