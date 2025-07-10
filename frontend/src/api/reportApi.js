import api from "../utils/api";

export const fetchLogs = async (filters = {}) => {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.userId) params.userId = filters.userId;
  if (filters.action) params.action = filters.action; // <— ganti dari filters.aksi

  const response = await api.get("/logs", { params });
  return response.data;
};

export const fetchPeminjamanHistory = async (filters = {}) => {
  const params = {};

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.returnStart) params.returnStart = filters.returnStart;
  if (filters.returnEnd) params.returnEnd = filters.returnEnd;
  if (filters.peminjamNama) params.peminjamNama = filters.peminjamNama;
  if (filters.status) params.status = filters.status;
  if (filters.jurusan) params.jurusan = filters.jurusan;

  const response = await api.get("/peminjaman/history", { params });
  return response.data;
};
