const Barang = require("../models/Barang");
const Peminjaman = require("../models/Peminjaman");

const jurusanList = ["RPL", "TKJ", "DKV"];

const getDashboardSummary = async (req, res) => {
  try {
    const allLoans = await Peminjaman.find().populate("barang");

    const summaryByJurusan = {};

    for (const jurusan of jurusanList) {
      const totalBarang = await Barang.countDocuments({ jurusan });

      const loansJur = allLoans.filter(
        (l) => l.barang && l.barang.jurusan === jurusan
      );

      const totalDipinjam = loansJur.filter(
        (l) => !l.tglKembali && l.status === "disetujui"
      ).length;
      const totalDikembalikan = loansJur.filter((l) => l.tglKembali).length;

      // Hitung total rusak dan hilang dari dua tipe barang
      const barangRusakHilang = await Barang.find({ jurusan });

      let totalRusak = 0;
      let totalHilang = 0;

      for (const b of barangRusakHilang) {
        if (b.tipe === "habis_pakai") {
          if (b.status === "rusak") totalRusak++;
          if (b.status === "hilang") totalHilang++;
        } else if (b.tipe === "tidak_habis_pakai" && Array.isArray(b.units)) {
          totalRusak += b.units.filter((u) => u.status === "rusak").length;
          totalHilang += b.units.filter((u) => u.status === "hilang").length;
        }
      }

      const totalTransaksi = loansJur.length;

      summaryByJurusan[jurusan] = {
        totalBarang,
        totalDipinjam,
        totalDikembalikan,
        totalRusak,
        totalHilang,
        totalTransaksi,
      };
    }

    const transaksiTerbaru = allLoans
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((l) => ({
        _id: l._id,
        barang: l.barang,
        peminjamNama: l.peminjamNama,
        peminjamAsal: l.peminjamAsal,
        status: l.tglKembali ? "Dikembalikan" : "Dipinjam",
        createdAt: l.createdAt,
      }));

    const dates = [];
    for (let i = 14; i >= 0; i--) {
      const temp = new Date();
      temp.setDate(temp.getDate() - i);
      const dateStr = temp.toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
      dates.push(dateStr);
    }

    const loansPerDayByJurusan = dates.map((dateStr) => {
      const counts = { RPL: 0, TKJ: 0, DKV: 0 };

      allLoans.forEach((l) => {
        const loanDate = l.createdAt.toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });
        if (
          loanDate === dateStr &&
          l.barang &&
          jurusanList.includes(l.barang.jurusan)
        ) {
          counts[l.barang.jurusan]++;
        }
      });

      return {
        date: dateStr,
        RPL: counts.RPL,
        TKJ: counts.TKJ,
        DKV: counts.DKV,
      };
    });

    res.json({
      summaryByJurusan,
      transaksiTerbaru,
      loansPerDayByJurusan,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Gagal mengambil data dashboard",
      error: error.message,
    });
  }
};

module.exports = { getDashboardSummary };
