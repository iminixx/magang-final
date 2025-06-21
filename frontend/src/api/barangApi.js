import axios from "axios";

const API_BASE = "http://localhost:5000/barang";

export const fetchBarangList = (params) => {
  return axios.get(BASE_URL, { params });
};

export const fetchBarangDetail = (id) => {
  return axios.get(`${BASE_URL}/${id}`);
};

export const searchBarang = (params) => {
  return axios.get(`${BASE_URL}/search`, { params });
};

export const getBarang = (params) => axios.get(API_BASE, { params });
export const getBarangById = (id) => axios.get(`${API_BASE}/${id}`);
export const addBarang = (data) => axios.post(API_BASE, data);
export const updateBarang = (id, data) => axios.put(`${API_BASE}/${id}`, data);
export const deleteBarang = (id) => axios.delete(`${API_BASE}/${id}`);
import axios from "axios";
