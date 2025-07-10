import React, { useState, useEffect } from "react";
import { Plus, Download, Filter, Upload, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";

import Sidebar from "../components/Sidebar";
import SearchInput from "../components/SearchInput";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import BarangForm from "../components/barangForm";
import BarangTable from "../components/barangTable";
import JurusanFilter from "../components/JurusanFilter";
import StatusFilter from "../components/StatusFilter";
import FormField from "../components/FormField";

import useBarang from "../components/UseBarang";
import { convertToCSV, downloadCSV } from "../components/CSV";

const API_BASE_URL = "http://localhost:5000/api/barang";
const STATUS_OPTIONS = ["tersedia", "rusak", "hilang"];

const BarangManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [allBarang, setAllBarang] = useState([]);
  const [formData, setFormData] = useState({
    nama: "",
    jurusan: "",
    tipe: "",
    stok: 0,
    status: "tersedia",
    maxDurasiPinjam: "",
    deskripsi: "",
    units: [],
  });
  const [errors, setErrors] = useState({});

  const {
    barang,
    loading,
    currentPage,
    totalPages,
    total,
    setCurrentPage,
    fetchItems,
    deleteBarang,
    updateBarang,
  } = useBarang(API_BASE_URL, 10, selectedJurusan, selectedStatus, searchTerm);

  const filteredBarang = barang;

  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDescBarang, setSelectedDescBarang] = useState(null);

  const onInfoClick = (item) => {
    setSelectedDescBarang(item);
    setShowDescModal(true);
  };

  const fetchAllBarang = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        limit: 1000,
        page: 1,
        ...(selectedJurusan && { jurusan: selectedJurusan }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(searchTerm && { nama: searchTerm }),
      });
      const res = await fetch(`${API_BASE_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      setAllBarang(res.ok ? json.data : []);
    } catch (err) {
      console.error("Error fetchAllBarang:", err);
      setAllBarang([]);
    }
  };
  useEffect(() => {
    fetchAllBarang();
    setCurrentPage(1);
  }, [selectedJurusan, selectedStatus, searchTerm]);

  const manualPageSize = 10;
  const totalFilteredPages = Math.ceil(filteredBarang.length / manualPageSize);
  const paginatedBarang = filteredBarang.slice(
    (currentPage - 1) * manualPageSize,
    currentPage * manualPageSize
  );

  const [rusakPage, setRusakPage] = useState(1);
  const [rusakSearch, setRusakSearch] = useState("");

  const [hilangPage, setHilangPage] = useState(1);
  const [hilangSearch, setHilangSearch] = useState("");
  const itemsPerPageUnits = 10;

  const rusakUnits = allBarang.flatMap((b) =>
    (b.units || [])
      .filter((u) => u.status === "rusak")
      .map((u) => ({ nama: b.nama, kode: u.kode }))
  );
  const hilangUnits = allBarang.flatMap((b) =>
    (b.units || [])
      .filter((u) => u.status === "hilang")
      .map((u) => ({ nama: b.nama, kode: u.kode }))
  );

  const filteredRusak = rusakUnits.filter(({ nama, kode }) =>
    `${nama} ${kode}`.toLowerCase().includes(rusakSearch.toLowerCase())
  );
  const filteredHilang = hilangUnits.filter(({ nama, kode }) =>
    `${nama} ${kode}`.toLowerCase().includes(hilangSearch.toLowerCase())
  );

  const rusakTotalPages = Math.ceil(filteredRusak.length / itemsPerPageUnits);
  const paginatedRusak = filteredRusak.slice(
    (rusakPage - 1) * itemsPerPageUnits,
    rusakPage * itemsPerPageUnits
  );

  const hilangTotalPages = Math.ceil(filteredHilang.length / itemsPerPageUnits);
  const paginatedHilang = filteredHilang.slice(
    (hilangPage - 1) * itemsPerPageUnits,
    hilangPage * itemsPerPageUnits
  );

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalUnitKode, setModalUnitKode] = useState(null);
  const [modalStatus, setModalStatus] = useState("tersedia");

  const openStatusModal = (kode) => {
    setModalUnitKode(kode);
    setModalStatus("tersedia");
    setShowStatusModal(true);
  };
  const confirmKembalikanUnit = async () => {
    console.log(" Kirim:", { kode: modalUnitKode, status: modalStatus });
    await handleKembalikanUnit(modalUnitKode, modalStatus);
    setShowStatusModal(false);
    setModalUnitKode(null);
  };

  const handleKembalikanUnit = async (kode, statusBaru = "tersedia") => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/barang/unit/${kode}/kembalikan`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusBaru }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Gagal mengembalikan unit.");
        return;
      }

      alert("Unit berhasil dikembalikan.");
      fetchItems();
      fetchAllBarang();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama.trim()) newErrors.nama = "Nama barang wajib diisi";
    if (!formData.jurusan) newErrors.jurusan = "Jurusan wajib diisi";
    if (!formData.tipe) newErrors.tipe = "Tipe wajib diisi";

    if (formData.tipe === "habis_pakai") {
      if (formData.stok < 0) newErrors.stok = "Stok harus ≥ 0";
      if (!["tersedia", "rusak", "hilang"].includes(formData.status)) {
        newErrors.status = "Status tidak valid";
      }
    } else if (formData.tipe === "tidak_habis_pakai") {
      if (!Array.isArray(formData.units) || formData.units.length === 0) {
        newErrors.units = "Minimal satu unit wajib ditambahkan";
      } else {
        const seen = new Set();
        formData.units.forEach((u, idx) => {
          if (!u.kode || !u.kode.trim()) {
            newErrors[`units.${idx}.kode`] = "Kode unit wajib diisi";
          } else if (seen.has(u.kode.trim())) {
            newErrors[`units.${idx}.kode`] = "Kode unit harus unik";
          } else {
            seen.add(u.kode.trim());
          }
          if (!["tersedia", "dipinjam", "rusak", "hilang"].includes(u.status)) {
            newErrors[`units.${idx}.status`] = "Status unit tidak valid";
          }
        });
      }
      if (
        formData.maxDurasiPinjam &&
        (isNaN(formData.maxDurasiPinjam) ||
          parseInt(formData.maxDurasiPinjam) < 1)
      ) {
        newErrors.maxDurasiPinjam =
          "Max durasi pinjam harus bilangan bulat ≥ 1";
      }
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const basePayload = {
      nama: formData.nama.trim(),
      jurusan: formData.jurusan,
      tipe: formData.tipe,
      maxDurasiPinjam:
        formData.tipe === "tidak_habis_pakai"
          ? formData.maxDurasiPinjam
          : undefined,
      deskripsi: formData.deskripsi.trim(),
    };

    try {
      if (editingId) {
        if (formData.tipe === "habis_pakai") {
          basePayload.stok = formData.stok;
          basePayload.status = formData.status;
        } else {
          basePayload.units = formData.units.map((u) => ({
            kode: u.kode.trim(),
            status: u.status,
          }));
        }
        await updateBarang(editingId, basePayload);
        alert("Barang berhasil diubah!");
      } else {
        if (formData.tipe === "habis_pakai") {
          basePayload.stok = formData.stok;
          basePayload.status = formData.status;
        } else {
          basePayload.units = formData.units.map((u) => ({
            kode: u.kode.trim(),
            status: u.status,
          }));
        }

        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(basePayload),
        });
        const dataRes = await response.json();
        if (response.ok) {
          alert("Barang berhasil ditambahkan!");
        } else {
          if (dataRes.errors) {
            const newErrors = {};
            dataRes.errors.forEach((error) => {
              newErrors[error.param || error.path] = error.msg;
            });
            setErrors(newErrors);
            return;
          } else {
            alert(dataRes.message || "Terjadi kesalahan");
            return;
          }
        }
      }
      resetForm();
      fetchItems();
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyimpan data");
    }
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      jurusan: "",
      tipe: "",
      stok: 0,
      status: "tersedia",
      maxDurasiPinjam: "",
      deskripsi: "",
      units: [],
    });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus barang "${nama}"?`)) {
      await deleteBarang(id);
      fetchItems();
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nama: item.nama,
      jurusan: item.jurusan,
      tipe: item.tipe,
      stok: item.tipe === "habis_pakai" ? item.stok : 0,
      status: item.tipe === "habis_pakai" ? item.status : "tersedia",
      maxDurasiPinjam:
        item.tipe === "tidak_habis_pakai" && item.maxDurasiPinjam
          ? item.maxDurasiPinjam
          : "",
      deskripsi: item.deskripsi || "",
      units:
        item.tipe === "tidak_habis_pakai" && Array.isArray(item.units)
          ? item.units.map((u) => ({ kode: u.kode, status: u.status }))
          : [],
    });
    setEditingId(item._id);
    setShowForm(true);
    setErrors({});
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        ...(searchTerm && { nama: searchTerm }),
        ...(selectedJurusan && { jurusan: selectedJurusan }),
        ...(selectedStatus && { status: selectedStatus }),
        limit: 1000,
        page: 1,
      });

      const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const dataRes = await response.json();

      if (response.ok) {
        const dataToExport = (dataRes.data || []).map((b) => ({
          nama: b.nama,
          jurusan: b.jurusan,
          tipe: b.tipe,
          stok: b.stok,
          status: b.status,
          maxDurasiPinjam: b.maxDurasiPinjam,
          deskripsi: b.deskripsi,
          units: Array.isArray(b.units)
            ? b.units.map((u) => `${u.kode}(${u.status})`).join("; ")
            : "",
        }));
        console.log(dataToExport);

        const csvContent = convertToCSV(dataToExport);
        const filename =
          `${selectedJurusan || "data-barang"}${
            selectedStatus ? `-${selectedStatus}` : ""
          }`
            .replace(/\s+/g, "-")
            .toLowerCase() + ".csv";

        downloadCSV(csvContent, filename);
      } else {
        alert("Gagal mengexport data");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal mengexport data");
    }
  };

  const handleImport = async (e) => {
    const token = localStorage.getItem("token");
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          results.data = results.data.map((row) => {
            if (row.tipe === "tidak_habis_pakai" && row.units) {
              row.units = row.units
                .split(";")
                .map((u) => u.trim())
                .filter(Boolean)
                .join(";");
            }
            return row;
          });

          const response = await fetch(`${API_BASE_URL}/import`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ data: results.data }),
          });

          const res = await response.json();

          if (response.ok) {
            alert("Data berhasil diimport");
            fetchItems(); // refresh table
          } else {
            alert(res.message || "Gagal mengimpor data");
          }
        } catch (err) {
          console.error(err);
          alert("Terjadi kesalahan saat import");
        }
      },
    });
    e.target.value = null;
  };

  const resetFilters = () => {
    setSelectedJurusan("");
    setSelectedStatus("");
    setSearchTerm("");
    fetchItems();
  };

  const hasActiveFilters = selectedJurusan || selectedStatus || searchTerm;

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
            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Barang
            </h1>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama barang..."
                  className="flex-1 max-w-md"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      showFilters || hasActiveFilters
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {hasActiveFilters && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                        {(selectedJurusan ? 1 : 0) +
                          (selectedStatus ? 1 : 0) +
                          (searchTerm ? 1 : 0)}
                      </span>
                    )}
                  </button>

                  <input
                    type="file"
                    accept=".csv"
                    id="importFile"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <label
                    htmlFor="importFile"
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </label>

                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Barang
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-200">
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Jurusan:
                    </label>
                    <JurusanFilter
                      selectedJurusan={selectedJurusan}
                      onJurusanChange={(value) => setSelectedJurusan(value)}
                      placeholder="Semua jurusan"
                      showClearButton={true}
                    />
                  </div>
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Status (habis pakai):
                    </label>
                    <StatusFilter
                      selectedStatus={selectedStatus}
                      onStatusChange={(value) => setSelectedStatus(value)}
                      placeholder="Semua status"
                      showClearButton={true}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      * Status hanya berlaku untuk tipe “habis pakai”
                    </p>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex items-end">
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Filter aktif:</span>
                  {selectedJurusan && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Jurusan: {selectedJurusan}
                      <button
                        onClick={() => setSelectedJurusan("")}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Pencarian: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedStatus && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      Status: {selectedStatus}
                      <button
                        onClick={() => setSelectedStatus("")}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Modal
            isOpen={showForm}
            onClose={handleCancel} // pastikan ini men-trigger resetForm
            title={editingId ? "Edit Barang" : "Tambah Barang"}
          >
            <BarangForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              onSubmit={handleSubmit}
              onCancel={handleCancel} // pastikan ini men-trigger resetForm
              isEditing={!!editingId}
            />
          </Modal>
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Data Barang ({barang.length} dari {total} item
                  {total !== 1 ? "s" : ""})
                </h2>
                {hasActiveFilters && (
                  <div className="text-sm text-gray-600"></div>
                )}
              </div>
            </div>
            {loading ? (
              <LoadingSpinner message="Memuat data..." />
            ) : barang.length === 0 ? (
              <EmptyState
                message={
                  hasActiveFilters
                    ? "Tidak ada data yang sesuai dengan filter"
                    : "Belum ada data barang"
                }
              />
            ) : (
              <>
                <BarangTable
                  data={paginatedBarang}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onInfo={onInfoClick}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Barang Rusak</h2>
          <div className="bg-white rounded-3xl shadow-lg mb-8 p-6">
            <div className="flex justify-between items-center mb-4">
              <SearchInput
                value={rusakSearch}
                onChange={(e) => {
                  setRusakSearch(e.target.value);
                  setRusakPage(1);
                }}
                placeholder="Cari kode/nama unit rusak..."
                className="max-w-xs"
              />
              <button
                onClick={() => {
                  const csv = Papa.unparse(filteredRusak);
                  downloadCSV(csv, "unit-rusak.csv");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Barang
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode Unit
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRusak.map(({ nama, kode }) => (
                    <tr key={`${nama}-${kode}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 text-center truncate">
                        {nama}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center truncate">
                        {kode}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openStatusModal(kode)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Kembalikan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={rusakPage}
                totalPages={rusakTotalPages}
                onPageChange={setRusakPage}
              />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Barang Hilang</h2>
          <div className="bg-white rounded-3xl shadow-lg mb-8 p-6">
            <div className="flex justify-between items-center mb-4">
              <SearchInput
                value={hilangSearch}
                onChange={(e) => {
                  setHilangSearch(e.target.value);
                  setHilangPage(1);
                }}
                placeholder="Cari kode/nama unit hilang..."
                className="max-w-xs"
              />
              <button
                onClick={() => {
                  const csv = Papa.unparse(filteredHilang);
                  downloadCSV(csv, "unit-rusak.csv");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Barang
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode Unit
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedHilang.map(({ nama, kode }) => (
                    <tr key={`${nama}-${kode}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 text-center truncate">
                        {nama}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center truncate">
                        {kode}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openStatusModal(kode)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Kembalikan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={hilangPage}
                totalPages={hilangTotalPages}
                onPageChange={setHilangPage}
              />
            </div>
          </div>
        </main>
      </div>
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Pilih Status Baru"
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Status Terbaru:" required>
            <select
              id="modal-status"
              value={modalStatus}
              onChange={(e) => setModalStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex gap-3 mt-6">
            <button
              onClick={confirmKembalikanUnit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Simpan
            </button>
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {sidebarOpen && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <Modal
        isOpen={showDescModal}
        onClose={() => setShowDescModal(false)}
        title={`Deskripsi ${selectedDescBarang?.nama}`}
        size="md"
      >
        <p className="whitespace-pre-line">
          {selectedDescBarang?.deskripsi || "—"}
        </p>
        {selectedDescBarang?.units && (
          <ul className="mt-4 space-y-2 text-sm">
            {selectedDescBarang.units.map((u, idx) => (
              <li key={idx}>
                {u.kode} — {u.status}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default BarangManagement;
