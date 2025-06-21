// src/components/usePeminjaman.js
import { useState, useEffect } from "react";

export default function usePeminjaman(baseUrl) {
  const [data, setData] = useState([]); // daftar peminjaman
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10; // disesuaikan di komponen

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}?page=${currentPage}&limit=${itemsPerPage}`
      );
      const result = await res.json();
      // Kita asumsikan API mengembalikan bentuk:
      // { data: [ ... ], total, totalPages, currentPage }
      // dan setiap item sudah di-populate field barang & peminjamSiswa
      setData(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error("usePeminjaman: gagal fetch data", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // fungsi untuk meng‐set searchTerm dari komponen
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return {
    data,
    loading,
    searchTerm,
    handleSearch,
    currentPage,
    totalPages,
    setCurrentPage,
    fetchData,
  };
}
