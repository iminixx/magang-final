export const convertToCSV = (data) => {
  const headers = [
    "Nama",
    "Jurusan",
    "Tipe",
    "Stok",
    "Status",
    "Stok Dipinjam",
    "Dibuat",
  ];

  const rows = data.map((item) => [
    item.nama,
    item.jurusan,
    item.tipe,
    item.stok,
    item.status,
    item.stok_dipinjam || 0,
    new Date(item.createdAt).toLocaleDateString("id-ID"),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
};

export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
