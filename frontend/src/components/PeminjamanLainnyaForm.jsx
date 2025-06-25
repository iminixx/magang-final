import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Select from "react-select";

export default function PeminjamanLainnyaForm({
  isOpen,
  onClose,
  onSubmit,
  barangList,
  initialBarang,
}) {
  const [nama, setNama] = useState("");
  const [asal, setAsal] = useState("");
  const [peminjamPhone, setPeminjamPhone] = useState("");

  // same barang/amount logic as siswa form
  const [selectedBarangId, setSelectedBarangId] = useState("");
  const [selectedBarangObj, setSelectedBarangObj] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [unitOptions, setUnitOptions] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [keterangan, setKeterangan] = useState("");

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

  const canSubmit = () => {
    if (!nama.trim() || !asal.trim() || !peminjamPhone.trim()) return false;
    if (!selectedBarangObj) return false;
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

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const payload = {
      barang: selectedBarangId,
      peminjamType: "lainnya",
      peminjamNama: nama.trim(),
      peminjamAsal: asal.trim(),
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
    <Modal isOpen={isOpen} onClose={onClose} title="Peminjaman (Lainnya)">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nama Peminjam</label>
          <input
            className="mt-1 w-full border rounded p-2"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Asal/Instansi</label>
          <input
            className="mt-1 w-full border rounded p-2"
            value={asal}
            onChange={(e) => setAsal(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Telepon</label>
          <input
            className="mt-1 w-full border rounded p-2"
            value={peminjamPhone}
            onChange={(e) => setPeminjamPhone(e.target.value)}
          />
        </div>

        {/* Barang selection, jumlah/unit, keterangan sama seperti siswa form */}
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
              </option>
            ))}
          </select>
        </div>

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

        <div>
          <label className="block text-sm font-medium">Keterangan</label>
          <textarea
            className="mt-1 w-full border rounded p-2"
            rows={3}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
          />
        </div>

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
