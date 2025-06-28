import React, { useRef, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Users,
  LogOut,
  X,
  User,
  FileChartColumn,
  ChevronDown,
  Bell,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

const allMenuItems = [
  { icon: Home, label: "Dashboard", to: "/", roles: ["admin", "user"] },
  {
    icon: Package,
    label: "Manage Items",
    to: "/manage-items",
    roles: ["admin"],
  },
  {
    icon: Package,
    label: "Manage Siswa",
    to: "/manage-siswa",
    roles: ["admin"],
  },
  {
    icon: Users,
    label: "Manage Peminjaman",
    roles: ["admin", "user"],
    subItems: [
      {
        label: "Daftar Peminjaman",
        to: "/peminjaman/create",
        roles: ["admin", "user"],
      },
      {
        label: "Daftar Peminjaman Lainnya",
        to: "/peminjaman-lainnya/create",
        roles: ["admin"],
      },
      {
        label: "Status Peminjaman",
        to: "/peminjaman/list",
        roles: ["admin", "user"],
      },
      {
        icon: Package,
        label: "Pengembalian",
        to: "/return-item",
        roles: ["admin"],
      },
    ],
  },
  {
    icon: FileChartColumn,
    label: "Laporan",
    to: "/reports",
    roles: ["admin"],
    subItems: [
      { label: "Logs", to: "/reports", roles: ["admin"] },
      { label: "History", to: "/history", roles: ["admin"] },
    ],
  },
];

export default function Sidebar() {
  const { isOpen, toggleSidebar, openSubmenu, toggleSubmenu } = useSidebar();
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role === "admin" ? "admin" : "user";

  const [jumlahApproval, setJumlahApproval] = useState(0);

  useEffect(() => {
    const fetchJumlahPending = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/peminjaman?limit=1000&page=1"
        );
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          const pendingCount = json.data.filter(
            (loan) => loan.status === "pending"
          ).length;
          setJumlahApproval(pendingCount);
        } else {
          setJumlahApproval(0);
        }
      } catch (err) {
        console.error("Gagal ambil data peminjaman:", err);
        setJumlahApproval(0);
      }
    };

    fetchJumlahPending();
    const intervalId = setInterval(fetchJumlahPending, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
    window.location.reload();
  };

  const subRefs = useRef({});
  const [heights, setHeights] = useState({});

  useEffect(() => {
    allMenuItems.forEach((item) => {
      if (item.subItems && subRefs.current[item.label]) {
        heights[item.label] = subRefs.current[item.label].scrollHeight || 0;
      }
    });
    setHeights({ ...heights });
  }, []);

  const filteredMenuItems = allMenuItems.filter((item) =>
    item.roles?.includes(role)
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-lg transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky lg:top-0
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-xl font-bold">Inventaris Sekolah</h2>
            <button
              onClick={toggleSidebar}
              className="rounded p-1 hover:bg-gray-100 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-2 border-b px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <User size={16} className="text-white" />
            </div>
            <span className="text-gray-700">{user?.nama || "Pengguna"}</span>
          </div>

          <nav className="mt-4 flex-1 overflow-auto">
            {filteredMenuItems.map((item) => {
              if (!item.subItems)
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 transition-colors
                       hover:bg-blue-50 hover:text-blue-600 text-gray-700
                       ${
                         isActive
                           ? "border-blue-600 bg-blue-50 text-blue-600 border-r-2"
                           : ""
                       }`
                    }
                  >
                    <item.icon size={20} className="mr-3" />
                    {item.label}
                  </NavLink>
                );

              const isOpenSub = openSubmenu === item.label;
              const filteredSubItems = item.subItems.filter(
                (sub) => !sub.roles || sub.roles.includes(role)
              );

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`flex w-full items-center px-4 py-3 text-left transition-colors
                                 hover:bg-blue-50 hover:text-blue-600 text-gray-700`}
                  >
                    <item.icon size={20} className="mr-3" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 ${
                        isOpenSub ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>

                  <div
                    ref={(el) => (subRefs.current[item.label] = el)}
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      height: isOpenSub ? `${heights[item.label]}px` : "0px",
                    }}
                  >
                    <ul className="ml-8 mt-1 flex flex-col">
                      {filteredSubItems.map((sub) => (
                        <NavLink
                          key={sub.label}
                          to={sub.to}
                          className={({ isActive }) =>
                            `flex items-center py-2 text-sm transition-colors
                             hover:text-blue-600
                             ${
                               isActive
                                 ? "text-blue-600 font-medium"
                                 : "text-gray-600"
                             }`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}

            {role === "admin" && (
              <NavLink
                to="/approval"
                className={({ isActive }) =>
                  `relative flex items-center px-4 py-3 transition-colors
                   hover:bg-blue-50 hover:text-blue-600 text-gray-700
                   ${
                     isActive
                       ? "border-blue-600 bg-blue-50 text-blue-600 border-r-2"
                       : ""
                   }`
                }
              >
                <Bell size={20} className="mr-3" />
                Approval
                {jumlahApproval > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    {jumlahApproval}
                  </span>
                )}
              </NavLink>
            )}
          </nav>

          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded px-4 py-2 transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={20} className="mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
