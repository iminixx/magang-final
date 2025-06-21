const mongoose = require("mongoose");
const Log = require("../models/Log");

const logActivity = async (userId, action, description) => {
  try {
    const logData = { action, description };

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      logData.userId = userId;
    }

    const log = new Log(logData);
    await log.save();
  } catch (error) {
    console.error("Gagal mencatat log:", error);
  }
};

module.exports = logActivity;
