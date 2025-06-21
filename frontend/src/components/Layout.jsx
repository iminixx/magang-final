// Layout.jsx
import React from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

function Header() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="flex items-center gap-2 border-b px-4 py-3 lg:hidden">
      <button onClick={toggleSidebar} className="rounded p-1 hover:bg-gray-100">
        <Menu size={24} />
      </button>
      <h1 className="text-lg font-semibold">Inventaris Sekolah</h1>
    </header>
  );
}

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      {/* 
        Sebelumnya ada: 
          <div className="flex min-h-screen overflow-hidden">
        Ubah menjadi (hilangkan overflow-hidden):
      */}
      <div className="flex min-h-screen">
        <Sidebar />

        {/* 
          Sebelumnya: <div className="flex flex-1 flex-col min-w-0">
          Tetap kita simpan min-w-0 agar flex-1 boleh mengecil bila kontennya horizontal-scroll,
          tapi kita hapus overflow-hidden di sini:
        */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* header (mobile only) */}
          <Header />

          {/* 
            Hapus overflow-auto agar konten ikut scroll pada window, bukan di dalam <main>.
            Kalau `<main>` tidak overflow-auto, maka halaman akan panjang (menambah scroll window),
            dan sidebar akan ikut “terbawa” saat di‐scroll.
          */}
          <main className="flex-1 p-6 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
