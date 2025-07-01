const Barang = require("../models/Barang");
const Peminjaman = require("../models/Peminjaman");

/**
 * Utility function untuk menghitung ulang stok_dipinjam dan unitTersedia
 * berdasarkan status unit di dalam barang.units[].
 */
async function recalcStokNonConsumable(barang) {
  const dipinjamCount = barang.units.filter(
    (u) => u.status === "dipinjam"
  ).length;

  barang.stok_dipinjam = dipinjamCount;

  barang.unitTersedia = barang.totalUnits - dipinjamCount;

  await barang.save();
}

exports.getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      peminjamNama,
      peminjamType,
      status,
    } = req.query;
    const filter = {};

    if (peminjamNama) {
      filter.peminjamNama = { $regex: peminjamNama, $options: "i" };
    }
    if (peminjamType) {
      filter.peminjamType = peminjamType;
    }
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Peminjaman.countDocuments(filter);

    const data = await Peminjaman.find(filter)
      .sort({ tglPinjam: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "barang",
        select: "nama tipe jurusan maxDurasiPinjam",
      })
      .populate({
        path: "peminjamSiswa",
        select: "nama jurusan kelas",
      })
      .lean();

    return res.json({
      data,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error di getAll Peminjaman:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      barang: barangId,
      peminjamType,
      peminjamSiswa,
      peminjamNama,
      peminjamAsal,
      peminjamPhone,
      isConsumable,
      jumlah,
      unitKodes,
      keterangan,
    } = req.body;

    if (
      !barangId ||
      !peminjamType ||
      isConsumable === undefined ||
      !peminjamPhone
    ) {
      return res.status(400).json({
        message:
          "Field barang, peminjamType, isConsumable, dan peminjamPhone wajib diisi",
      });
    }

    if (peminjamType === "siswa") {
      if (!peminjamSiswa) {
        return res.status(400).json({
          message:
            "Field peminjamSiswa wajib diisi jika peminjamType = 'siswa'",
        });
      }
    } else {
      if (!peminjamNama || !peminjamAsal) {
        return res.status(400).json({
          message:
            "Field peminjamNama dan peminjamAsal wajib diisi jika peminjamType = 'lainnya'",
        });
      }
    }

    if (isConsumable) {
      if (jumlah === undefined || typeof jumlah !== "number" || jumlah < 1) {
        return res.status(400).json({
          message: "Jumlah (Number ≥1) wajib diisi jika isConsumable = true",
        });
      }
    } else {
      if (!Array.isArray(unitKodes) || unitKodes.length < 1) {
        return res.status(400).json({
          message:
            "unitKodes (array of String) wajib diisi jika isConsumable = false",
        });
      }
      const uniqueSet = new Set(unitKodes);
      if (uniqueSet.size !== unitKodes.length) {
        return res.status(400).json({
          message: "unitKodes harus berisi kode unik, tidak boleh duplikat",
        });
      }
    }

    const barang = await Barang.findById(barangId);
    if (!barang) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    if (isConsumable && barang.tipe !== "habis_pakai") {
      return res.status(400).json({
        message: "Barang bukan tipe habis_pakai, tidak bisa konsumsi stok",
      });
    }
    if (!isConsumable && barang.tipe !== "tidak_habis_pakai") {
      return res.status(400).json({
        message: "Barang bukan tipe tidak_habis_pakai, tidak bisa pinjam unit",
      });
    }

    if (isConsumable) {
      if (barang.stok < jumlah) {
        return res
          .status(400)
          .json({ message: "Stok habis-pakai tidak cukup" });
      }
    } else {
      const availableUnits = barang.units
        .filter((u) => u.status === "tersedia")
        .map((u) => u.kode);

      for (const kode of unitKodes) {
        if (!availableUnits.includes(kode)) {
          return res
            .status(400)
            .json({ message: `Unit dengan kode '${kode}' tidak tersedia` });
        }
      }
    }

    const newLoan = new Peminjaman({
      barang: barangId,
      jurusan: barang.jurusan,
      peminjamType,
      peminjamSiswa: peminjamType === "siswa" ? peminjamSiswa : undefined,
      peminjamNama: peminjamType === "lainnya" ? peminjamNama : undefined,
      peminjamAsal: peminjamType === "lainnya" ? peminjamAsal : undefined,
      peminjamPhone,
      isConsumable,
      jumlah: isConsumable ? jumlah : undefined,
      unitKodes: !isConsumable ? unitKodes : undefined,
      keterangan,

      rentalStatus: isConsumable ? "kembali" : "pinjam", // [MODIFIKASI]
      tglPinjam: isConsumable ? new Date() : undefined, // [MODIFIKASI]
      tglKembali: isConsumable ? new Date() : undefined, // [MODIFIKASI]
    });

    await newLoan.save();

    return res.status(201).json({ data: newLoan });
  } catch (err) {
    console.error("Error di create Peminjaman:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.approve = async (req, res) => {
  const { id } = req.params;
  try {
    const loan = await Peminjaman.findById(id);
    if (!loan) {
      return res.status(404).json({ message: "Peminjaman tidak ditemukan" });
    }
    if (loan.status !== "pending") {
      return res.status(400).json({ message: "Peminjaman sudah diproses" });
    }

    const barang = await Barang.findById(loan.barang);
    if (!barang) {
      return res
        .status(404)
        .json({ message: "Barang terkait tidak ditemukan" });
    }

    if (loan.isConsumable) {
      if (barang.stok < loan.jumlah) {
        return res
          .status(400)
          .json({ message: "Stok habis-pakai tidak cukup" });
      }
      barang.stok -= loan.jumlah;
      await barang.save();
    } else {
      const unitStatusArr = [];

      for (const kode of loan.unitKodes) {
        const idx = barang.units.findIndex((u) => u.kode === kode);
        if (idx === -1 || barang.units[idx].status !== "tersedia") {
          return res
            .status(400)
            .json({ message: `Unit '${kode}' tidak tersedia` });
        }

        const statusAwal = barang.units[idx].status; // ✅ ambil status sebelum diubah
        barang.units[idx].status = "dipinjam";

        unitStatusArr.push({
          kode,
          statusSaatPinjam: statusAwal, // simpan kondisi asli: bisa "tersedia", "rusak", dll
        });
      }

      loan.unitStatus = unitStatusArr;
      await recalcStokNonConsumable(barang);
    }

    loan.status = "approved";
    loan.tglPinjam = new Date();
    await loan.save();

    return res.json({ data: loan });
  } catch (err) {
    console.error("Error di approve Peminjaman:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/peminjaman/reject/:id
 * Reject peminjaman: status → "rejected"
 */
exports.reject = async (req, res) => {
  const { id } = req.params;
  try {
    const loan = await Peminjaman.findById(id);
    if (!loan) {
      return res.status(404).json({ message: "Peminjaman tidak ditemukan" });
    }
    if (loan.status !== "pending") {
      return res.status(400).json({ message: "Peminjaman sudah diproses" });
    }

    loan.status = "rejected";
    await loan.save();
    return res.json({ data: loan });
  } catch (err) {
    console.error("Error di reject Peminjaman:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/peminjaman/:id/return
 * Return item:
 *   - rentalStatus → "kembali"
 *   - set tglKembali
 *   - rollback stok/unit di Barang (untuk unit-by-unit)
 *   - for consumable: not allowed / no-op
 */
exports.returnItem = async (req, res) => {
  const { id } = req.params;
  const { unitReturns } = req.body;

  try {
    const loan = await Peminjaman.findById(id).populate("barang");
    if (!loan) {
      return res.status(404).json({ message: "Peminjaman tidak ditemukan" });
    }

    if (loan.isConsumable) {
      return res
        .status(400)
        .json({ message: "Tidak ada return untuk consumable" });
    }

    if (loan.rentalStatus === "kembali") {
      return res.status(400).json({ message: "Barang sudah dikembalikan" });
    }

    if (loan.status !== "approved") {
      return res.status(400).json({ message: "Peminjaman belum disetujui" });
    }

    const barang = await Barang.findById(loan.barang._id);
    if (!barang) {
      return res
        .status(404)
        .json({ message: "Barang terkait tidak ditemukan" });
    }

    const newUnitStatus = [];

    for (const kode of loan.unitKodes) {
      const idx = barang.units.findIndex((u) => u.kode === kode);
      if (idx === -1 || barang.units[idx].status !== "dipinjam") {
        return res
          .status(400)
          .json({ message: `Unit '${kode}' tidak sedang dipinjam` });
      }

      const kondisi = unitReturns?.find((u) => u.kode === kode)?.kondisi;
      if (!["tersedia", "rusak", "hilang"].includes(kondisi)) {
        return res
          .status(400)
          .json({ message: `Kondisi unit '${kode}' tidak valid` });
      }

      // Simpan perubahan
      barang.units[idx].status = kondisi;

      // Dapatkan status saat dipinjam
      const prevStatus =
        loan.unitStatus?.find((u) => u.kode === kode)?.statusSaatPinjam ||
        "dipinjam";

      newUnitStatus.push({
        kode,
        statusSaatPinjam: prevStatus,
        statusSetelahKembali: kondisi,
      });
    }

    await recalcStokNonConsumable(barang);

    loan.rentalStatus = "kembali";
    loan.tglKembali = new Date();
    loan.unitStatus = newUnitStatus;
    await loan.save();

    return res.json({
      data: loan,
      message: "Barang berhasil dikembalikan dengan status kondisi terbaru.",
    });
  } catch (err) {
    console.error("Error di returnItem Peminjaman:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/peminjaman/:id
 * Hapus record peminjaman.
 * Jika belum dikembalikan dan pinjam unit-by-unit yang sudah approved, rollback unit status.
 */
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const loan = await Peminjaman.findById(id);
    if (!loan) {
      return res.status(404).json({ message: "Peminjaman tidak ditemukan" });
    }

    if (
      loan.rentalStatus !== "kembali" &&
      !loan.isConsumable &&
      loan.status === "approved"
    ) {
      const barang = await Barang.findById(loan.barang);
      if (barang) {
        for (const kode of loan.unitKodes) {
          const idx = barang.units.findIndex((u) => u.kode === kode);
          if (idx !== -1) {
            barang.units[idx].status = "tersedia";
          }
        }

        await recalcStokNonConsumable(barang);
      }
    }

    await Peminjaman.findByIdAndDelete(id);
    return res.json({ message: "Peminjaman terhapus" });
  } catch (err) {
    console.error("Error di delete Peminjaman:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { startDate, endDate, peminjamNama, peminjamType, status } =
      req.query;
    let filter = {};

    if (peminjamType) {
      filter.peminjamType = peminjamType;
    }
    if (status) {
      filter.status = status;
    }
    if (req.query.jurusan) {
      filter.jurusan = req.query.jurusan;
    }

    if (startDate || endDate) {
      filter.tglPinjam = {};
      if (startDate) {
        filter.tglPinjam.$gte = new Date(startDate);
      }
      if (endDate) {
        const dt = new Date(endDate);
        dt.setHours(23, 59, 59, 999);
        filter.tglPinjam.$lte = dt;
      }
    }
    if (req.query.returnStart || req.query.returnEnd) {
      filter.tglKembali = {};
      if (req.query.returnStart) {
        filter.tglKembali.$gte = new Date(req.query.returnStart);
      }
      if (req.query.returnEnd) {
        const dt = new Date(req.query.returnEnd);
        dt.setHours(23, 59, 59, 999);
        filter.tglKembali.$lte = dt;
      }
    }

    // AMBIL DATA DULU
    let data = await Peminjaman.find(filter)
      .sort({ tglPinjam: -1 })
      .populate("barang", "nama")
      .populate("peminjamSiswa", "nama jurusan kelas")
      .lean();

    // FILTER NAMA SETELAH POPULATE
    if (peminjamNama) {
      const regex = new RegExp(peminjamNama, "i");
      data = data.filter((item) => {
        return (
          (item.peminjamNama && regex.test(item.peminjamNama)) ||
          (item.peminjamSiswa?.nama && regex.test(item.peminjamSiswa.nama))
        );
      });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Error getHistory:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
