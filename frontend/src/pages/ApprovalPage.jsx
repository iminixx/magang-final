import React, { useState, useEffect, useMemo } from "react";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";

const API_LOAN = "http://localhost:5000/api/peminjaman";

export default function AdminApproval() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_LOAN}?limit=1000&page=1&search=`);
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
        return loan.peminjamNama
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Approval Peminjaman</h2>
          <div className="flex gap-4 mb-4">
            <SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama peminjam..."
              className="flex-1"
            />
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-6">Memuat data...</p>
            ) : pendingLoans.length === 0 ? (
              <p className="p-6">Tidak ada permintaan peminjaman pending.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nama Barang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Peminjam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Asal/Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tgl Request
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedLoans.map((loan) => (
                    <tr key={loan._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {loan.barang?.nama || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {loan.peminjamNama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {loan.peminjamAsal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {loan.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(loan.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleApprove(loan._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(loan._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
