const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "logs" }
);

module.exports = mongoose.model("Log", LogSchema);
