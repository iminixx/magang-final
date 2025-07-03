import { useState, useEffect, useCallback } from "react";

const useBarang = (
  baseURL,
  initialLimit,
  jurusanFilter,
  statusFilter,
  searchTerm
) => {
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const token = localStorage.getItem("token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", initialLimit);

      if (jurusanFilter) params.append("jurusan", jurusanFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("nama", searchTerm);

      const url = `${baseURL}?${params.toString()}`;
      console.log("UseBarang.js: Fetch URL:", url);

      const res = await fetch(url, {
        headers: {
          ...authHeader,
        },
      });
      const json = await res.json();

      if (!res.ok) {
        console.error("Gagal fetch barang:", json);
        setBarang([]);
        setTotal(0);
        setTotalPages(1);
      } else {
        setBarang(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetchItems:", err);
      setBarang([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    baseURL,
    currentPage,
    initialLimit,
    jurusanFilter,
    statusFilter,
    searchTerm,
    token, // penting untuk re-run kalau token berubah
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const deleteBarang = async (id) => {
    if (!id) return;
    try {
      const response = await fetch(`${baseURL}/${id}`, {
        method: "DELETE",
        headers: {
          ...authHeader,
        },
      });
      const data = await response.json();

      if (response.ok) {
        let newTotal = total - 1;
        const newTotalPages = Math.max(1, Math.ceil(newTotal / initialLimit));

        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        } else {
          fetchItems();
        }
      } else {
        alert(data.message || "Gagal menghapus barang (server returned error)");
      }
    } catch (err) {
      console.error("Error deleteBarang:", err);
      alert("Gagal menghapus barang (network error)");
    }
  };

  const updateBarang = async (id, updatedData) => {
    if (!id) return;
    try {
      const response = await fetch(`${baseURL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();

      if (response.ok) {
        fetchItems();
      } else {
        if (data.errors) {
          console.error("Validation errors:", data.errors);
          alert("Validasi gagal: " + JSON.stringify(data.errors));
        } else {
          alert(
            data.message || "Gagal mengupdate barang (server returned error)"
          );
        }
      }
    } catch (err) {
      console.error("Error updateBarang:", err);
      alert("Gagal mengupdate barang (network error)");
    }
  };

  return {
    barang,
    loading,
    currentPage,
    totalPages,
    total,
    setCurrentPage,
    fetchItems,
    deleteBarang,
    updateBarang,
  };
};

export default useBarang;
