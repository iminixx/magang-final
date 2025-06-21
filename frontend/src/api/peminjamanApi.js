import axios from "axios";

const BASE_URL = "/api/peminjaman";

export const fetchPeminjaman = (params) => {
  return axios.get(BASE_URL, { params });
};

export const createPeminjaman = (payload) => {
  return axios.post(BASE_URL, payload);
};

export const approvePeminjaman = (id) => {
  return axios.put(`${BASE_URL}/approve/${id}`);
};

export const rejectPeminjaman = (id) => {
  return axios.put(`${BASE_URL}/reject/${id}`);
};

export const returnPeminjaman = (id) => {
  return axios.put(`${BASE_URL}/${id}/return`);
};

export const deletePeminjaman = (id) => {
  return axios.delete(`${BASE_URL}/${id}`);
};

export const fetchPeminjamanHistory = (params) => {
  return axios.get(`${BASE_URL}/history`, { params });
};
