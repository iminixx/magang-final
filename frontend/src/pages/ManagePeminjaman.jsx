import React, { useState, useEffect } from "react";
import PeminjamanForm from "../components/PeminjamanForm";
import SearchInput from "../components/SearchInput";
import JurusanFilter from "../components/JurusanFilter";
import Pagination from "../components/Pagination";
import Badge from "../components/Badge";
import { Filter, Info as InfoIcon } from "lucide-react";

function DescriptionModal({ isOpen, onClose, item }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">
          Deskripsi&nbsp;<span className="text-blue-600">{item?.nama}</span>
        </h3>
        <p className="text-gray-700 whitespace-pre-line">
          {item?.deskripsi?.trim()
            ? item.deskripsi
            : "Belum ada deskripsi untuk barang ini."}
        </p>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

const API_LOAN = "http://localhost:5000/api/peminjaman";
const API_BARANG = "http://localhost:5000/api/barang";

export default function PeminjamanSiswaPage() {
  const [barangList, setBarangList] = useState([]);
  const [searchBarang, setSearchBarang] = useState("");
  const [jurusanBarang, setJurusanBarang] = useState("");
  const [pageTidakHabis, setPageTidakHabis] = useState(1);
  const [pageHabis, setPageHabis] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = Boolean(searchBarang || jurusanBarang);
  const [showForm, setShowForm] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDescBarang, setSelectedDescBarang] = useState(null);

  useEffect(() => {
    fetchBarangList();
  }, []);

  async function fetchBarangList() {
    try {
      const res = await fetch(`${API_BARANG}?limit=1000`);
      const json = await res.json();
      setBarangList(json.data || []);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data barang");
    }
  }

  const availBarang = barangList
    .filter((b) =>
      b.tipe === "habis_pakai"
        ? b.stok > 0
        : (Array.isArray(b.units) ? b.units.length : 0) -
            (b.stok_dipinjam || 0) >
          0
    )
    .filter(
      (b) =>
        !searchBarang ||
        b.nama.toLowerCase().includes(searchBarang.toLowerCase())
    )
    .filter((b) => !jurusanBarang || b.jurusan === jurusanBarang);

  const barangTidakHabisPakai = availBarang.filter(
    (b) => b.tipe === "tidak_habis_pakai"
  );
  const barangHabisPakai = availBarang.filter((b) => b.tipe === "habis_pakai");

  const totalPagesTidakHabis = Math.ceil(
    barangTidakHabisPakai.length / itemsPerPage
  );
  const totalPagesHabis = Math.ceil(barangHabisPakai.length / itemsPerPage);

  const pagedTidakHabisPakai = barangTidakHabisPakai.slice(
    (pageTidakHabis - 1) * itemsPerPage,
    pageTidakHabis * itemsPerPage
  );
  const pagedHabisPakai = barangHabisPakai.slice(
    (pageHabis - 1) * itemsPerPage,
    pageHabis * itemsPerPage
  );

  const onPinjamClick = (barang) => {
    setSelectedBarang(barang);
    setShowForm(true);
  };

  const onInfoClick = (barang) => {
    setSelectedDescBarang(barang);
    setShowDescModal(true);
  };

  async function handleCreate(form) {
    try {
      const payload = {
        barang: form.barang,
        peminjamType: form.peminjamType,
        peminjamSiswa: form.peminjamSiswa,
        peminjamNama: form.peminjamNama,
        peminjamAsal: form.peminjamAsal,
        peminjamPhone: form.peminjamPhone,
        isConsumable: form.isConsumable,
        jumlah: form.jumlah,
        unitKodes: form.unitKodes,
        keterangan: form.keterangan,
      };
      const resLoan = await fetch(API_LOAN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resLoan.ok) {
        const err = await resLoan.json();
        throw new Error(err.message || "Gagal membuat peminjaman");
      }
      await resLoan.json();
      setShowForm(false);
      setSelectedBarang(null);
      await fetchBarangList();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  const resetFilters = () => {
    setSearchBarang("");
    setJurusanBarang("");
    setPageTidakHabis(1);
    setPageHabis(1);
  };

  return (
    <div className="flex">
      <div className="flex-1 flex flex-col">
        <main className="p-8 flex-1 overflow-auto">
          <div className="mb-8">
            <nav className="text-sm text-gray-600 mb-2">
              <ul className="inline-flex space-x-2">
                <li>
                  <a href="/" className="hover:text-gray-900 duration-200">
                    Beranda
                  </a>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-gray-800 font-semibold">
                  Kelola Peminjaman
                </li>
              </ul>
            </nav>
            <h1 className="text-3xl font-bold text-gray-800">
              Daftar Peminjaman
            </h1>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Data Barang
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
              <SearchInput
                value={searchBarang}
                onChange={(e) => {
                  setSearchBarang(e.target.value);
                  setPageTidakHabis(1);
                  setPageHabis(1);
                }}
                placeholder="Cari nama barang..."
                className="flex-1 max-w-md"
              />

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                  showFilters || hasActiveFilters
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                <Filter className="w-4 h-4" /> Filter
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                    {(searchBarang ? 1 : 0) + (jurusanBarang ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-200 mb-4">
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Jurusan:
                  </label>
                  <JurusanFilter
                    selectedJurusan={jurusanBarang}
                    onJurusanChange={(val) => {
                      setJurusanBarang(val);
                      setPageTidakHabis(1);
                      setPageHabis(1);
                    }}
                    placeholder="Semua jurusan"
                    showClearButton
                  />
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
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-600">Filter aktif:</span>
                {searchBarang && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Pencarian: "{searchBarang}"
                    <button
                      onClick={() => {
                        setSearchBarang("");
                        setPageTidakHabis(1);
                        setPageHabis(1);
                      }}
                      className="text-green-600 hover:text-green-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                )}
                {jurusanBarang && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Jurusan: {jurusanBarang}
                    <button
                      onClick={() => {
                        setJurusanBarang("");
                        setPageTidakHabis(1);
                        setPageHabis(1);
                      }}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}

            <div className="mb-8">
              {pagedTidakHabisPakai.length === 0 ? (
                <p className="text-center p-6 text-gray-500">
                  Tidak ada barang di kategori ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "Nama",
                          "Jurusan",
                          "Total Unit",
                          "Dipinjam",
                          "Tersedia",
                          "Aksi",
                        ].map((head) => (
                          <th
                            key={head}
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedTidakHabisPakai.map((b) => {
                        const totalUnits = Array.isArray(b.units)
                          ? b.units.length
                          : 0;
                        const dipinjamCount = b.stok_dipinjam || 0;
                        const rusakOrHilangCount =
                          b.units?.filter(
                            (u) => u.status === "rusak" || u.status === "hilang"
                          ).length || 0;

                        const tersediaCount =
                          totalUnits - dipinjamCount - rusakOrHilangCount;
                        return (
                          <tr key={b._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <span>{b.nama || "-"}</span>
                                <button
                                  onClick={() => onInfoClick(b)}
                                  title="Lihat deskripsi"
                                  className="p-1 rounded hover:bg-gray-100"
                                >
                                  <InfoIcon className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="primary">
                                {b.jurusan || "-"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-center">
                              {totalUnits}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-center">
                              {dipinjamCount}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-center">
                              {tersediaCount}
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-medium">
                              <button
                                disabled={tersediaCount < 1}
                                className={`px-3 py-1 text-sm rounded text-white ${
                                  tersediaCount < 1
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                                onClick={() => onPinjamClick(b)}
                                title="Pinjam"
                              >
                                Pinjam
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4">
                <Pagination
                  currentPage={pageTidakHabis}
                  totalPages={totalPagesTidakHabis}
                  onPageChange={setPageTidakHabis}
                />
              </div>
            </div>

            <div className="flex items-center my-8">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-4 text-gray-500 uppercase text-sm tracking-wider">
                Barang Habis Pakai
              </span>
              <div className="flex-grow border-t border-gray-300" />
            </div>

            <div>
              {pagedHabisPakai.length === 0 ? (
                <p className="text-center p-6 text-gray-500">
                  Tidak ada barang di kategori ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Nama", "Jurusan", "Stok", "Tersedia", "Aksi"].map(
                          (head) => (
                            <th
                              key={head}
                              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {head}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedHabisPakai.map((b) => {
                        const totalStok = b.stok;
                        const tersediaCount = totalStok;
                        return (
                          <tr key={b._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <span>{b.nama || "-"}</span>
                                <button
                                  onClick={() => onInfoClick(b)}
                                  title="Lihat deskripsi"
                                  className="p-1 rounded hover:bg-gray-100"
                                >
                                  <InfoIcon className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="primary">
                                {b.jurusan || "-"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-center">
                              {tersediaCount}
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-medium">
                              <button
                                disabled={tersediaCount < 1}
                                className={`px-3 py-1 text-sm rounded text-white ${
                                  tersediaCount < 1
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                                onClick={() => onPinjamClick(b)}
                                title="Pinjam"
                              >
                                Pinjam
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4">
                <Pagination
                  currentPage={pageHabis}
                  totalPages={totalPagesHabis}
                  onPageChange={setPageHabis}
                />
              </div>
            </div>
          </div>

          <PeminjamanForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setSelectedBarang(null);
            }}
            onSubmit={handleCreate}
            barangList={availBarang}
            initialBarang={selectedBarang}
          />

          <DescriptionModal
            isOpen={showDescModal}
            onClose={() => {
              setShowDescModal(false);
              setSelectedDescBarang(null);
            }}
            item={selectedDescBarang}
          />
        </main>
      </div>
    </div>
  );
}
