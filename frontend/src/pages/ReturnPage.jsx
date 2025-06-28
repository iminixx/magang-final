// src/pages/ReturnPage.jsx
import React, { useState } from "react";
import usePeminjaman from "../components/UsePeminjaman";
import SearchInput from "../components/SearchInput";
import JurusanFilter from "../components/JurusanFilter";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import PeminjamanTable from "../components/PeminjamanTable";

const API_LOAN = "http://localhost:5000/api/peminjaman";

export default function ReturnPage() {
  const {
    data,
    loading,
    searchTerm,
    handleSearch,
    currentPage,
    totalPages,
    setCurrentPage,
    fetchData,
  } = usePeminjaman(API_LOAN);

  const [jurusanBarang, setJurusanBarang] = useState("");
  const [selected, setSelected] = useState(null);
  const [kondisiBarang, setKondisiBarang] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Filter hanya yang approved dan masih pinjam
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

  // Saat tombol kembalikan ditekan
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

    // ini format payload-nya
    const payload = isConsumable
      ? { kondisi: kondisiBarang } // untuk habis pakai
      : {
          unitReturns: selected.unitKodes.map((kode) => ({
            kode,
            kondisi: kondisiBarang,
          })),
        }; // untuk tidak habis pakai

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
                  Home
                </a>
                <span className="mx-1">/</span>
              </li>
              <li className="text-gray-800 font-semibold">
                Validasi Pengembalian
              </li>
            </ul>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">
            Validasi Pengembalian Barang
          </h1>
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
          </div>

          <div className="w-full max-w-full overflow-x-auto min-w-0">
            {loading ? (
              <p className="p-6 text-gray-600">Memuat data...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-600">
                Tidak ada barang yang sedang dipinjam.
              </p>
            ) : (
              <PeminjamanTable
                data={filtered}
                onReturn={handleReturnClick}
                onDelete={() => {}}
                userRole="admin"
                showReturnButton={true} // pastikan ini disupport di PeminjamanTable.jsx
              />
            )}
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Validasi Pengembalian"
      >
        <p className="mb-2">Pilih kondisi barang yang dikembalikan:</p>
        <select
          value={kondisiBarang}
          onChange={(e) => setKondisiBarang(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4"
        >
          <option value="">-- Pilih kondisi --</option>
          <option value="tersedia">Baik (tersedia)</option>
          <option value="rusak">Rusak</option>
          <option value="hilang">Hilang</option>
        </select>
        <div className="text-right">
          <button
            onClick={handleReturn}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Konfirmasi Pengembalian
          </button>
        </div>
      </Modal>
    </div>
  );
}
