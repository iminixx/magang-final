import React, { useState, useEffect, useMemo } from "react";
import { Check, X, ChevronRight, ChevronLeft } from "lucide-react";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import Badge from "../components/Badge";

const API_LOAN = "http://localhost:5000/api/peminjaman";

export default function AdminApproval() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showExtra, setShowExtra] = useState(false);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_LOAN}?limit=1000&page=1`);
      const json = await res.json();
      setData(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Error fetch peminjaman:", err);
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingLoans = useMemo(() => {
    return data
      .filter((loan) => loan.status === "pending")
      .filter((loan) => {
        if (!searchTerm) return true;
        const nama =
          loan.peminjamType === "siswa"
            ? loan.peminjamSiswa?.nama
            : loan.peminjamNama;
        return nama?.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [data, searchTerm]);

  const totalPages = Math.ceil(pendingLoans.length / itemsPerPage);
  const pagedLoans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return pendingLoans.slice(start, start + itemsPerPage);
  }, [pendingLoans, currentPage]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_LOAN}/approve/${id}`, { method: "PUT" });
      if (!res.ok) {
        const text = await res.text();
        alert("Gagal approve: " + text);
        return;
      }
      await fetchData();
    } catch (err) {
      alert("Error jaringan saat approve");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_LOAN}/reject/${id}`, { method: "PUT" });
      if (!res.ok) {
        const text = await res.text();
        alert("Gagal reject: " + text);
        return;
      }
      await fetchData();
    } catch (err) {
      alert("Error jaringan saat reject");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "default";
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
              <li className="text-gray-800 font-semibold">Persetujuan</li>
            </ul>
          </nav>
          <h1 className="text-3xl font-bold text-gray-800">
            Persetujuan Peminjaman
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama peminjam..."
              className="flex-1 max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-6 text-gray-600">Memuat data...</p>
            ) : pagedLoans.length === 0 ? (
              <p className="text-gray-600">
                Tidak ada permintaan peminjaman yang diproses.
              </p>
            ) : (
              <table className="w-full text-sm text-center font-sans">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asal/Kelas
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. Telepon
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barang
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tgl Request
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedLoans.map((loan) => {
                    const nama =
                      loan.peminjamType === "siswa"
                        ? loan.peminjamSiswa?.nama
                        : loan.peminjamNama;
                    const asal =
                      loan.peminjamType === "siswa"
                        ? `${loan.peminjamSiswa?.jurusan || ""} ${
                            loan.peminjamSiswa?.kelas || ""
                          }`
                        : loan.peminjamAsal;
                    const jumlah = loan.isConsumable
                      ? `${loan.jumlah} buah`
                      : loan.unitKodes?.join(", ");
                    const tipe =
                      loan.barang?.tipe === "habis_pakai"
                        ? "Habis Pakai"
                        : "Tidak Habis Pakai";

                    return (
                      <tr key={loan._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleApprove(loan._id)}
                              className="text-green-600 hover:text-green-800"
                              title="Setujui"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(loan._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Tolak"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">{nama}</td>
                        <td className="px-4 py-2 text-center">{asal}</td>
                        <td className="px-4 py-2 text-center">
                          {loan.peminjamPhone || "-"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {loan.barang?.nama || "-"}
                        </td>
                        <td className="px-4 py-2 text-center">{tipe}</td>
                        <td className="px-4 py-2 text-center">{jumlah}</td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant={getStatusVariant(loan.status)}>
                            {loan.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {new Date(loan.createdAt).toLocaleDateString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
