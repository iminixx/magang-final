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

import {
  Package,
  Repeat,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loansPerDayByJurusan, setLoansPerDayByJurusan] = useState([]);
  const [quickStats, setQuickStats] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();
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
          {
            title: "Total Barang",
            value: totals.totalBarang,
            icon: Package,
            bgColor: "bg-blue-100",
            textColor: "text-blue-800",
          },
          {
            title: "Total Transaksi",
            value: totals.totalTransaksi,
            icon: Repeat,
            bgColor: "bg-purple-100",
            textColor: "text-purple-800",
          },
          {
            title: "Sedang Dipinjam",
            value: totals.totalDipinjam,
            icon: Activity,
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-800",
          },
          {
            title: "Dikembalikan",
            value: totals.totalDikembalikan,
            icon: CheckCircle,
            bgColor: "bg-green-100",
            textColor: "text-green-800",
          },
          {
            title: "Rusak",
            value: totals.totalRusak,
            icon: AlertCircle,
            bgColor: "bg-red-100",
            textColor: "text-red-800",
          },
          {
            title: "Hilang",
            value: totals.totalHilang,
            icon: XCircle,
            bgColor: "bg-gray-200",
            textColor: "text-gray-800",
          },
        ]);

        const chartArr = Object.entries(summary).map(([jurusan, d]) => ({
          name: jurusan,
          Dipinjam: d.totalDipinjam || 0,
          Dikembalikan: d.totalDikembalikan || 0,
          totalBarang: d.totalBarang || 0,
        }));
        setChartData(chartArr);

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
                    Beranda
                  </a>
                  <span className="mx-1">/</span>
                </li>
              </ul>
            </nav>
            <h1 className="text-3xl font-bold text-gray-800">Beranda</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="w-full lg:w-1/3 bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Barang & Transaksi
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {quickStats.slice(0, 2).map((s, i) => (
                  <SummaryCard key={i} {...s} />
                ))}
              </div>
            </div>

            <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Aktivitas & Status
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickStats.slice(2).map((s, i) => (
                  <SummaryCard key={i + 2} {...s} />
                ))}
              </div>
            </div>
          </div>

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
                <Bar dataKey="Dipinjam" stackId="a" fill="#F59E0B" />
                <Bar dataKey="Dikembalikan" stackId="a" fill="#10B981" />
                <Line
                  type="monotone"
                  dataKey="totalBarang"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
                />
                <Line
                  type="monotone"
                  dataKey="TKJ"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="DKV"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

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
