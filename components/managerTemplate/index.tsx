"use client";

import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { removeCookie, GetCookie } from "@/lib/client-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IUser } from "@/app/types";
import { Menu, ChevronDown, LogOut, ExternalLink } from "lucide-react";

type MenuType = {
  id: string;
  icon: ReactNode;
  path: string;
  label: string;
  adminOnly?: boolean;
};

type ManagerProp = {
  children: ReactNode;
  id: string;
  user?: IUser | null;
  title: string;
  menuList: MenuType[];
};

const ManagerTemplate = ({ children, id, title, menuList, user }: ManagerProp) => {
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const name = GetCookie("name");
    const role = GetCookie("role");
    if (name) setUserName(name);
    if (role) setUserRole(role);
  }, []);

  const handleLogout = () => {
    removeCookie("token");
    removeCookie("id");
    removeCookie("name");
    removeCookie("role");
    router.replace("/login");
  };

  // Filter menu khusus ADMIN jika yang login adalah STAFF
  const filteredMenus = menuList.filter((m) => !m.adminOnly || userRole === "ADMIN");

  return (
    <div className="w-full min-h-screen bg-[#FCF0E4] text-[#292D2B] flex overflow-x-hidden">
      {/* Persistent Desktop Sidebar + Mobile Drawer */}
      <Sidebar
        isShow={isShow}
        setIsShow={setIsShow}
        id={id}
        menuList={filteredMenus}
        user={user ?? null}
        userName={userName}
        userRole={userRole}
        handleLogout={handleLogout}
      />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#FFF9F2]/95 backdrop-blur-md border-b border-[#E8E2D9] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsShow(true)}
              className="lg:hidden p-2 rounded-xl bg-white hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#245F52] transition cursor-pointer"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-[#292D2B] leading-tight">
                {title}
              </h1>
              <p className="text-[11px] font-bold text-[#245F52] uppercase tracking-wider">
                Q-Bite Control Center • MB ITS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#DCEAE5]/70 border border-[#E8E2D9] text-xs font-bold text-[#245F52] transition"
            >
              <span>Lihat Web Pemesan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* User Profile & Logout Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#DCEAE5]/50 transition border border-[#E8E2D9] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#245F52] text-[#F8CF5F] flex items-center justify-center font-extrabold text-xs">
                  {userName ? userName.charAt(0).toUpperCase() : "Q"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-bold text-xs text-[#292D2B] leading-tight">
                    {userName || "Pengurus"}
                  </span>
                  <span className="text-[10px] text-[#ED7134] font-extrabold">
                    {userRole || "STAFF"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#777D78]" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg py-2 z-50 border border-[#E8E2D9] text-xs">
                  <div className="px-4 py-2 border-b border-[#E8E2D9] mb-1">
                    <p className="text-[11px] text-[#777D78]">Login sebagai ({userRole})</p>
                    <p className="font-bold text-[#292D2B] truncate">{userName || "Pengurus"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[#B93832] hover:bg-[#FCE5E3] font-bold cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Dynamic Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

export default ManagerTemplate;