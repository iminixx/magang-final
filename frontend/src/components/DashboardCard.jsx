import React from "react";

const DashboardCard = ({ title, data, jurusan }) => {
  const colorMap = {
    RPL: ["border-blue-500 bg-blue-50", "text-blue-600"],
    TKJ: ["border-green-500 bg-green-50", "text-green-600"],
    DKV: ["border-purple-500 bg-purple-50", "text-purple-600"],
  };
  const [bgColor, textColor] = colorMap[jurusan] || [
    "border-gray-500 bg-gray-50",
    "text-gray-600",
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${bgColor} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}
        >
          {jurusan}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Total Barang"
          value={data.totalBarang}
          color="text-gray-800"
        />
        <Stat
          label="Dipinjam"
          value={data.totalDipinjam}
          color="text-orange-600"
        />
        <Stat
          label="Dikembalikan"
          value={data.totalDikembalikan}
          color="text-green-600"
        />
        <Stat
          label="Rusak/Hilang"
          value={(data.totalRusak || 0) + (data.totalHilang || 0)}
          color="text-red-600"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
        <span className="text-sm text-gray-600">Total Transaksi</span>
        <span className="text-lg font-semibold text-gray-800">
          {data.totalTransaksi}
        </span>
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${color}`}>{value || 0}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

export default DashboardCard;
