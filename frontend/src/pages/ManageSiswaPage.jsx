import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Filter, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";

import Sidebar from "../components/Sidebar";
import SearchInput from "../components/SearchInput";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import JurusanFilter from "../components/JurusanFilter";

import {
  fetchSiswa,
  createSiswa,
  updateSiswa,
  deleteSiswa,
} from "../api/siswaApi";

const ManageSiswaPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nama: "",
    jurusan: "",
    kelas: "",
    tanggalLahir: "",
  });
  const [errors, setErrors] = useState({});
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const itemsPerPage = 10;

  const [showImportModal, setShowImportModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetchSiswa();
      const list = Array.isArray(res.data) ? res.data : res.data.data || [];
      setSiswaList(list);
    } catch (err) {
      console.error("Failed to fetch siswa", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedJurusan, kelasFilter]);

  const fileInputRef = useRef(null);

  const handleXlsxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      try {
        const response = await fetch("http://localhost:5000/api/siswa/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: jsonData }),
        });
        const result = await response.json();

        if (!response.ok) {
          alert(result.message || "Gagal mengimpor data siswa");
          return;
        }

        await fetchAll();
        alert("Berhasil mengimpor data siswa!");
      } catch (err) {
        console.error("Upload XLSX gagal:", err);
        alert("Gagal mengimpor file XLSX");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleExportXlsx = () => {
    const dataToExport = filteredList.map((s) => ({
      nama: s.nama,
      jurusan: s.jurusan,
      kelas: s.kelas,
      pin: s.pin,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DataSiswa");
    XLSX.writeFile(wb, "data-siswa.xlsx");
  };
  const filteredList = siswaList.filter((s) => {
    return (
      (searchTerm === "" ||
        s.nama.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedJurusan === "" || s.jurusan === selectedJurusan) &&
      (kelasFilter === "" ||
        s.kelas.toLowerCase() === kelasFilter.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginated = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedJurusan("");
    setKelasFilter("");
    setCurrentPage(1);
  };
  const hasFilter = !!searchTerm || !!selectedJurusan || !!kelasFilter;

  const handleBatchDelete = async () => {
    if (!window.confirm(`Yakin hapus ${selectedIds.length} siswa?`)) return;
    try {
      await fetch("http://localhost:5000/api/siswa/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      await fetchAll();
      alert("Siswa berhasil dihapus massal");
    } catch (err) {
      console.error("Gagal hapus massal:", err);
    }
  };

  const handleBatchEdit = async () => {
    const newKelas = prompt("Masukkan kelas baru untuk semua siswa terpilih:");
    if (!newKelas) return;
    try {
      await fetch("http://localhost:5000/api/siswa/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          update: { kelas: newKelas },
        }),
      });
      setSelectedIds([]);
      await fetchAll();
      alert("Siswa berhasil diupdate massal");
    } catch (err) {
      console.error("Gagal update massal:", err);
    }
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = "Nama wajib diisi";
    if (!form.jurusan) errs.jurusan = "Jurusan wajib dipilih";
    if (!form.kelas.trim()) errs.kelas = "Kelas wajib diisi";
    if (!form.tanggalLahir) errs.tanggalLahir = "Tanggal lahir wajib diisi";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      const [year, month, day] = form.tanggalLahir.split("-");
      const pin = `${day}${month}${year}`;
      const payload = {
        ...form,
        jurusan: form.jurusan.trim().toUpperCase(),
        kelas: form.kelas.trim().toUpperCase(),
        pin,
      };
      delete payload.tanggalLahir;

      if (editId) await updateSiswa(editId, payload);
      else await createSiswa(payload);
      setShowForm(false);
      setEditId(null);
      setForm({ nama: "", jurusan: "", kelas: "" });

      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (s) => {
    const pin = s.pin || "";
    let tanggalLahir = "";

    if (pin.length === 8) {
      const day = pin.slice(0, 2);
      const month = pin.slice(2, 4);
      const year = pin.slice(4, 8);
      tanggalLahir = `${year}-${month}-${day}`;
    }

    setForm({
      nama: s.nama,
      jurusan: s.jurusan,
      kelas: s.kelas,
      tanggalLahir,
    });
    setEditId(s._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin hapus siswa ini?")) {
      await deleteSiswa(id);
      setSiswaList((prev) => prev.filter((s) => s._id !== id));
    }
  };

  return (
    <div className="flex">
      {sidebarOpen && <Sidebar isOpen onClose={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col">
        <main className="p-8 flex-1 overflow-auto">
          <div className="mb-8">
            <nav className="text-sm text-gray-600 mb-2">
              <ul className="inline-flex space-x-2">
                <li>
                  <a href="/" className="hover:text-gray-900">
                    Beranda
                  </a>
                  <span className="mx-1">/</span>
                </li>
              </ul>
            </nav>
            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Siswa
            </h1>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa..."
                className="flex-1 max-w-md"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showFilters || hasFilter
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  {hasFilter && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                      {Number(!!searchTerm) +
                        Number(!!selectedJurusan) +
                        Number(!!kelasFilter)}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Import/Export
                </button>

                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Siswa
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-3xl border mb-4">
                <div className="flex-1 max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jurusan:
                  </label>
                  <JurusanFilter
                    selectedJurusan={selectedJurusan}
                    onJurusanChange={setSelectedJurusan}
                    placeholder="Semua jurusan"
                    showClearButton
                  />
                </div>
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelas:
                  </label>
                  <input
                    type="text"
                    className="border rounded-3xl px-3 py-2 w-full"
                    placeholder="Contoh: X RPL 1"
                    value={kelasFilter}
                    onChange={(e) => setKelasFilter(e.target.value)}
                  />
                </div>
                {hasFilter && (
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
          </div>
          {selectedIds.length > 0 && (
            <div className="flex justify-between items-center mb-4 px-6">
              <span className="text-sm text-gray-600">
                {selectedIds.length} siswa dipilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBatchEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}

          <Modal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditId(null);
              setForm({ nama: "", jurusan: "", kelas: "", tanggalLahir: "" });
              setErrors({});
            }}
            title={editId ? "Edit Siswa" : "Tambah Siswa"}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input
                  type="text"
                  className="border rounded-xl px-4 py-2 w-full"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
                {errors.nama && (
                  <p className="text-red-600 text-sm mt-1">{errors.nama}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jurusan
                </label>
                <JurusanFilter
                  selectedJurusan={form.jurusan}
                  onJurusanChange={(val) => setForm({ ...form, jurusan: val })}
                  placeholder="Pilih jurusan"
                />
                {errors.jurusan && (
                  <p className="text-red-600 text-sm mt-1">{errors.jurusan}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kelas</label>
                <input
                  type="text"
                  className="border rounded-xl px-4 py-2 w-full"
                  placeholder="Contoh: X RPL 1"
                  value={form.kelas}
                  onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                />
                {errors.kelas && (
                  <p className="text-red-600 text-sm mt-1">{errors.kelas}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  className="border rounded-xl px-4 py-2 w-full"
                  value={form.tanggalLahir}
                  onChange={(e) =>
                    setForm({ ...form, tanggalLahir: e.target.value })
                  }
                />
                {errors.tanggalLahir && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.tanggalLahir}
                  </p>
                )}
              </div>

              <div className="text-right">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                >
                  {editId ? "Update" : "Tambah"}
                </button>
              </div>
            </div>
          </Modal>

          <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8">
            {loading ? (
              <LoadingSpinner message="Memuat siswa..." />
            ) : paginated.length === 0 ? (
              <EmptyState
                message={
                  hasFilter
                    ? "Tidak ada siswa yang sesuai filter"
                    : "Belum ada data siswa"
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={selectAllAcrossPages}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allIds = filteredList.map((s) => s._id);
                                setSelectedIds(allIds);
                                setSelectAllAcrossPages(true);
                              } else {
                                setSelectedIds([]);
                                setSelectAllAcrossPages(false);
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Nama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Jurusan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Kelas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          PIN
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginated.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(s._id)}
                              onChange={(e) => {
                                setSelectAllAcrossPages(false); // batalkan select-all seluruh halaman
                                if (e.target.checked) {
                                  setSelectedIds((prev) => [...prev, s._id]);
                                } else {
                                  setSelectedIds((prev) =>
                                    prev.filter((id) => id !== s._id)
                                  );
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {s.nama}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {s.jurusan}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {s.kelas}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {s.pin}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            <button
                              onClick={() => handleEdit(s)}
                              className="text-blue-600 hover:underline mr-2"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(s._id)}
                              className="text-red-600 hover:underline"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import / Export Siswa"
          size="sm"
        >
          <div className="space-y-4">
            <label
              htmlFor="importFile"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Import XLSX
            </label>
            <input
              id="importFile"
              type="file"
              accept=".xlsx"
              ref={fileInputRef}
              onChange={handleXlsxUpload}
              hidden
            />

            <button
              onClick={handleExportXlsx}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export XLSX
            </button>

            <a
              href="/assets/template-siswa.xlsx"
              download="template-siswa.xlsx"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </a>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ManageSiswaPage;
