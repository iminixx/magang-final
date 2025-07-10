const Siswa = require("../models/Siswa");
const csv = require("csv-parser");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

exports.importCSV = [
  upload.single("file"),
  async (req, res) => {
    const results = [];
    try {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => {
          if (!data.nama || !data.jurusan || !data.kelas || !data.tanggal_lahir)
            return;

          results.push({
            nama: data.nama.trim(),
            jurusan: data.jurusan.trim().toUpperCase(),
            kelas: data.kelas.trim().toUpperCase(),
            pin: data.tanggal_lahir.trim(), // ganti dari generatePin()
          });
        })
        .on("end", async () => {
          await Siswa.insertMany(results);
          fs.unlinkSync(req.file.path);
          res.json({
            message: "Data siswa berhasil diimpor",
            count: results.length,
          });
        });
    } catch (err) {
      console.error("Import CSV error:", err);
      res.status(500).json({ message: "Gagal mengimpor CSV" });
    }
  },
];

exports.batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ID siswa tidak valid" });
    }

    const result = await Siswa.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `${result.deletedCount} siswa berhasil dihapus`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error batch delete siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.batchUpdate = async (req, res) => {
  try {
    const { ids, update } = req.body;

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !update ||
      typeof update !== "object"
    ) {
      return res.status(400).json({ message: "Data tidak valid" });
    }

    const result = await Siswa.updateMany(
      { _id: { $in: ids } },
      { $set: update }
    );

    res.json({
      message: `${result.modifiedCount} siswa berhasil diupdate`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error batch update siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await Siswa.find().sort({ nama: 1 });
    res.json({ data });
  } catch (err) {
    console.error("Error getAll siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getByJurusanKelas = async (req, res) => {
  try {
    const { jurusan, kelas, nama } = req.query;
    const filter = {};
    if (jurusan) filter.jurusan = jurusan;
    if (kelas) filter.kelas = kelas;
    if (nama) filter.nama = { $regex: nama, $options: "i" };

    const data = await Siswa.find(filter)
      .select("nama jurusan kelas pin")
      .limit(50);
    return res.json({ data });
  } catch (err) {
    console.error("Error di getByJurusanKelas Siswa:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { nama, jurusan, kelas, pin } = req.body; // pin diisi tanggal lahir dari input
    if (!nama || !jurusan || !kelas || !pin) {
      return res.status(400).json({ message: "Field tidak lengkap" });
    }

    const siswa = new Siswa({
      nama,
      jurusan,
      kelas,
      pin, // ini berisi tanggal lahir format DDMMYYYY
    });

    await siswa.save();
    res.status(201).json({ message: "Siswa ditambahkan", data: siswa });
  } catch (err) {
    console.error("Error create siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, jurusan, kelas, pin } = req.body;

    const siswa = await Siswa.findById(id);
    if (!siswa)
      return res.status(404).json({ message: "Siswa tidak ditemukan" });

    siswa.nama = nama ? nama.trim() : siswa.nama;
    siswa.jurusan = jurusan ? jurusan.trim().toUpperCase() : siswa.jurusan;
    siswa.kelas = kelas ? kelas.trim().toUpperCase() : siswa.kelas;
    if (pin) siswa.pin = pin;

    await siswa.save();
    res.json({ message: "Siswa diupdate", data: siswa });
  } catch (err) {
    console.error("Error update siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const siswa = await Siswa.findByIdAndDelete(id);
    if (!siswa)
      return res.status(404).json({ message: "Siswa tidak ditemukan" });

    res.json({ message: "Siswa dihapus" });
  } catch (err) {
    console.error("Error delete siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.validatePin = async (req, res) => {
  try {
    const { siswaId, pin } = req.body;
    const siswa = await Siswa.findById(siswaId);
    if (!siswa)
      return res.status(404).json({ message: "Siswa tidak ditemukan" });

    if (siswa.pin === pin) {
      return res.json({ valid: true, message: "PIN benar" });
    } else {
      return res.status(401).json({ valid: false, message: "PIN salah" });
    }
  } catch (err) {
    console.error("Error validate PIN siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};
