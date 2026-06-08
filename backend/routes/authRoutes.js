const express = require("express");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const router = express.Router();

// REGISTER USER
router.post("/register", registerUser);

// LOGIN USER
router.post("/login", loginUser);

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth Route Working",
  });
});

module.exports = router;