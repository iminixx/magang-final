const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getLogs, addLog } = require("../controllers/logsController");

router.get("/", verifyToken, getLogs);
router.post("/", verifyToken, addLog);

module.exports = router;
