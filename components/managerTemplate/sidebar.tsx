"use client";

import { ReactNode } from "react";
import MenuItem from "./menuItem";
import { IUser } from "@/app/types";
import { X, LogOut } from "lucide-react";
import Image from "next/image";

type MenuType = {
  id: string;
  icon: ReactNode;
  path: string;
  label: string;
  adminOnly?: boolean;
};

type SidebarProps = {
  isShow: boolean;
  setIsShow: (show: boolean) => void;
  id: string;
  menuList: MenuType[];
  user: IUser | null;
  userName: string;
  userRole: string;
  handleLogout: () => void;
};

const Sidebar = ({
  isShow,
  setIsShow,
  id,
  menuList,
  userName,
  userRole,
  handleLogout,
}: SidebarProps) => {
  return (
    <>
      {/* Backdrop Mobile */}
      {isShow && (
        <div
          className="fixed inset-0 bg-[#292D2B]/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsShow(false)}
        />
      )}

      {/* Persistent Desktop Sidebar + Slide-over Mobile Drawer */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-68 shrink-0 bg-[#FFF9F2] border-r border-[#E8E2D9] z-50 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out ${isShow ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-[#E8E2D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#245F52] flex items-center justify-center p-1.5 shadow-2xs">
                <Image
                  src="/image/logoNOBG.png"
                  alt="Q-Bite Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-[#292D2B] tracking-tight leading-none">
                  Q-BITE
                </h2>
                <p className="text-[10px] text-[#ED7134] tracking-wider uppercase font-extrabold mt-1">
                  Control Center
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsShow(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] hover:text-[#292D2B] transition cursor-pointer"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="w-full mb-6 p-3 rounded-xl flex items-center gap-3 border border-[#E8E2D9] bg-white">
            <div className="w-9 h-9 rounded-full bg-[#DCEAE5] text-[#245F52] flex items-center justify-center font-extrabold text-sm shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : "Q"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-extrabold text-[#292D2B] truncate">
                {userName || "Pengurus Q-Bite"}
              </p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#FBE4D6] text-[#C95724] text-[10px] font-extrabold uppercase">
                {userRole || "STAFF"}
              </span>
            </div>
          </div>

          {/* Navigation Menu List */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-extrabold text-[#777D78] uppercase tracking-wider px-2 mb-2">
              Menu Operasional
            </p>
            {menuList.map((menu, index) => (
              <MenuItem
                icon={menu.icon}
                label={menu.label}
                path={menu.path}
                active={menu.id === id}
                onClick={() => setIsShow(false)}
                key={`keyMenu${index}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-[#E8E2D9]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCE5E3] hover:bg-[#B93832] text-[#B93832] hover:text-white transition-all font-bold text-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;