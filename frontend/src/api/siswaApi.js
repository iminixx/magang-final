import axios from "axios";
const BASE_URL = "/api/siswa";

export const fetchSiswa = (params) => axios.get(BASE_URL, { params });
export const createSiswa = (data) => axios.post(BASE_URL, data);
export const updateSiswa = (id, data) => axios.put(`${BASE_URL}/${id}`, data);
export const deleteSiswa = (id) => axios.delete(`${BASE_URL}/${id}`);
