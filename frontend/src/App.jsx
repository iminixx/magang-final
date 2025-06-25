import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ManageItemsPage from "./pages/ManageItemsPage";
import PeminjamanManagement from "./pages/ManagePeminjaman"; // halaman untuk membuat peminjaman (sebelumnya ManagePeminjaman.jsx)
import PeminjamanList from "./pages/PeminjamanList"; // **TAMBAHAN**: halaman baru daftar peminjaman
import AdminApproval from "./pages/ApprovalPage";
import ReportsPage from "./pages/ReportsPage";
import HistoryPage from "./pages/HistoryPage";
import ManageSiswaPage from "./pages/ManageSiswaPage";
import PeminjamanLainnyaPage from "./pages/ManagePeminjamanLainnya";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={() => setIsAuthenticated(true)} />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Layout>
              <DashboardPage />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/manage-items"
        element={
          isAuthenticated ? (
            <Layout>
              <ManageItemsPage />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/peminjaman/create"
        element={
          isAuthenticated ? (
            <Layout>
              <PeminjamanManagement />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/peminjaman-lainnya/create"
        element={
          isAuthenticated ? (
            <Layout>
              <PeminjamanLainnyaPage />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 2. Halaman untuk melihat daftar peminjaman (PeminjamanList) */}
      <Route
        path="/peminjaman/list" // **TAMBAHAN**
        element={
          isAuthenticated ? (
            <Layout>
              <PeminjamanList />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* =================================================== */}

      <Route
        path="/approval"
        element={
          isAuthenticated ? (
            <Layout>
              <AdminApproval />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/reports"
        element={
          isAuthenticated ? (
            <Layout>
              <ReportsPage />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/history"
        element={
          isAuthenticated ? (
            <Layout>
              <HistoryPage />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/manage-siswa"
        element={
          isAuthenticated ? (
            <Layout>
              <ManageSiswaPage />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
