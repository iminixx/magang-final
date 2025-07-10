import React, { useState, useEffect } from "react";
import SearchInput from "../components/SearchInput";
import JurusanFilter from "../components/JurusanFilter";

const API_URL = "http://localhost:5000/api/peminjaman";

export default function OverduePage() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error("Gagal fetch:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const hasil = data.filter((item) => {
      if (
        item.status !== "approved" ||
        item.rentalStatus !== "pinjam" ||
        !item.tglPinjam ||
        !item.barang?.maxDurasiPinjam
      )
        return false;

      const tglPinjam = new Date(item.tglPinjam);
      const batas = new Date(tglPinjam);
      batas.setDate(batas.getDate() + item.barang.maxDurasiPinjam);
      const overdue = today > batas;

      const nama =
        item.peminjamType === "siswa"
          ? item.peminjamSiswa?.nama || ""
          : item.peminjamNama || "";

      return (
        overdue &&
        (!searchTerm ||
          nama.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!jurusan || item.jurusan === jurusan)
      );
    });

    setFiltered(hasil);
  }, [data, searchTerm, jurusan]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="p-8 flex-1 overflow-auto min-w-0">
        <div className="mb-6">
          <nav className="text-sm text-gray-600 mb-2">
            <ul className="inline-flex space-x-2">
              <li>
                <a href="/" className="hover:text-gray-900">
                  Beranda
                </a>
                <span className="mx-1">/</span>
              </li>
              <li className="text-gray-800 font-semibold">
                Peminjaman Terlambat
              </li>
            </ul>
          </nav>
          <h1 className="text-3xl font-bold text-gray-800">
            Peminjaman Terlambat
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama peminjam..."
              className="flex-1 max-w-md"
            />
            <JurusanFilter
              selectedJurusan={jurusan}
              onJurusanChange={setJurusan}
              className="max-w-xs"
            />
          </div>

          <div className="w-full overflow-x-auto">
            {loading ? (
              <p className="p-6 text-gray-600">Memuat data...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-600">
                Tidak ada peminjaman yang terlambat.
              </p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-100">
                    <th className="p-3">Nama</th>
                    <th className="p-3">Tipe</th>
                    <th className="p-3">Jurusan/Asal</th>
                    <th className="p-3">No. HP</th>
                    <th className="p-3">Barang</th>
                    <th className="p-3">Tgl Pinjam</th>
                    <th className="p-3">Batas Kembali</th>
                    <th className="p-3">Terlambat</th>
                    <th className="p-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const nama =
                      item.peminjamType === "siswa"
                        ? item.peminjamSiswa?.nama || "-"
                        : item.peminjamNama || "-";
                    const asal =
                      item.peminjamType === "siswa"
                        ? item.peminjamSiswa?.jurusan || "-"
                        : item.peminjamAsal || "-";
                    const tipe = item.peminjamType;
                    const barang = item.barang?.nama || "-";
                    const tgl = new Date(item.tglPinjam);
                    const batas = new Date(tgl);
                    batas.setDate(
                      batas.getDate() + item.barang.maxDurasiPinjam
                    );
                    const overdue = Math.floor(
                      (today - batas) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr key={idx} className="border-t">
                        <td className="p-3">{nama}</td>
                        <td className="p-3 capitalize">{tipe}</td>
                        <td className="p-3">{asal}</td>
                        <td className="p-3">{item.peminjamPhone || "-"}</td>
                        <td className="p-3">{barang}</td>
                        <td className="p-3">{tgl.toLocaleDateString()}</td>
                        <td className="p-3">{batas.toLocaleDateString()}</td>
                        <td className="p-3 text-red-600 font-bold">
                          {overdue} hari
                        </td>
                        <td className="p-3">{item.keterangan || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
