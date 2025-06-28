// src/pages/PeminjamanList.jsx
import React, { useState } from "react";
import usePeminjaman from "../components/UsePeminjaman";
import PeminjamanTable from "../components/PeminjamanTable";
import SearchInput from "../components/SearchInput";
import JurusanFilter from "../components/JurusanFilter";
import Pagination from "../components/Pagination";

const API_LOAN = "http://localhost:5000/api/peminjaman";

export default function PeminjamanList() {
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

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role === "admin" ? "admin" : "user";

  const filtered = data.filter((r) => {
    const nama =
      r.peminjamType === "siswa"
        ? r.peminjamSiswa?.nama || ""
        : r.peminjamNama || "";
    return (
      (!searchTerm || nama.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!jurusanBarang || r.barang?.jurusan === jurusanBarang)
    );
  });

  const pendingData = filtered.filter((r) => r.status === "pending");
  const approvedData = filtered.filter((r) => r.status === "approved");
  const rejectedData = filtered.filter((r) => r.status === "rejected");

  const handleDelete = async (id, status) => {
    if (status !== "pending") {
      alert("Hanya peminjaman berstatus 'pending' yang bisa dihapus.");
      return;
    }

    const confirmDelete = window.confirm(
      "Yakin ingin menghapus peminjaman ini?"
    );
    if (!confirmDelete) return;

    try {
      await fetch(`${API_LOAN}/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus peminjaman.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="p-8 flex-1 overflow-auto min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Status Peminjaman
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

          {loading ? (
            <p className="text-gray-600">Memuat data...</p>
          ) : (
            <>
              {/* Pending */}
              {pendingData.length > 0 && (
                <>
                  <h2 className="font-semibold text-lg mb-2 text-yellow-600">
                    Pending
                  </h2>
                  <PeminjamanTable
                    data={pendingData}
                    onReturn={() => {}}
                    onDelete={handleDelete}
                    userRole={role}
                  />
                </>
              )}

              {/* Approved */}
              {approvedData.length > 0 && (
                <>
                  <h2 className="font-semibold text-lg mt-8 mb-2 text-green-600">
                    Disetujui
                  </h2>
                  <PeminjamanTable
                    data={approvedData}
                    onReturn={() => {}}
                    onDelete={() => {}}
                    userRole={role}
                  />
                </>
              )}

              {/* Rejected */}
              {rejectedData.length > 0 && (
                <>
                  <h2 className="font-semibold text-lg mt-8 mb-2 text-red-600">
                    Ditolak
                  </h2>
                  <PeminjamanTable
                    data={rejectedData}
                    onReturn={() => {}}
                    onDelete={() => {}}
                    userRole={role}
                  />
                </>
              )}
            </>
          )}

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
