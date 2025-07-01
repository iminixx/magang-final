// src/pages/HistoryPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Filter, Download } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { fetchPeminjamanHistory } from "../api/reportApi";
import { downloadCSV } from "../components/CSV";
import JurusanFilter from "../components/JurusanFilter";
import Badge from "../components/Badge";

// HOOK: Langsung didefinisikan agar tidak error
const useFetchData = (fetchFunction, initialFilters) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFunction(filters);
      let list = res.success ? res.data : [];
      list.sort((a, b) => new Date(b.tglPinjam) - new Date(a.tglPinjam));
      setData(list);
      setCurrentPage(1);
    } catch (e) {
      console.error("Error fetching:", e);
      setData([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    data: paginatedData,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    filters,
    setFilters,
  };
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

const HistoryPage = () => {
  const initialHistFilters = {
    startDate: "",
    endDate: "",
    returnStart: "",
    returnEnd: "",
    peminjamNama: "",
    status: "",
    jurusan: "",
  };

  const {
    data: paginatedHist,
    loading: loadingHist,
    currentPage: histPage,
    setCurrentPage: setHistPage,
    totalPages: histTotal,
    filters: histFilters,
    setFilters: setHistFilters,
  } = useFetchData(fetchPeminjamanHistory, initialHistFilters);

  const [showFiltHist, setShowFiltHist] = useState(false);
  const activeHist = Object.values(histFilters).filter(Boolean).length;

  const histCols = [
    {
      key: "tglPinjam",
      label: "Tgl Pinjam",
      render: (h) => new Date(h.tglPinjam).toLocaleDateString("id-ID"),
    },
    {
      key: "user",
      label: "Peminjam",
      render: (h) =>
        h.peminjamType === "siswa"
          ? h.peminjamSiswa?.nama || "-"
          : h.peminjamNama || "-",
    },
    {
      key: "asal",
      label: "Asal",
      render: (h) =>
        h.peminjamType === "siswa"
          ? `${h.peminjamSiswa?.jurusan || ""} ${h.peminjamSiswa?.kelas || ""}`
          : h.peminjamAsal || "-",
    },
    {
      key: "telepon",
      label: "No. Telepon",
      render: (h) => h.peminjamPhone || "-",
    },
    {
      key: "barang",
      label: "Barang",
      render: (h) => h.barang?.nama || "-",
    },
    {
      key: "jumlah",
      label: "Jumlah/Unit",
      render: (h) =>
        h.isConsumable
          ? h.jumlah
          : Array.isArray(h.unitKodes) && h.unitKodes.length
          ? h.unitKodes.join(", ")
          : "-",
    },
    {
      key: "statusSaatPinjam",
      label: "Kondisi Saat Pinjam",
      render: (h) => {
        if (h.unitStatus && h.unitStatus.length > 0) {
          const s = h.unitStatus.map((u) =>
            u.statusSaatPinjam === "tersedia" ? "baik" : u.statusSaatPinjam
          );
          return s.join(", ");
        }
        return "-";
      },
    },
    {
      key: "statusSetelahKembali",
      label: "Kondisi Setelah Kembali",
      render: (h) => {
        if (h.unitStatus && h.unitStatus.length > 0) {
          const s = h.unitStatus.map((u) =>
            u.statusSetelahKembali === "tersedia"
              ? "baik"
              : u.statusSetelahKembali
          );
          return s.join(", ");
        }
        return "-";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (h) => (
        <Badge variant={getStatusVariant(h.status)}>{h.status}</Badge>
      ),
    },
    {
      key: "tglKembali",
      label: "Tgl Kembali",
      render: (h) =>
        h.tglKembali ? new Date(h.tglKembali).toLocaleDateString("id-ID") : "-",
    },
  ];

  const exportHist = () => {
    const headers = [
      "Tgl Pinjam",
      "Peminjam",
      "Asal",
      "No. Telepon",
      "Barang",
      "Jumlah/Unit",
      "Status Saat Pinjam",
      "Status Setelah Kembali",
      "Status",
      "Tgl Kembali",
    ];

    const rows = paginatedHist.map((h) => [
      new Date(h.tglPinjam).toLocaleDateString("id-ID"),
      h.peminjamType === "siswa"
        ? h.peminjamSiswa?.nama || ""
        : h.peminjamNama || "",
      h.peminjamType === "siswa"
        ? `${h.peminjamSiswa?.jurusan || ""} ${h.peminjamSiswa?.kelas || ""}`
        : h.peminjamAsal || "",
      h.peminjamPhone || "",
      h.barang?.nama || "",
      h.isConsumable
        ? h.jumlah
        : Array.isArray(h.unitKodes) && h.unitKodes.length
        ? h.unitKodes.join(", ")
        : "",
      h.unitStatus
        ?.map((u) =>
          u.statusSaatPinjam === "tersedia" ? "baik" : u.statusSaatPinjam
        )
        .join(", ") || "",
      h.unitStatus
        ?.map((u) =>
          u.statusSetelahKembali === "tersedia"
            ? "baik"
            : u.statusSetelahKembali
        )
        .join(", ") || "",
      h.status,
      h.tglKembali ? new Date(h.tglKembali).toLocaleDateString("id-ID") : "",
    ]);
    downloadCSV(
      [headers, ...rows].map((r) => r.join(",")).join("\n"),
      `history_${Date.now()}.csv`
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="p-8 flex-1 overflow-auto min-w-0">
        <div className="mb-6">
          <nav className="text-sm text-gray-600 mb-2">
            <ul className="inline-flex space-x-2">
              <li>
                <a href="/" className="hover:text-gray-900 transition">
                  Home
                </a>
                <span className="mx-1">/</span>
              </li>
              <li className="text-gray-800 font-semibold">Laporan</li>
            </ul>
          </nav>
          <h1 className="text-3xl font-bold text-gray-800">
            Riwayat Peminjaman
          </h1>
        </div>

        <section className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <button
              onClick={() => setShowFiltHist((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFiltHist || activeHist > 0
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeHist > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {activeHist}
                </span>
              )}
            </button>

            <button
              onClick={exportHist}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {showFiltHist && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-3xl border mb-4">
              {/* Filter Form */}
              {[
                {
                  key: "startDate",
                  label: "Tgl Pinjam Dari",
                  type: "date",
                  value: histFilters.startDate,
                },
                {
                  key: "endDate",
                  label: "Tgl Pinjam Sampai",
                  type: "date",
                  value: histFilters.endDate,
                },
                {
                  key: "returnStart",
                  label: "Tgl Kembali Dari",
                  type: "date",
                  value: histFilters.returnStart,
                },
                {
                  key: "returnEnd",
                  label: "Tgl Kembali Sampai",
                  type: "date",
                  value: histFilters.returnEnd,
                },
                {
                  key: "peminjamNama",
                  label: "Nama Peminjam",
                  type: "text",
                  placeholder: "Cari Nama",
                  value: histFilters.peminjamNama,
                },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  value: histFilters.status,
                  options: [
                    { label: "Semua", value: "" },
                    { label: "Pending", value: "pending" },
                    { label: "Approved", value: "approved" },
                    { label: "Rejected", value: "rejected" },
                  ],
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                  </label>
                  {f.type === "date" || f.type === "text" ? (
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="border rounded-3xl px-3 py-2 w-full"
                      value={f.value}
                      onChange={(e) =>
                        setHistFilters((p) => ({
                          ...p,
                          [f.key]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    f.type === "select" && (
                      <select
                        className="border rounded-3xl px-3 py-2 w-full"
                        value={f.value}
                        onChange={(e) =>
                          setHistFilters((p) => ({
                            ...p,
                            [f.key]: e.target.value,
                          }))
                        }
                      >
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )
                  )}
                </div>
              ))}

              {/* Jurusan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurusan
                </label>
                <JurusanFilter
                  selectedJurusan={histFilters.jurusan}
                  onJurusanChange={(val) =>
                    setHistFilters((p) => ({ ...p, jurusan: val }))
                  }
                  showClearButton
                  placeholder="Semua jurusan"
                />
              </div>

              {/* Reset Filter Button */}
              {activeHist > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={() => setHistFilters(initialHistFilters)}
                    className="px-4 py-2 border rounded-3xl text-gray-600 hover:bg-gray-100"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tabel Riwayat */}
          {loadingHist ? (
            <LoadingSpinner message="Memuat data..." />
          ) : paginatedHist.length === 0 ? (
            <p className="text-center py-4">Tidak ada data peminjaman.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {histCols.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedHist.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      {histCols.map((col) => (
                        <td
                          key={`${row._id}-${col.key}`}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center"
                        >
                          {col.render ? col.render(row) : row[col.key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {histTotal > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={histPage}
                totalPages={histTotal}
                onPageChange={setHistPage}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default HistoryPage;
