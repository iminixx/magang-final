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

  // Ambil role pengguna dari local storage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role === "admin" ? "admin" : "user"; // non-admin fallback to 'user'

  const filtered = data
    .filter((r) => {
      const nama =
        r.peminjamType === "siswa"
          ? r.peminjamSiswa?.nama || ""
          : r.peminjamNama || "";
      return (
        !searchTerm || nama.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .filter((r) =>
      jurusanBarang ? r.barang?.jurusan === jurusanBarang : true
    );

  async function handleReturn(id) {
    try {
      const res = await fetch(`${API_LOAN}/${id}/return`, { method: "PUT" });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Gagal melakukan return");
      }
      await res.json();
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  async function handleDelete(id, status) {
    // Tampilkan dialog konfirmasi
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus peminjaman ini?"
    );
    if (!confirmDelete) {
      return; // Batalkan jika pengguna tidak mengonfirmasi
    }

    // Cek role dan status sebelum menghapus
    if (role === "user" && status !== "pending") {
      alert("Anda hanya dapat menghapus peminjaman yang berstatus 'pending'.");
      return;
    }

    try {
      await fetch(`${API_LOAN}/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus peminjaman");
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="p-8 flex-1 overflow-auto min-w-0">
        {/* ... Breadcrumb and other components ... */}

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
            ) : (
              <PeminjamanTable
                data={filtered}
                onReturn={handleReturn}
                onDelete={handleDelete}
                userRole={role} // Kirim role pengguna ke PeminjamanTable
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
    </div>
  );
}
