import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { Combobox } from "@headlessui/react";
import Select from "react-select";
import { fetchSiswa } from "../api/siswaApi";

export default function PeminjamanSiswaForm({
  isOpen,
  onClose,
  onSubmit,
  barangList,
  initialBarang,
}) {
  // — STATE PEMINJAM SISWA —
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [siswaOptions, setSiswaOptions] = useState([]);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [peminjamPhone, setPeminjamPhone] = useState("");

  // — STATE BARANG & PINJAM —
  const [selectedBarangId, setSelectedBarangId] = useState("");
  const [selectedBarangObj, setSelectedBarangObj] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [unitOptions, setUnitOptions] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [keterangan, setKeterangan] = useState("");

  // Inisialisasi jika initialBarang diberikan
  useEffect(() => {
    if (!initialBarang) return;
    setSelectedBarangObj(initialBarang);
    setSelectedBarangId(initialBarang._id);
    setJumlah(1);
    setSelectedUnits([]);
    if (initialBarang.tipe === "tidak_habis_pakai") {
      setUnitOptions(
        initialBarang.units.filter((u) => u.status === "tersedia")
      );
    }
  }, [initialBarang]);

  // saat ganti barang
  const handleBarangChange = (e) => {
    const id = e.target.value;
    setSelectedBarangId(id);
    const b = barangList.find((x) => x._id === id) || null;
    setSelectedBarangObj(b);
    setJumlah(1);
    setSelectedUnits([]);
    setUnitOptions(
      b?.tipe === "tidak_habis_pakai"
        ? b.units.filter((u) => u.status === "tersedia")
        : []
    );
  };

  // cari siswa di server
  const handleSiswaSearch = async (q) => {
    if (!selectedJurusan || !selectedKelas) return;
    const res = await fetchSiswa({
      jurusan: selectedJurusan,
      kelas: selectedKelas,
      nama: q,
    });
    setSiswaOptions(res.data.data);
  };

  // cek apakah tombol Simpan boleh aktif
  const canSubmit = () => {
    if (!selectedBarangObj) return false;
    if (!selectedSiswa || pin.trim().length !== 6) return false;
    if (!peminjamPhone.trim()) return false;
    if (selectedBarangObj.tipe === "habis_pakai") {
      if (jumlah < 1 || jumlah > selectedBarangObj.stok) return false;
    }
    if (
      selectedBarangObj.tipe === "tidak_habis_pakai" &&
      selectedUnits.length === 0
    )
      return false;
    return true;
  };

  // submit: validasi PIN dulu
  const handleSubmit = async () => {
    if (!canSubmit()) return;
    // validasi PIN
    const resp = await fetch("/api/siswa/validate-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siswaId: selectedSiswa._id, pin: pin.trim() }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      setPinError(err.message || "PIN salah");
      return;
    }
    setPinError("");

    // payload
    const payload = {
      barang: selectedBarangId,
      peminjamType: "siswa",
      peminjamSiswa: selectedSiswa._id,
      peminjamPhone: peminjamPhone.trim(),
      isConsumable: selectedBarangObj.tipe === "habis_pakai",
      jumlah: selectedBarangObj.tipe === "habis_pakai" ? jumlah : undefined,
      unitKodes:
        selectedBarangObj.tipe === "tidak_habis_pakai"
          ? selectedUnits
          : undefined,
      keterangan: keterangan.trim(),
    };
    onSubmit(payload);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Peminjaman (Siswa)">
      <div className="space-y-4">
        {/* Jurusan */}
        <div>
          <label className="block text-sm font-medium">Jurusan</label>
          <select
            className="mt-1 w-full border rounded p-2"
            value={selectedJurusan}
            onChange={(e) => {
              setSelectedJurusan(e.target.value);
              setSelectedKelas("");
              setSelectedSiswa(null);
            }}
          >
            <option value="">Pilih Jurusan</option>
            <option value="RPL">RPL</option>
            <option value="DKV">DKV</option>
            <option value="TKJ">TKJ</option>
          </select>
        </div>

        {/* Kelas */}
        {selectedJurusan && (
          <div>
            <label className="block text-sm font-medium">Kelas</label>
            <select
              className="mt-1 w-full border rounded p-2"
              value={selectedKelas}
              onChange={(e) => {
                setSelectedKelas(e.target.value);
                setSelectedSiswa(null);
              }}
            >
              <option value="">Pilih Kelas</option>
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
                displayValue={(s) => s?.nama || ""}
                placeholder="Ketik nama..."
              />
              <Combobox.Options className="border rounded mt-1 max-h-40 overflow-auto">
                {siswaOptions.map((s) => (
                  <Combobox.Option key={s._id} value={s}>
                    {({ active, selected }) => (
                      <div
                        className={`${active ? "bg-gray-100" : ""} ${
                          selected ? "font-semibold" : ""
                        } p-2 cursor-pointer`}
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

        {/* PIN */}
        {selectedSiswa && (
          <div>
            <label className="block text-sm font-medium">PIN</label>
            <input
              type="password"
              className="mt-1 w-full border rounded p-2"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError("");
              }}
              placeholder="6 digit"
            />
            {pinError && <p className="text-red-600 text-sm">{pinError}</p>}
          </div>
        )}

        {/* Telepon */}
        <div>
          <label className="block text-sm font-medium">Telepon</label>
          <input
            type="tel"
            className="mt-1 w-full border rounded p-2"
            value={peminjamPhone}
            onChange={(e) => setPeminjamPhone(e.target.value)}
          />
        </div>

        {/* Pilih Barang */}
        <div>
          <label className="block text-sm font-medium">Barang</label>
          <select
            className="mt-1 w-full border rounded p-2"
            value={selectedBarangId}
            onChange={handleBarangChange}
          >
            <option value="">Pilih Barang</option>
            {barangList.map((b) => (
              <option key={b._id} value={b._id}>
                {b.nama} [{b.tipe === "habis_pakai" ? "Habis Pakai" : "Pinjam"}]
                —{" "}
                {b.tipe === "habis_pakai"
                  ? `Stok: ${b.stok}`
                  : `Unit tersedia: ${
                      b.units.filter((u) => u.status === "tersedia").length
                    }`}
              </option>
            ))}
          </select>
        </div>

        {/* Jumlah atau Pilih Unit */}
        {selectedBarangObj?.tipe === "habis_pakai" && (
          <div>
            <label className="block text-sm font-medium">Jumlah</label>
            <input
              type="number"
              min="1"
              max={selectedBarangObj.stok}
              className="mt-1 w-full border rounded p-2"
              value={jumlah}
              onChange={(e) => setJumlah(+e.target.value)}
            />
          </div>
        )}
        {selectedBarangObj?.tipe === "tidak_habis_pakai" && (
          <div>
            <label className="block text-sm font-medium">Pilih Unit</label>
            <Select
              isMulti
              options={unitOptions.map((u) => ({
                value: u.kode,
                label: u.kode,
              }))}
              value={selectedUnits.map((k) => ({ value: k, label: k }))}
              onChange={(arr) => setSelectedUnits(arr.map((a) => a.value))}
              className="mt-1"
            />
          </div>
        )}

        {/* Keterangan */}
        <div>
          <label className="block text-sm font-medium">Keterangan</label>
          <textarea
            className="mt-1 w-full border rounded p-2"
            rows={3}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
          />
        </div>

        {/* Aksi */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className={`px-4 py-2 rounded text-white ${
              canSubmit() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"
            }`}
          >
            Simpan
          </button>
        </div>
      </div>
    </Modal>
  );
}
