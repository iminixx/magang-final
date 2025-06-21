const Barang = require("../models/Barang");
const logActivity = require("../utils/logActivity");
const { getNextSequence, peekNextSequence } = require("../utils/getNextCode");

const getAllBarang = async (req, res) => {
  try {
    const { jurusan, tipe, nama, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (jurusan) filter.jurusan = jurusan;
    if (tipe) filter.tipe = tipe;
    if (nama) filter.nama = new RegExp(nama, "i");
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const barangList = await Barang.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    const total = await Barang.countDocuments(filter);

    const results = barangList.map((b) => {
      if (b.tipe === "tidak_habis_pakai") {
        const totalUnits = Array.isArray(b.units) ? b.units.length : 0;
        const tersediaCount = Array.isArray(b.units)
          ? b.units.filter((u) => u.status === "tersedia").length
          : 0;
        return {
          ...b,
          totalUnits,
          unitTersedia: tersediaCount,
        };
      }
      return b;
    });

    res.json({
      data: results,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("getAllBarang:", err);
    res.status(500).json({ message: err.message });
  }
};

const addBarang = async (req, res) => {
  const session = await Barang.startSession();
  session.startTransaction();
  try {
    const {
      nama,
      jurusan,
      tipe,
      stok,
      units,
      maxDurasiPinjam,
      deskripsi,
      status,
    } = req.body;

    // buat key counter
    const abrevNama = nama
      .trim()
      .replace(/\s+/g, "-")
      .toUpperCase()
      .slice(0, 3);
    const keyCounter = `${jurusan}-${abrevNama}`;

    // generate kode barang atau units di backend
    if (tipe === "habis_pakai") {
      // generate kode utama barang
      const seqNum = await getNextSequence(keyCounter);
      const strSeq = String(seqNum).padStart(3, "000");
      req.body.kode = `${jurusan}-${abrevNama}-${strSeq}`;
    } else if (Array.isArray(units)) {
      // generate kode untuk setiap unit tanpa kode
      const newUnits = [];
      for (let u of units) {
        if (u.kode && u.kode.trim()) {
          newUnits.push(u);
        } else {
          const seqNum = await getNextSequence(keyCounter);
          const strSeq = String(seqNum).padStart(3, "000");
          newUnits.push({ kode: strSeq, status: u.status });
        }
      }
      req.body.units = newUnits;
    }

    // payload dan simpan...
    // (lajur payload sama seperti sebelumnya)

    const newBarang = new Barang(req.body);
    const saved = await newBarang.save({ session });

    await logActivity(
      "system",
      "Tambah Barang",
      `Menambahkan barang '${saved.nama}' (ID: ${saved._id})`
    );

    await session.commitTransaction();
    res.status(201).json(saved);
  } catch (err) {
    await session.abortTransaction();
    console.error("addBarang:", err);
    res.status(400).json({ message: err.message, errors: err.errors });
  } finally {
    session.endSession();
  }
};

const updateBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama,
      jurusan,
      tipe,
      stok,
      units,
      maxDurasiPinjam,
      deskripsi,
      status,
    } = req.body;

    const existing = await Barang.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    const updateData = {
      nama,
      jurusan,
      tipe,
      deskripsi,
      maxDurasiPinjam,
      status: status || existing.status || "tersedia",
    };

    if (tipe === "habis_pakai") {
      updateData.stok = stok !== undefined ? stok : existing.stok || 0;
      updateData.units = undefined;
      if (existing.tipe === "tidak_habis_pakai") {
        updateData.stok_dipinjam = 0;
      }
    } else {
      updateData.units = Array.isArray(units) ? units : existing.units || [];
      updateData.stok = undefined;
      updateData.stok_dipinjam = undefined;
    }

    const updated = await Barang.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    await logActivity(
      "system",
      "Update Barang",
      `Mengubah barang '${updated.nama}' (ID: ${updated._id})`
    );

    res.json(updated);
  } catch (err) {
    console.error("updateBarang:", err);
    res.status(400).json({ message: err.message, errors: err.errors });
  }
};

const deleteBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Barang.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    await logActivity(
      "system",
      "Hapus Barang",
      `Menghapus barang '${deleted.nama}' (ID: ${deleted._id})`
    );

    res.json({ message: "Barang berhasil dihapus" });
  } catch (err) {
    console.error("deleteBarang:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const searchBarang = async (req, res) => {
  try {
    const { jurusan, tipe, nama, status } = req.query;
    const filter = {};
    if (jurusan) filter.jurusan = jurusan;
    if (tipe) filter.tipe = tipe;
    if (nama) filter.nama = new RegExp(nama, "i");
    if (status) filter.status = status;

    const result = await Barang.find(filter).lean();
    const refined = result.map((b) => {
      if (b.tipe === "tidak_habis_pakai") {
        return {
          _id: b._id,
          nama: b.nama,
          jurusan: b.jurusan,
          units: Array.isArray(b.units)
            ? b.units.filter((u) => u.status === "tersedia")
            : [],
        };
      }
      return b;
    });

    await logActivity(
      "system",
      "Search Barang",
      `Mencari barang (filter: ${JSON.stringify(filter)})`
    );

    res.json(refined);
  } catch (err) {
    console.error("searchBarang:", err);
    res.status(500).json({ message: err.message });
  }
};

const getNextKodeUnit = async (req, res) => {
  try {
    const { jurusan, nama } = req.query;
    if (!jurusan || !nama) {
      return res
        .status(400)
        .json({ message: "Parameter jurusan dan nama wajib diisi" });
    }

    const abrevNama = nama
      .trim()
      .replace(/\s+/g, "-")
      .toUpperCase()
      .slice(0, 3);
    const keyCounter = `${jurusan}-${abrevNama}`;
    const seqNum = await peekNextSequence(keyCounter);
    const strSeq = String(seqNum).padStart(3, "000");
    const kodeFull = `${jurusan}-${abrevNama}-${strSeq}`;

    return res.json({ kode: kodeFull });
  } catch (err) {
    console.error("getNextKodeUnit:", err);
    return res.status(500).json({ message: err.message });
  }
};

const postNextKodeUnit = async (req, res) => {
  try {
    const { key, count } = req.body;
    const allocateCount = parseInt(count) || 1;
    // Batch allocate
    const startSeq = await getNextSequence(key); // first increment
    let codes = [startSeq];
    // kalau count > 1, lanjutkan
    for (let i = 1; i < allocateCount; i++) {
      const next = await getNextSequence(key);
      codes.push(next);
    }
    const formatted = codes.map((seq) => String(seq).padStart(3, "000"));
    return res.json({ seq: codes, formatted });
  } catch (err) {
    console.error("postNextKodeUnit:", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllBarang,
  addBarang,
  updateBarang,
  deleteBarang,
  searchBarang,
  getNextKodeUnit,
  postNextKodeUnit,
};
