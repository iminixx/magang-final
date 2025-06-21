import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { Combobox } from "@headlessui/react";
import Select from "react-select";
import { fetchSiswa } from "../api/siswaApi";

export default function PeminjamanForm({
  isOpen,
  onClose,
  onSubmit,
  barangList,
  initialBarang,
}) {
  // ---------- STATE PEMINJAM ----------
  const [peminjamType, setPeminjamType] = useState(""); // "siswa" atau "lainnya"
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [siswaOptions, setSiswaOptions] = useState([]);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [namaNonSiswa, setNamaNonSiswa] = useState("");
  const [asalNonSiswa, setAsalNonSiswa] = useState("");
  const [peminjamPhone, setPeminjamPhone] = useState(""); // NEW

  // ---------- STATE BARANG ----------
  const [selectedBarangId, setSelectedBarangId] = useState("");
  const [selectedBarangObj, setSelectedBarangObj] = useState(null);

  // ---------- STATE PINJAMAN ----------
  const [jumlah, setJumlah] = useState(1);
  const [unitOptions, setUnitOptions] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [keterangan, setKeterangan] = useState("");

  // ---------- INIT jika initialBarang ----------
  useEffect(() => {
    if (initialBarang) {
      setSelectedBarangObj(initialBarang);
      setSelectedBarangId(initialBarang._id);
      // Set unit options jika tipe = tidak_habis_pakai
      if (initialBarang.tipe === "tidak_habis_pakai") {
        const available = initialBarang.units.filter(
          (u) => u.status === "tersedia"
        );
        setUnitOptions(available);
      } else {
        setUnitOptions([]);
      }
      setJumlah(1);
      setSelectedUnits([]);
    }
  }, [initialBarang]);

  // ---------- HANDLE pilih barang ----------
  const handleBarangChange = (e) => {
    const barangId = e.target.value;
    setSelectedBarangId(barangId);
    const obj = barangList.find((b) => b._id === barangId) || null;
    setSelectedBarangObj(obj);

    // Reset jumlah & unit selection
    setJumlah(1);
    setSelectedUnits([]);

    if (obj && obj.tipe === "tidak_habis_pakai") {
      const available = obj.units.filter((u) => u.status === "tersedia");
      setUnitOptions(available);
    } else {
      setUnitOptions([]);
    }
  };

  // ---------- FETCH siswa ----------
  const handleSiswaSearch = async (query) => {
    if (!selectedJurusan || !selectedKelas) return;
    try {
      const res = await fetchSiswa({
        jurusan: selectedJurusan,
        kelas: selectedKelas,
        nama: query,
      });
      setSiswaOptions(res.data.data);
    } catch (err) {
      console.error("Error fetch siswa:", err);
    }
  };

  // ---------- VALIDASI tombol Submit ----------
  const canSubmit = () => {
    if (!selectedBarangObj) return false;
    if (!peminjamType) return false;
    if (!peminjamPhone.trim()) return false; // NEW
    if (peminjamType === "siswa") {
      if (!selectedSiswa) return false;
    } else {
      if (!namaNonSiswa.trim() || !asalNonSiswa.trim()) return false;
    }
    // Jika barang habis_pakai
    if (selectedBarangObj.tipe === "habis_pakai") {
      if (jumlah < 1 || jumlah > selectedBarangObj.stok) return false;
    }
    // Jika barang unit
    if (selectedBarangObj.tipe === "tidak_habis_pakai") {
      if (selectedUnits.length < 1) return false;
    }
    return true;
  };

  // ---------- SUBMIT ----------
  const handleSubmit = () => {
    if (!canSubmit()) return;

    const payload = {
      barang: selectedBarangId,
      peminjamType,
      peminjamSiswa: peminjamType === "siswa" ? selectedSiswa._id : undefined,
      peminjamNama:
        peminjamType === "lainnya" ? namaNonSiswa.trim() : undefined,
      peminjamAsal:
        peminjamType === "lainnya" ? asalNonSiswa.trim() : undefined,
      peminjamPhone: peminjamPhone.trim(), // NEW
      isConsumable: selectedBarangObj.tipe === "habis_pakai",
      jumlah: selectedBarangObj.tipe === "habis_pakai" ? jumlah : undefined,
      unitKodes:
        selectedBarangObj.tipe === "tidak_habis_pakai"
          ? selectedUnits
          : undefined,
      keterangan: keterangan.trim(),
    };

    console.log("Payload yang dikirim:", JSON.stringify(payload, null, 2));

    onSubmit(payload);

    // ---------- RESET form ----------
    setPeminjamType("");
    setSelectedJurusan("");
    setSelectedKelas("");
    setSelectedSiswa(null);
    setNamaNonSiswa("");
    setAsalNonSiswa("");
    setPeminjamPhone(""); // NEW
    if (!initialBarang) {
      setSelectedBarangId("");
      setSelectedBarangObj(null);
      setUnitOptions([]);
    }
    setJumlah(1);
    setSelectedUnits([]);
    setKeterangan("");
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Form Peminjaman">
      <div className="space-y-4">
        {/* -------- Tipe Peminjam -------- */}
        <div>
          <label className="block text-sm font-medium">Peminjam Sebagai</label>
          <select
            value={peminjamType}
            onChange={(e) => {
              setPeminjamType(e.target.value);
              // Reset data peminjam ketika bertukar tipe
              setSelectedJurusan("");
              setSelectedKelas("");
              setSelectedSiswa(null);
              setNamaNonSiswa("");
              setAsalNonSiswa("");
              setSiswaOptions([]);
            }}
            className="mt-1 block w-full border rounded p-2"
            required
          >
            <option value="">-- Pilih Tipe Peminjam --</option>
            <option value="siswa">Siswa</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        {/* -------- Jika Peminjam = Siswa -------- */}
        {peminjamType === "siswa" && (
          <>
            {/* Dropdown Jurusan */}
            <div>
              <label className="block text-sm font-medium">Jurusan</label>
              <select
                value={selectedJurusan}
                onChange={(e) => {
                  setSelectedJurusan(e.target.value);
                  setSelectedKelas("");
                  setSelectedSiswa(null);
                  setSiswaOptions([]);
                }}
                className="mt-1 block w-full border rounded p-2"
                required
              >
                <option value="">-- Pilih Jurusan --</option>
                <option value="RPL">RPL</option>
                <option value="DKV">DKV</option>
                <option value="TKJ">TKJ</option>
              </select>
            </div>

            {/* Dropdown Kelas */}
            {selectedJurusan && (
              <div>
                <label className="block text-sm font-medium">Kelas</label>
                <select
                  value={selectedKelas}
                  onChange={(e) => {
                    setSelectedKelas(e.target.value);
                    setSelectedSiswa(null);
                    setSiswaOptions([]);
                  }}
                  className="mt-1 block w-full border rounded p-2"
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
              </div>
            )}

            {/* Combobox Nama Siswa */}
            {selectedJurusan && selectedKelas && (
              <div>
                <label className="block text-sm font-medium">Nama Siswa</label>
                <Combobox value={selectedSiswa} onChange={setSelectedSiswa}>
                  <Combobox.Input
                    className="w-full border rounded p-2"
                    onChange={(e) => handleSiswaSearch(e.target.value)}
                    displayValue={(s) => (s ? s.nama : "")}
                    placeholder="Ketik nama siswa..."
                    required
                  />
                  <Combobox.Options className="border rounded mt-1 max-h-40 overflow-auto">
                    {siswaOptions.map((s) => (
                      <Combobox.Option key={s._id} value={s}>
                        {({ active, selected }) => (
                          <div
                            className={`p-2 cursor-pointer ${
                              active ? "bg-gray-100" : ""
                            } ${selected ? "font-semibold" : ""}`}
                          >
                            {s.nama} – {s.kelas} {s.jurusan}
                          </div>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox>
              </div>
            )}
          </>
        )}
        {/* -------- Jika Peminjam = Lainnya -------- */}
        {peminjamType === "lainnya" && (
          <>
            <div>
              <label className="block text-sm font-medium">Nama Peminjam</label>
              <input
                type="text"
                value={namaNonSiswa}
                onChange={(e) => setNamaNonSiswa(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                placeholder="Masukkan nama peminjam"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Asal / Instansi
              </label>
              <input
                type="text"
                value={asalNonSiswa}
                onChange={(e) => setAsalNonSiswa(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                placeholder="Masukkan asal peminjam"
                required
              />
            </div>
          </>
        )}
        {/* -------- Nomor Telepon (Selalu Wajib) -------- */} {/* NEW */}
        <div>
          <label className="block text-sm font-medium">Nomor Telepon</label>
          <input
            type="tel"
            value={peminjamPhone}
            onChange={(e) => setPeminjamPhone(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
            required
          />
        </div>
        {/* -------- Pilih Barang -------- */}
        <div>
          <label className="block text-sm font-medium">Barang</label>
          {initialBarang ? (
            <div className="mt-1 p-2 bg-gray-100 rounded">
              {initialBarang.nama}
            </div>
          ) : (
            <select
              value={selectedBarangId}
              onChange={handleBarangChange}
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">-- Pilih Barang --</option>
              {barangList.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.nama} ({b.jurusan})[
                  {b.tipe === "habis_pakai" ? "Habis Pakai" : "Pinjam"}] —{" "}
                  {b.tipe === "habis_pakai"
                    ? `Stok: ${b.stok}`
                    : `Sisa: ${b.stok - (b.stok_dipinjam || 0)}`}
                </option>
              ))}
            </select>
          )}
        </div>
        {/* -------- Input Jumlah / Multi-select Unit -------- */}
        {selectedBarangObj && selectedBarangObj.tipe === "habis_pakai" && (
          <div>
            <label className="block text-sm font-medium">
              Jumlah (Habis Pakai)
            </label>
            <input
              type="number"
              min="1"
              max={selectedBarangObj.stok}
              value={jumlah}
              onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
              className="mt-1 block w-full border rounded p-2"
              placeholder={`Maksimum ${selectedBarangObj.stok}`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maks: {selectedBarangObj.stok}
            </p>
          </div>
        )}
        {selectedBarangObj &&
          selectedBarangObj.tipe === "tidak_habis_pakai" && (
            <div>
              <label className="block text-sm font-medium">
                Pilih Kode Unit
              </label>
              <Select
                isMulti
                options={unitOptions.map((u) => ({
                  value: u.kode,
                  label: u.kode,
                }))}
                value={selectedUnits.map((kode) => ({
                  value: kode,
                  label: kode,
                }))}
                onChange={(arr) => setSelectedUnits(arr.map((a) => a.value))}
                className="mt-1"
                placeholder="Ketik untuk cari kode unit..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Sisa unit tersedia: {unitOptions.length}
              </p>
            </div>
          )}
        {/* -------- Textarea Keterangan -------- */}
        <div>
          <label className="block text-sm font-medium">
            Keterangan Peminjaman
          </label>
          <textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            rows="3"
            className="mt-1 block w-full border rounded p-2"
            placeholder="(Opsional) Alasan atau catatan khusus"
          />
        </div>
        {/* -------- Tombol Aksi -------- */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className={`px-4 py-2 rounded text-white ${
              canSubmit()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Simpan
          </button>
        </div>
      </div>
    </Modal>
  );
}
