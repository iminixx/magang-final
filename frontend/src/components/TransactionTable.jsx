import React from "react";

export default function TransactionTable({ transactions }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Transaksi Terbaru</h3>
      {transactions.length === 0 ? (
        <p>Tidak ada transaksi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Peminjam</th>
                <th className="py-2 px-4 text-left">Barang</th>
                <th className="py-2 px-4 text-left">Jurusan</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Tanggal Pinjam</th>
                <th className="py-2 px-4 text-left">Tanggal Kembali</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {tx.peminjamType === "siswa"
                      ? tx.peminjamSiswa?.nama ?? "N/A"
                      : tx.peminjamNama ?? "N/A"}
                  </td>
                  <td className="py-2 px-4">{tx.barang?.nama ?? "N/A"}</td>
                  <td className="py-2 px-4">{tx.jurusan ?? "N/A"}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {tx.status ?? "N/A"}
                    </span>
                  </td>
                  <td className="py-2 px-4">{formatDate(tx.tglPinjam)}</td>
                  <td className="py-2 px-4">{formatDate(tx.tglKembali)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
