const express = require("express");
const {
  login,
  refreshToken,
  logout,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/_test", (req, res) => {
  res.status(200).json({
    message: "Auth route is working",
    timestamp: new Date().toISOString(),
  });
});

router.post("/login", async (req, res) => {
  try {
    await login(req, res);
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    await refreshToken(req, res);
  } catch (error) {
    console.error("Refresh token route error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/logout", verifyToken, async (req, res) => {
  try {
    await logout(req, res);
  } catch (error) {
    console.error("Logout route error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/verify", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Profile route error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
