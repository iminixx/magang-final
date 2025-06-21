import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import FormField from "../components/FormField";

export default function BarangForm({
  formData,
  setFormData,
  errors,
  onSubmit,
  onCancel,
  isEditing = false,
}) {
  const jurusanOptions = [
    { value: "RPL", label: "RPL (Rekayasa Perangkat Lunak)" },
    { value: "DKV", label: "DKV (Desain Komunikasi Visual)" },
    { value: "TKJ", label: "TKJ (Teknik Komputer Jaringan)" },
  ];

  const tipeOptions = [
    { value: "habis_pakai", label: "Habis Pakai" },
    { value: "tidak_habis_pakai", label: "Tidak Habis Pakai" },
  ];

  const statusOptions = [
    { value: "tersedia", label: "Tersedia" },
    { value: "rusak", label: "Rusak" },
    { value: "hilang", label: "Hilang" },
  ];

  const unitStatusOptions = [
    { value: "tersedia", label: "Tersedia" },
    { value: "dipinjam", label: "Dipinjam" },
    { value: "rusak", label: "Rusak" },
    { value: "hilang", label: "Hilang" },
  ];

  const [loadingKode, setLoadingKode] = useState(false);
  const [nextPreviewSeq, setNextPreviewSeq] = useState(null);

  // Reset preview when nama or jurusan changes
  useEffect(() => {
    setNextPreviewSeq(null);
  }, [formData.nama, formData.jurusan]);

  const handleAddUnit = async () => {
    if (!formData.nama.trim() || !formData.jurusan) {
      alert("Isi Nama Barang dan Jurusan terlebih dulu untuk preview kode.");
      return;
    }
    setLoadingKode(true);
    try {
      const abrev = formData.nama
        .trim()
        .replace(/\s+/g, "-")
        .toUpperCase()
        .slice(0, 3);
      let seqNum;

      if (nextPreviewSeq === null) {
        // fetch peek sequence
        const res = await fetch(
          `/api/barang/nextKode?jurusan=${encodeURIComponent(
            formData.jurusan
          )}&nama=${encodeURIComponent(formData.nama)}`
        );
        if (!res.ok) throw new Error("Gagal mengambil preview kode");
        const { kode } = await res.json();
        seqNum = parseInt(kode.split("-").pop(), 10);
      } else {
        seqNum = nextPreviewSeq;
      }

      const strSeq = String(seqNum).padStart(3, "000");
      const kodeFull = `${formData.jurusan}-${abrev}-${strSeq}`;

      setFormData((prev) => ({
        ...prev,
        units: [...(prev.units || []), { kode: kodeFull, status: "tersedia" }],
      }));
      setNextPreviewSeq(seqNum + 1);
    } catch (err) {
      console.error("handleAddUnit:", err);
      alert(err.message);
    } finally {
      setLoadingKode(false);
    }
  };

  const handleUnitChange = (index, field, value) => {
    const newUnits = (formData.units || []).map((u, idx) =>
      idx === index ? { ...u, [field]: value } : u
    );
    setFormData({ ...formData, units: newUnits });
  };

  const handleRemoveUnit = (index) => {
    const newUnits = (formData.units || []).filter((_, idx) => idx !== index);
    setFormData({ ...formData, units: newUnits });
  };

  return (
    <div className="space-y-4">
      <FormField label="Nama Barang" required error={errors.nama}>
        <input
          type="text"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.nama ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Masukkan nama barang"
        />
      </FormField>

      <FormField label="Jurusan" required error={errors.jurusan}>
        <select
          value={formData.jurusan}
          onChange={(e) =>
            setFormData({ ...formData, jurusan: e.target.value })
          }
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.jurusan ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Pilih Jurusan</option>
          {jurusanOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tipe Barang" required error={errors.tipe}>
        <select
          value={formData.tipe}
          onChange={(e) =>
            setFormData({
              ...formData,
              tipe: e.target.value,
              stok: e.target.value === "habis_pakai" ? formData.stok : 0,
              status:
                e.target.value === "habis_pakai" ? formData.status : "tersedia",
              units:
                e.target.value === "tidak_habis_pakai" ? formData.units : [],
              maxDurasiPinjam:
                e.target.value === "tidak_habis_pakai"
                  ? formData.maxDurasiPinjam
                  : "",
              deskripsi:
                e.target.value === "tidak_habis_pakai"
                  ? formData.deskripsi
                  : "",
            })
          }
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.tipe ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Pilih Tipe</option>
          {tipeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>

      {formData.tipe === "habis_pakai" && (
        <>
          <FormField label="Stok" required error={errors.stok}>
            <input
              type="number"
              min="0"
              value={formData.stok}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stok: parseInt(e.target.value) || 0,
                })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.stok ? "border-red-500" : "border-gray-300"
              }`}
            />
          </FormField>
          <FormField label="Status" required error={errors.status}>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.status ? "border-red-500" : "border-gray-300"
              }`}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )}

      {formData.tipe === "tidak_habis_pakai" && (
        <>
          <FormField
            label="Max Durasi Pinjam (hari)"
            error={errors.maxDurasiPinjam}
          >
            <input
              type="number"
              min="1"
              value={formData.maxDurasiPinjam}
              onChange={(e) =>
                setFormData({ ...formData, maxDurasiPinjam: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxDurasiPinjam ? "border-red-500" : "border-gray-300"
              }`}
            />
          </FormField>
          <FormField label="Deskripsi" error={errors.deskripsi}>
            <textarea
              value={formData.deskripsi}
              onChange={(e) =>
                setFormData({ ...formData, deskripsi: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
          <FormField label="Units" required error={errors.units}>
            <div>
              {formData.units.map((u, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 items-center mb-2 border p-2 rounded-lg"
                >
                  <div className="flex-1">
                    <label className="text-sm">Kode Unit</label>
                    <input
                      type="text"
                      value={u.kode}
                      readOnly
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm">Status Unit</label>
                    <select
                      value={u.status}
                      onChange={(e) =>
                        handleUnitChange(idx, "status", e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {unitStatusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveUnit(idx)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddUnit}
                disabled={loadingKode}
                className={`flex items-center gap-2 px-3 py-1 rounded ${
                  loadingKode
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Plus className="w-4 h-4" />
                {loadingKode ? "Mengambil Preview…" : "Tambah Unit"}
              </button>
            </div>
          </FormField>
        </>
      )}

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" /> {isEditing ? "Update" : "Simpan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
