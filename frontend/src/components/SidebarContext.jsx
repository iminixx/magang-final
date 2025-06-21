// SidebarContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext();

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }) {
  // buka/tutup sidebar (khusus mobile < lg)
  const [isOpen, setIsOpen] = useState(false);
  // submenu yang sedang terbuka, format: label string atau null
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // tutup otomatis saat lebar ≥ 1024
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen((p) => !p);
  const toggleSubmenu = (label) =>
    setOpenSubmenu((p) => (p === label ? null : label));

  return (
    <SidebarContext.Provider
      value={{ isOpen, toggleSidebar, openSubmenu, toggleSubmenu }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
