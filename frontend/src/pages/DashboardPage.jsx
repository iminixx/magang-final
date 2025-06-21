import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import SummaryCard from "../components/SummaryCard";
import TransactionTable from "../components/TransactionTable";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loansPerDayByJurusan, setLoansPerDayByJurusan] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();

        // Fetching summary data
        const summary = json.summaryByJurusan || {};
        const cardArray = Object.entries(summary).map(([jurusan, data]) => ({
          jurusan,
          title:
            {
              RPL: "Rekayasa Perangkat Lunak",
              TKJ: "Teknik Komputer Jaringan",
              DKV: "Desain Komunikasi Visual",
            }[jurusan] || jurusan,
          data,
        }));
        setCards(cardArray);

        // Fetching quick stats
        const totals = {
          totalBarang: 0,
          totalDipinjam: 0,
          totalDikembalikan: 0,
          totalRusak: 0,
          totalHilang: 0,
          totalTransaksi: 0,
        };
        Object.values(summary).forEach((d) => {
          Object.keys(totals).forEach((k) => {
            totals[k] += typeof d[k] === "number" ? d[k] : 0;
          });
        });
        setQuickStats([
          { title: "Total Barang", value: totals.totalBarang },
          { title: "Sedang Dipinjam", value: totals.totalDipinjam },
          { title: "Dikembalikan", value: totals.totalDikembalikan },
          { title: "Total Transaksi", value: totals.totalTransaksi },
          { title: "Rusak", value: totals.totalRusak },
          { title: "Hilang", value: totals.totalHilang },
        ]);

        // Fetching chart data
        const chartArr = Object.entries(summary).map(([jurusan, d]) => ({
          name: jurusan,
          Dipinjam: d.totalDipinjam || 0,
          Dikembalikan: d.totalDikembalikan || 0,
          totalBarang: d.totalBarang || 0,
        }));
        setChartData(chartArr);

        // Fetching the latest transactions
        const latestTransactionsRes = await fetch("/api/peminjaman");
        const latestTransactionsJson = await latestTransactionsRes.json();
        const formattedTx = latestTransactionsJson.data.map((l) => ({
          _id: l._id,
          peminjamType: l.peminjamType,
          peminjamSiswa: l.peminjamSiswa,
          peminjamNama: l.peminjamNama,
          barang: l.barang,
          jurusan: l.jurusan,
          status: l.status,
          tglPinjam: l.tglPinjam,
          tglKembali: l.tglKembali,
        }));
        setTransactions(formattedTx);

        // Fetching loans per day by jurusan
        setLoansPerDayByJurusan(json.loansPerDayByJurusan || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    })();
  }, []);

  return (
    <div className="flex">
      <div className="flex-1 flex flex-col">
        <main className="p-8 flex-1 overflow-auto">
          <div className="mb-8">
            <nav className="text-sm text-gray-600 mb-2">
              <ul className="inline-flex space-x-2">
                <li>
                  <a
                    href="/"
                    className="hover:text-gray-900 transition duration-200"
                  >
                    Home
                  </a>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-gray-800 font-semibold">Dashboard</li>
              </ul>
            </nav>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          </div>

          {/* Quick Stats Section */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Summary
            </h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {quickStats.map((s, i) => (
                <SummaryCard key={i} title={s.title} value={s.value} />
              ))}
            </div>
          </div>

          {/* Kartu Statistik per Jurusan */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Statistik Jurusan
            </h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c, i) => (
                <DashboardCard key={i} {...c} />
              ))}
            </div>
          </div>

          {/* Chart Aktivitas per Jurusan */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Aktivitas Inventaris per Jurusan
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Dipinjam"
                  stackId="a"
                  fill="#F59E0B"
                  name="Dipinjam"
                />
                <Bar
                  dataKey="Dikembalikan"
                  stackId="a"
                  fill="#10B981"
                  name="Dikembalikan"
                />
                <Line
                  type="monotone"
                  dataKey="totalBarang"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Total Barang"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Peminjaman per Hari per Jurusan */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Peminjaman per Hari (15 Hari Terakhir) per Jurusan
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={loansPerDayByJurusan}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  tickFormatter={(d) => {
                    const parts = d.split("-");
                    return `${parts[2]}/${parts[1]}`;
                  }}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  formatter={(value, name) => [`${value}`, name]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="RPL"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="RPL"
                />
                <Line
                  type="monotone"
                  dataKey="TKJ"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="TKJ"
                />
                <Line
                  type="monotone"
                  dataKey="DKV"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="DKV"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabel Transaksi Terbaru */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Transaksi Terbaru
            </h2>
            <TransactionTable transactions={transactions} />
          </div>
        </main>
      </div>
    </div>
  );
}
