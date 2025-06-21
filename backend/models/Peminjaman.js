const mongoose = require("mongoose");

const PeminjamanSchema = new mongoose.Schema(
  {
    barang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barang",
      required: true,
    },

    jurusan: {
      type: String,
      required: true,
      trim: true,
    },

    peminjamType: {
      type: String,
      enum: ["siswa", "lainnya"],
      required: true,
    },

    peminjamSiswa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Siswa",
      required: function () {
        return this.peminjamType === "siswa";
      },
    },

    peminjamNama: {
      type: String,
      required: function () {
        return this.peminjamType === "lainnya";
      },
    },
    peminjamAsal: {
      type: String,
      required: function () {
        return this.peminjamType === "lainnya";
      },
    },

    peminjamPhone: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rentalStatus: {
      type: String,
      enum: ["pinjam", "kembali"],
      default: "pinjam",
    },

    isConsumable: {
      type: Boolean,
      required: true,
      default: false,
    },

    jumlah: {
      type: Number,
      required: function () {
        return this.isConsumable === true;
      },
      min: [1, "Jumlah harus minimal 1"],
    },

    unitKodes: {
      type: [String],
      required: function () {
        return this.isConsumable === false;
      },
      default: undefined,
      validate: {
        validator: function (arr) {
          if (!arr) return true;
          const uniqueSet = new Set(arr);
          return arr.length > 0 && uniqueSet.size === arr.length;
        },
        message:
          "unitKodes harus berisi minimal satu kode unik (array of strings)",
      },
    },

    tglPinjam: {
      type: Date,
      default: Date.now,
    },

    tglKembali: {
      type: Date,
    },

    keterangan: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Peminjaman", PeminjamanSchema);
