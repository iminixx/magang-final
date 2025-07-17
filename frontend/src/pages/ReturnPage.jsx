import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import usePeminjaman from "../components/UsePeminjaman";
import SearchInput from "../components/SearchInput";
import JurusanFilter from "../components/JurusanFilter";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import PeminjamanTable from "../components/PeminjamanTable";
import FormField from "../components/FormField";
import { Bell, Save } from "lucide-react";

const API_LOAN = "http://localhost:5000/api/peminjaman";

export default function ReturnPage() {
  const {
    data,
    loading,
    searchTerm,
    handleSearch,
    currentPage,
    setCurrentPage,
    fetchData,
  } = usePeminjaman(API_LOAN);

  const [jurusanBarang, setJurusanBarang] = useState("");
  const [selected, setSelected] = useState(null);
  const [kondisiBarang, setKondisiBarang] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const filtered = data
    .filter(
      (item) => item.status === "approved" && item.rentalStatus === "pinjam"
    )
    .filter((item) => {
      const nama =
        item.peminjamType === "siswa"
          ? item.peminjamSiswa?.nama || ""
          : item.peminjamNama || "";
      return (
        (!searchTerm ||
          nama.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!jurusanBarang || item.barang?.jurusan === jurusanBarang)
      );
    });

  const ITEMS_PER_PAGE = 10;
  const totalFilteredPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const today = new Date();
  const overdueCount = data.filter((item) => {
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
    return today > batas;
  }).length;

  const handleReturnClick = (id) => {
    const item = filtered.find((d) => d._id === id);
    if (item) {
      setSelected(item);
      setKondisiBarang("");
      setShowModal(true);
    }
  };

  const handleReturn = async () => {
    if (!kondisiBarang) {
      alert("Silakan pilih kondisi barang saat dikembalikan.");
      return;
    }

    const isConsumable = selected.isConsumable;

    const payload = isConsumable
      ? { kondisi: kondisiBarang }
      : {
          unitReturns: selected.unitKodes.map((kode) => ({
            kode,
            kondisi: kondisiBarang,
          })),
        };

    try {
      const res = await fetch(`${API_LOAN}/${selected._id}/return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dataRes = await res.json();
      if (!res.ok) throw new Error(dataRes.message || "Gagal mengembalikan");

      setShowModal(false);
      await fetchData();
      alert("Barang berhasil dikembalikan!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

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
              <li className="text-gray-800 font-semibold">Kelola Peminjaman</li>
            </ul>
          </nav>
          <h1 className="text-3xl font-bold text-gray-800">Pengembalian</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchInput
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari nama peminjam..."
              className="flex-1 max-w-md"
            />
            <JurusanFilter
              selectedJurusan={jurusanBarang}
              onJurusanChange={setJurusanBarang}
              placeholder="Filter jurusan barang"
              className="max-w-xs"
            />
            <button
              onClick={() => navigate("/overdue")}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {overdueCount > 0 ? `Overdue (${overdueCount})` : "Terlambat"}
            </button>
          </div>

          <div className="w-full max-w-full overflow-x-auto min-w-0">
            {loading ? (
              <p className="p-6 text-gray-600">Memuat data...</p>
            ) : paginatedData.length === 0 ? (
              <p className="text-gray-600">
                Tidak ada barang yang sedang dipinjam.
              </p>
            ) : (
              <PeminjamanTable
                data={paginatedData}
                onReturn={handleReturnClick}
                onDelete={() => {}}
                userRole="admin"
                showReturnButton={true}
                showDeleteButton={false}
              />
            )}
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalFilteredPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Validasi Pengembalian"
        size="sm" // bisa pakai "sm" atau ukuran yang sama
      >
        <div className="space-y-4">
          <FormField label="Kondisi Barang" required>
            <select
              value={kondisiBarang}
              onChange={(e) => setKondisiBarang(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Pilih kondisi --</option>
              <option value="tersedia">Baik (tersedia)</option>
              <option value="rusak">Rusak</option>
              <option value="hilang">Hilang</option>
            </select>
          </FormField>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleReturn}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" /> Konfirmasi
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
