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
