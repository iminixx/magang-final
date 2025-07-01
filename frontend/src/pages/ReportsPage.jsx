import React, { useState, useEffect, useCallback } from "react";
import { Filter, Download } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { fetchLogs } from "../api/reportApi";
import { downloadCSV } from "../components/CSV";

const Table = ({ data, columns, loading, emptyMessage }) => {
  if (loading) return <LoadingSpinner message="Memuat data..." />;
  if (!data.length) return <p className="text-center p-4">{emptyMessage}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row._id} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td
                  key={`${row._id}-${c.key}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center"
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FilterSection = ({
  title,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  filters,
  setFilters,
  onReset,
  children,
}) => (
  <div>
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="flex gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
            showFilters || activeFiltersCount > 0
              ? "bg-blue-100 text-blue-700 border-blue-300"
              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filter
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {children}
      </div>
    </div>

    {showFilters && (
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-3xl border mb-4">
        {filters.map((f) => (
          <div key={f.key} className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.label}
            </label>
            {f.type === "text" ? (
              <input
                type="text"
                placeholder={f.placeholder}
                className="border rounded-3xl px-3 py-2 w-full"
                value={f.value}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, [f.key]: e.target.value }))
                }
              />
            ) : (
              <input
                type="date"
                className="border rounded-3xl px-3 py-2 w-full"
                value={f.value}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, [f.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
        {activeFiltersCount > 0 && (
          <div className="flex items-end">
            <button
              onClick={onReset}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-3xl hover:bg-gray-100 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    )}

    {activeFiltersCount > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-gray-600">Filter aktif:</span>
        {filters.map(
          (f) =>
            f.value && (
              <span
                key={f.key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {f.label}: {f.value}
                <button
                  onClick={() => setFilters((p) => ({ ...p, [f.key]: "" }))}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )
        )}
      </div>
    )}
  </div>
);

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
      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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

const LogsPage = () => {
  const initialLogFilters = {
    startDate: "",
    endDate: "",
  };
  const {
    data: paginatedLogs,
    loading: loadingLogs,
    currentPage: logsPage,
    setCurrentPage: setLogsPage,
    totalPages: logsTotal,
    filters: logFilters,
    setFilters: setLogFilters,
  } = useFetchData(fetchLogs, initialLogFilters);

  const [showFiltLogs, setShowFiltLogs] = useState(false);
  const activeLogs = Object.values(logFilters).filter(Boolean).length;

  const logCols = [
    {
      key: "timestamp",
      label: "Waktu",
      render: (l) => new Date(l.timestamp).toLocaleString("id-ID"),
    },
    {
      key: "userId",
      label: "User",
      render: (l) => l.userId?.nama || l.userId?._id || "-",
    },
    { key: "action", label: "Aksi" },
    {
      key: "description",
      label: "Keterangan",
      render: (l) => l.description || "-",
    },
  ];

  const exportLogs = () => {
    const headers = ["Waktu", "User", "Aksi", "Keterangan"];
    const rows = paginatedLogs.map((l) => [
      new Date(l.timestamp).toLocaleString("id-ID"),
      l.userId?.nama || l.userId?._id || "",
      l.action,
      l.description || "",
    ]);
    downloadCSV(
      [headers, ...rows].map((r) => r.join(",")).join("\n"),
      `logs_${logFilters.startDate || "all"}_${logFilters.endDate || "all"}.csv`
    );
  };

  return (
    <div className="flex">
      <div className="flex-1 flex flex-col">
        <main className="p-8 flex-1 overflow-auto">
          <div className="mb-8">
            <nav className="text-sm text-gray-600 mb-2">
              <ul className="inline-flex space-x-2">
                <li>
                  <a href="/" className="hover:text-gray-900">
                    Home
                  </a>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-gray-800 font-semibold">Laporan</li>
              </ul>
            </nav>
            <h1 className="text-3xl font-bold text-gray-800">Logs Aktivitas</h1>
          </div>

          <section className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <FilterSection
              title="Logs Aktivitas"
              showFilters={showFiltLogs}
              setShowFilters={setShowFiltLogs}
              activeFiltersCount={activeLogs}
              filters={[
                {
                  key: "startDate",
                  label: "Tgl Mulai",
                  type: "date",
                  value: logFilters.startDate,
                },
                {
                  key: "endDate",
                  label: "Tgl Selesai",
                  type: "date",
                  value: logFilters.endDate,
                },
              ]}
              setFilters={setLogFilters}
              onReset={() => setLogFilters({ startDate: "", endDate: "" })}
            >
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </FilterSection>

            <Table
              data={paginatedLogs}
              columns={logCols}
              loading={loadingLogs}
              emptyMessage="Tidak ada data logs."
            />

            {logsTotal > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={logsPage}
                  totalPages={logsTotal}
                  onPageChange={setLogsPage}
                />
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default LogsPage;
