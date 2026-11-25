"use client";

import React from "react";
import Link from "next/link";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
  onClick?: () => void;
}

const MenuItem = ({ icon, label, path, active, onClick }: MenuItemProps) => {
  return (
    <Link
      href={path}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
        active
          ? "bg-[#245F52] text-white shadow-xs"
          : "text-[#292D2B] hover:bg-[#DCEAE5]/70 hover:text-[#245F52]"
      }`}
    >
      <span className={active ? "text-[#F8CF5F]" : "text-[#245F52]"}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
};

export default MenuItem;