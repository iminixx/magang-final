const mongoose = require("mongoose");

const UnitSchema = new mongoose.Schema({
  kode: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["tersedia", "dipinjam", "rusak", "hilang"],
    default: "tersedia",
  },
});

const BarangSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
    },
    jurusan: {
      type: String,
      enum: ["RPL", "DKV", "TKJ"],
      required: true,
    },
    tipe: {
      type: String,
      enum: ["habis_pakai", "tidak_habis_pakai"],
      required: true,
    },

    stok: {
      type: Number,
      required: function () {
        return this.tipe === "habis_pakai";
      },
      min: [0, "Stok tidak boleh negatif"],
    },

    status: {
      type: String,
      enum: ["tersedia", "rusak", "hilang"],
      default: "tersedia",
    },

    units: {
      type: [UnitSchema],
      required: function () {
        return this.tipe === "tidak_habis_pakai";
      },
      validate: {
        validator: function (arr) {
          if (!arr || arr.length === 0) return false;
          const kodeSet = new Set(arr.map((u) => u.kode));
          return kodeSet.size === arr.length;
        },
        message: "Units harus array non-kosong, setiap kode unik",
      },
      default: undefined,
    },
    stok_dipinjam: {
      type: Number,
      default: 0,
    },
    maxDurasiPinjam: {
      type: Number,
      min: [1, "Max durasi pinjam harus ≥ 1 hari"],
    },
    deskripsi: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, collection: "barang" }
);

module.exports = mongoose.model("Barang", BarangSchema);
