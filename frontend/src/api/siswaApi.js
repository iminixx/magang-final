import axios from "axios";
const BASE_URL = "/api/siswa";

export const fetchSiswa = (params) => {
  return axios.get("/api/siswa/filter", { params });
};
export const createSiswa = (data) => axios.post(BASE_URL, data);
export const updateSiswa = (id, data) => axios.put(`${BASE_URL}/${id}`, data);
export const deleteSiswa = (id) => axios.delete(`${BASE_URL}/${id}`);
