"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { get } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { IOrder } from "@/app/types";
import {
  Wallet,
  ShoppingBag,
  ClockAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  MapPin,
  Store,
} from "lucide-react";

interface ExtendedOrder extends IOrder {
  deliveryMethod?: "DROP_POINT" | "SELF_PICKUP";
  deliveryFee?: number;
}

export default function ManagerDashboardPage() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [unexportedPaidCount, setUnexportedPaidCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const token = GetCookie("token");
    const res = await get("/orders/admin/list", token);
    if (res.status && res.data?.status) {
      setOrders(res.data.data || []);
      setUnexportedPaidCount(res.data.unexportedPaidCount || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const waitingCount = orders.filter((o) => o.status === "WAITING_VERIFICATION").length;
  const paidOrCompleted = orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED");
  const totalRevenue = paidOrCompleted.reduce((acc, o) => acc + o.totalAmount, 0);
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#292D2B]">
            Ringkasan Operasional Q-Bite
          </h1>
          <p className="text-xs text-[#777D78] mt-1">
            Pantau antrean verifikasi QRIS, omzet terverifikasi, dan kesiapan rekap dapur.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFF9F2] hover:bg-[#DCEAE5] border border-[#E8E2D9] text-xs font-bold text-[#245F52] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Alert Banner: Pesanan Lunas Susulan Belum Ter-export */}
      {unexportedPaidCount > 0 && (
        <div className="p-4 rounded-2xl border border-[#F8CF5F] bg-[#FFF4D5] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8CF5F]/40 text-[#946200] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#946200]">
                Ada {unexportedPaidCount} pesanan lunas (PAID) yang belum masuk rekap Excel terbaru!
              </p>
              <p className="text-xs text-[#946200]/85 mt-0.5">
                Segera buka halaman Pesanan & Verifikasi untuk mengunduh rekap susulan ke dapur kantin.
              </p>
            </div>
          </div>
          <Link
            href="/manager/transaksi"
            className="px-4 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white font-bold text-xs transition inline-flex items-center gap-1.5"
          >
            Cek & Export <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777D78]">Menunggu Verifikasi</span>
            <div className="w-9 h-9 rounded-xl bg-[#FBE4D6] text-[#ED7134] flex items-center justify-center">
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#ED7134] mt-3">{waitingCount}</p>
          <p className="text-[11px] text-[#777D78] mt-1">Bukti QRIS perlu dicek</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777D78]">Omzet Terverifikasi</span>
            <div className="w-9 h-9 rounded-xl bg-[#DCEAE5] text-[#245F52] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#245F52] mt-3">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="text-[11px] text-[#777D78] mt-1">
            Dari {paidOrCompleted.length} pesanan lunas
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777D78]">Total Semua Order</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF4D5] text-[#946200] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#292D2B] mt-3">{orders.length}</p>
          <p className="text-[11px] text-[#777D78] mt-1">Seluruh status transaksi</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777D78]">Selesai Diambil</span>
            <div className="w-9 h-9 rounded-xl bg-[#DFF2E5] text-[#246B40] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#246B40] mt-3">{completedCount}</p>
          <p className="text-[11px] text-[#777D78] mt-1">Terverifikasi PIN 4-digit</p>
        </div>
      </div>

      {/* Antrean Terbaru Menunggu Verifikasi */}
      <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E2D9]">
          <h2 className="text-base font-extrabold text-[#292D2B]">Antrean Verifikasi Terbaru</h2>
          <Link
            href="/manager/transaksi"
            className="text-xs font-bold text-[#245F52] hover:text-[#19483F] inline-flex items-center gap-1"
          >
            Kelola Semua Pesanan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {waitingCount === 0 ? (
          <p className="text-sm text-[#777D78] py-8 text-center">
            Tidak ada bukti transfer yang menunggu verifikasi saat ini.
          </p>
        ) : (
          <div className="space-y-3">
            {orders
              .filter((o) => o.status === "WAITING_VERIFICATION")
              .slice(0, 5)
              .map((order) => {
                const isSelfPickup =
                  order.deliveryMethod === "SELF_PICKUP" || order.deliveryFee === 0;
                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-[#FFF9F2] border border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-[#245F52]">
                          {order.orderCode}
                        </span>
                        <span className="text-xs font-bold text-[#292D2B]">
                          • {order.customerName}
                        </span>
                        {isSelfPickup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DFF2E5] text-[#246B40] text-[10px] font-bold">
                            <Store className="w-3 h-3" /> Ambil di Kantin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FBE4D6] text-[#C95724] text-[10px] font-bold">
                            <MapPin className="w-3 h-3" /> Drop-Point MB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#777D78] mt-1">
                        {order.session?.name} ({order.deliveryDate.split("T")[0]}) —{" "}
                        <span className="text-[#245F52] font-extrabold">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </p>
                    </div>
                    <Link
                      href="/manager/transaksi"
                      className="px-4 py-2 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-bold transition"
                    >
                      Periksa Bukti
                    </Link>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}