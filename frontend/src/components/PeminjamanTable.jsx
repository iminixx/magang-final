import React, { useState } from "react";
import { Undo2, Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import Badge from "../components/Badge";

export default function PeminjamanTable({
  data,
  onReturn,
  onDelete,
  userRole,
}) {
  const [showExtra, setShowExtra] = useState(false);

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

  const baseHeads = [
    "Aksi", // Pindahkan kolom Aksi ke bagian awal
    "Nama Peminjam",
    "Asal/Kelas",
    "Barang",
    "Tipe Barang",
    "Jumlah/Unit",
    "Status",
  ];

  const extraHeads = [
    "Keterangan",
    "Rental Status",
    "Tgl Pinjam",
    "Tgl Kembali",
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {baseHeads.map((head) => (
              <th
                key={head}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {head}
              </th>
            ))}

            {showExtra &&
              extraHeads.map((head) => (
                <th
                  key={head}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {head}
                </th>
              ))}

            <th className="px-2 py-3 text-center w-10">
              <button
                onClick={() => setShowExtra((prev) => !prev)}
                className="p-1 hover:bg-gray-100 rounded-full"
                title={
                  showExtra
                    ? "Sembunyikan kolom tambahan"
                    : "Tampilkan kolom tambahan"
                }
              >
                {showExtra ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((rec) => (
            <tr key={rec._id} className="hover:bg-gray-50">
              {/* Kolom Aksi dipindahkan ke bagian awal */}
              <td className="px-6 py-4 text-center text-sm font-medium">
                <div className="flex justify-center gap-2">
                  {!rec.isConsumable &&
                    rec.status === "approved" &&
                    rec.rentalStatus === "pinjam" && (
                      <button
                        onClick={() => onReturn(rec._id)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Kembalikan"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                    )}
                  <button
                    onClick={() => onDelete(rec._id, rec.status)} // Kirim status ke fungsi onDelete
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>

              <td className="px-6 py-4 text-sm text-gray-900 text-center">
                {rec.peminjamType === "siswa"
                  ? rec.peminjamSiswa?.nama || "-"
                  : rec.peminjamNama || "-"}
              </td>

              <td className="px-6 py-4 text-sm text-gray-900 text-center">
                {rec.peminjamType === "siswa"
                  ? rec.peminjamSiswa
                    ? `${rec.peminjamSiswa.jurusan} ${rec.peminjamSiswa.kelas}`
                    : "-"
                  : rec.peminjamAsal || "-"}
              </td>

              <td className="px-6 py-4 text-sm text-gray-900 text-center">
                {rec.barang?.nama || "-"}
              </td>

              <td className="px-6 py-4 text-sm text-gray-900 text-center capitalize">
                {rec.barang?.tipe === "habis_pakai"
                  ? "Habis Pakai"
                  : "Tidak Habis Pakai"}
              </td>

              <td className="px-6 py-4 text-sm text-gray-900 text-center">
                {rec.isConsumable
                  ? rec.jumlah
                  : rec.unitKodes
                  ? rec.unitKodes.join(", ")
                  : "-"}
              </td>

              <td className="px-6 py-4 text-center capitalize">
                <Badge variant={getStatusVariant(rec.status)}>
                  {rec.status}
                </Badge>
              </td>

              {showExtra && (
                <>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center">
                    {rec.keterangan || "-"}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900 text-center capitalize">
                    {rec.rentalStatus}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900 text-center">
                    {rec.tglPinjam
                      ? new Date(rec.tglPinjam).toLocaleDateString("id-ID")
                      : "-"}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900 text-center">
                    {rec.tglKembali
                      ? new Date(rec.tglKembali).toLocaleDateString("id-ID")
                      : "-"}
                  </td>
                </>
              )}

              <td className="px-2 py-4" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
