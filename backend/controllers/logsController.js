const mongoose = require("mongoose");
const Log = require("../models/Log");

const getLogs = async (req, res) => {
  try {
    const { startDate, endDate, userId, action } = req.query;
    const filter = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }

    if (action) {
      filter.action = action;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    const data = await Log.find(filter)
      .sort({ timestamp: -1 })
      .populate("userId", "nama email")
      .lean();

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Error getLogs:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addLog = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { action, description } = req.body;
    if (!action) {
      return res.status(400).json({ message: "Field 'action' is required" });
    }

    const newLog = new Log({
      userId,
      action,
      description,
      timestamp: new Date(),
    });
    const saved = await newLog.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Error addLog:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getLogs, addLog };
