"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Receipt, UtensilsCrossed } from "lucide-react";

interface CustomerHeaderProps {
  cartCount?: number;
  recentOrdersCount?: number;
  onOpenCart?: () => void;
  onOpenOrders?: () => void;
}

export default function CustomerHeader({
  cartCount = 0,
  recentOrdersCount = 0,
  onOpenCart,
  onOpenOrders,
}: CustomerHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FCF0E4]/95 backdrop-blur-md border-b border-[#E8E2D9]">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo (shrink-0 agar tidak gepeng di layar HP) */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#245F52] flex items-center justify-center p-1.5 shadow-sm group-hover:bg-[#19483F] transition">
            <Image
              alt="Q-Bite Logo"
              width={32}
              height={32}
              src="/image/logoNOBG.png"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#245F52] block leading-none truncate">
              Q-Bite
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-[#777D78] mt-0.5 truncate">
              Pre-Order Kantin MB ITS
            </span>
          </div>
        </Link>

        {/* Navigasi Tengah (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#292D2B]">
          <Link href="/#jadwal" className="hover:text-[#245F52] transition">
            Jadwal Sesi
          </Link>
          <Link href="/#menu" className="hover:text-[#245F52] transition flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-[#245F52]" />
            Menu Kantin
          </Link>
          {onOpenOrders ? (
            <button
              type="button"
              onClick={onOpenOrders}
              className="hover:text-[#245F52] transition flex items-center gap-1.5 cursor-pointer"
            >
              My Orders
              {recentOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DCEAE5] text-[#245F52]">
                  {recentOrdersCount}
                </span>
              )}
            </button>
          ) : (
            <Link href="/" className="hover:text-[#245F52] transition">
              My Orders
            </Link>
          )}
        </nav>

        {/* Action Buttons Kanan (shrink-0 & compact di HP) */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {onOpenOrders && (
            <button
              type="button"
              onClick={onOpenOrders}
              className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#E8E2D9] text-xs font-semibold text-[#292D2B] hover:border-[#245F52] transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 shrink-0 text-[#245F52]" />
              <span>Orders</span>
              {recentOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#245F52] text-white text-[10px] flex items-center justify-center font-bold">
                  {recentOrdersCount}
                </span>
              )}
            </button>
          )}

          {onOpenCart ? (
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Cart</span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-white/20 text-white text-[11px] sm:text-xs font-extrabold">
                {cartCount}
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#245F52] transition"
            >
              Portal Pengurus
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}