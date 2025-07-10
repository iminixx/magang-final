import React from "react";
import { Edit, Trash2, Info as InfoIcon } from "lucide-react";
import Badge from "../components/Badge";

const BarangTable = ({ data, onEdit, onDelete, onInfo }) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case "tersedia":
        return "success";
      case "rusak":
        return "danger";
      case "hilang":
        return "default";
      default:
        return "default";
    }
  };

  const formatTipe = (tipe) => {
    return tipe === "habis_pakai" ? "Habis Pakai" : "Tidak Habis Pakai";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama Barang
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jurusan
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipe
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stok
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Info
            </th>

            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span>{item.nama || "-"}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <Badge variant="primary">{item.jurusan || "-"}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatTipe(item.tipe)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {item.tipe === "habis_pakai"
                  ? item.stok
                  : Array.isArray(item.units)
                  ? // hanya hitung unit yg tersedia
                    item.units.filter((u) => u.status === "tersedia").length
                  : "-"}
                {item.stok_dipinjam > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({item.stok_dipinjam} dipinjam)
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <Badge variant={getStatusVariant(item.status)}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => onInfo(item)}
                  title="Lihat deskripsi"
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <InfoIcon className="w-4 h-4 text-gray-600" />
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item._id, item.nama)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BarangTable;
