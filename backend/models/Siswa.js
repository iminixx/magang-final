const mongoose = require("mongoose");

const SiswaSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    jurusan: {
      type: String,
      enum: ["RPL", "DKV", "TKJ"],
      required: true,
    },
    kelas: {
      type: String,
      required: true,
    },
    pin: {
      type: String,
      required: false,
      length: 6,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Siswa", SiswaSchema);
