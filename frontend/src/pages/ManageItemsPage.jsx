import React, { useState, useEffect } from "react";
import { Plus, Download, Filter, Upload } from "lucide-react";
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

import useBarang from "../components/UseBarang";
import { convertToCSV, downloadCSV } from "../components/CSV";

const API_BASE_URL = "http://localhost:5000/api/barang";
const API_LOAN = "http://localhost:5000/api/peminjaman";

const BarangManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDescBarang, setSelectedDescBarang] = useState(null);

  const onInfoClick = (item) => {
    setSelectedDescBarang(item);
    setShowDescModal(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedJurusan, selectedStatus, setCurrentPage]);

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
          // Kirim units apa adanya, backend yang handle generate kode kosong
          basePayload.units = formData.units.map((u) => ({
            kode: u.kode.trim(),
            status: u.status,
          }));
        }

        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
      const params = new URLSearchParams({
        ...(searchTerm && { nama: searchTerm }),
        ...(selectedJurusan && { jurusan: selectedJurusan }),
        ...(selectedStatus && { status: selectedStatus }),
        limit: 1000,
        page: 1,
      });

      const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
      const dataRes = await response.json();

      if (response.ok) {
        const dataToExport = dataRes.data || [];
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
                    Home
                  </a>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-gray-800 font-semibold">
                  Manajemen Barang
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
                  <div className="text-sm text-gray-600">
                    {/* your filter summary here - unchanged */}
                  </div>
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
                  data={barang}
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
        </main>
      </div>

      {sidebarOpen && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {showDescModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              Deskripsi&nbsp;
              <span className="text-blue-600">{selectedDescBarang?.nama}</span>
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {selectedDescBarang?.deskripsi?.trim()
                ? selectedDescBarang.deskripsi
                : "Belum ada deskripsi untuk barang ini."}
            </p>

            <div className="mt-6 text-right">
              <button
                onClick={() => {
                  setShowDescModal(false);
                  setSelectedDescBarang(null);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangManagement;
