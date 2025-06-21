const Siswa = require("../models/Siswa");
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ambil semua siswa
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
      .select("nama jurusan kelas")
      .limit(50);
    return res.json({ data });
  } catch (err) {
    console.error("Error di getByJurusanKelas Siswa:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// create siswa
exports.create = async (req, res) => {
  try {
    const { nama, jurusan, kelas } = req.body;
    if (!nama || !jurusan || !kelas) {
      return res.status(400).json({ message: "Field tidak lengkap" });
    }

    const siswa = new Siswa({
      nama,
      jurusan,
      kelas,
      pin: generatePin(),
    });

    await siswa.save();
    res.status(201).json({ message: "Siswa ditambahkan", data: siswa });
  } catch (err) {
    console.error("Error create siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// update siswa
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, jurusan, kelas } = req.body;

    const siswa = await Siswa.findById(id);
    if (!siswa)
      return res.status(404).json({ message: "Siswa tidak ditemukan" });

    siswa.nama = nama || siswa.nama;
    siswa.jurusan = jurusan || siswa.jurusan;
    siswa.kelas = kelas || siswa.kelas;

    await siswa.save();
    res.json({ message: "Siswa diupdate", data: siswa });
  } catch (err) {
    console.error("Error update siswa:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// delete siswa
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

// validasi PIN siswa
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
