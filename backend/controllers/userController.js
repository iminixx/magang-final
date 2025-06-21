const User = require("../models/User.js");
const logActivity = require("../utils/logActivity");

const getAllUsers = async (req, res) => {
  try {
    const data = await User.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    const saved = await newUser.save();

    await logActivity(
      req.body.userId,
      "Tambah User",
      `Menambahkan user '${saved.username}'`
    );
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getAllUsers,
  addUser,
};
