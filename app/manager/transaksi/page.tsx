"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { get, patch, downloadExcel } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { IOrder, IOrderSession, OrderStatus } from "@/app/types";
import { BASE_IMAGE_PROOF } from "@/global";
import { ToastContainer, toast } from "react-toastify";
import {
  FileSpreadsheet,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  KeyRound,
  MessageCircle,
  RefreshCw,
  MapPin,
  Store,
  X,
} from "lucide-react";

interface ExtendedOrder extends IOrder {
  deliveryMethod?: "DROP_POINT" | "SELF_PICKUP";
  subtotalAmount?: number;
  deliveryFee?: number;
}

const STATUS_META: Record<OrderStatus, { label: string; badgeClass: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", badgeClass: "badge-pending" },
  WAITING_VERIFICATION: { label: "Waiting Verification", badgeClass: "badge-waiting" },
  PAID: { label: "Paid", badgeClass: "badge-paid" },
  REJECTED: { label: "Rejected", badgeClass: "badge-rejected" },
  EXPIRED: { label: "Expired", badgeClass: "badge-expired" },
  COMPLETED: { label: "Completed", badgeClass: "badge-completed" },
};

export default function TransaksiPage() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [sessions, setSessions] = useState<IOrderSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filters
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterSession, setFilterSession] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMethod, setFilterMethod] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Verifikasi Bukti
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [rejectMode, setRejectMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Modal PIN 4-Digit Berurutan (COMPLETED)
  const [completeOrder, setCompleteOrder] = useState<ExtendedOrder | null>(null);
  const [pinValue, setPinValue] = useState<string>("");
  const hiddenPinInputRef = useRef<HTMLInputElement | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const token = GetCookie("token") || "";
    const params = new URLSearchParams();
    if (filterDate) params.append("deliveryDate", filterDate);
    if (filterSession) params.append("sessionId", filterSession);
    if (filterStatus) params.append("status", filterStatus);
    if (filterMethod) params.append("deliveryMethod", filterMethod);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const res = await get(`/orders/admin/list${queryStr}`, token);
    if (res.status && res.data?.status) {
      setOrders(res.data.data || []);
    }
    setLoading(false);
  }, [filterDate, filterSession, filterStatus, filterMethod]);

  useEffect(() => {
    const loadSessions = async () => {
      const token = GetCookie("token") || "";
      const res = await get("/sessions", token);
      if (res.status && res.data?.status) {
        setSessions(res.data.data || []);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-fokus input PIN saat modal penyerahan dibuka
  useEffect(() => {
    if (completeOrder) {
      setTimeout(() => {
        hiddenPinInputRef.current?.focus();
      }, 60);
    }
  }, [completeOrder]);

  const handleExportExcel = async () => {
    const token = GetCookie("token") || "";
    const params = new URLSearchParams();
    if (filterDate) params.append("deliveryDate", filterDate);
    if (filterSession) params.append("sessionId", filterSession);
    if (filterMethod) params.append("deliveryMethod", filterMethod);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const filename = `Rekap-QBite-${filterDate || "Semua"}.xlsx`;

    const res = await downloadExcel(`/orders/admin/export${queryStr}`, token, filename);
    if (res.status) {
      toast.success("Rekap Excel berhasil diunduh!", { containerId: "toastOrder" });
      fetchOrders();
    } else {
      toast.error(res.message || "Gagal export Excel", { containerId: "toastOrder" });
    }
  };

  const handleVerify = async (status: "PAID" | "REJECTED") => {
    if (!selectedOrder) return;
    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.warning("Alasan penolakan wajib diisi!", { containerId: "toastOrder" });
      return;
    }

    setSubmitting(true);
    const token = GetCookie("token") || "";
    const payload =
      status === "PAID"
        ? { status: "PAID" }
        : { status: "REJECTED", rejectionReason: rejectionReason.trim() };

    const res = await patch(`/orders/admin/${selectedOrder.id}/verify`, payload, token);
    setSubmitting(false);

    if (res.status && res.data?.status) {
      toast.success(res.data.message, { containerId: "toastOrder" });
      setSelectedOrder(null);
      setRejectMode(false);
      setRejectionReason("");
      fetchOrders();
    } else {
      toast.error(res.message || "Gagal memverifikasi pesanan", { containerId: "toastOrder" });
    }
  };

  // Handler PIN berurutan (hanya terima angka, isi & hapus selalu urut kiri <-> kanan)
  const handleSequentialPinChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 4);
    setPinValue(digitsOnly);
  };

  const focusSequentialPin = () => {
    const input = hiddenPinInputRef.current;
    if (!input) return;
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  };

  const handleCompleteOrder = async () => {
    if (!completeOrder) return;
    if (pinValue.length !== 4) {
      toast.warning("Masukkan 4 digit PIN pengambilan!", { containerId: "toastOrder" });
      focusSequentialPin();
      return;
    }

    setSubmitting(true);
    const token = GetCookie("token") || "";
    const res = await patch(
      `/orders/admin/${completeOrder.id}/complete`,
      { pickupPin: pinValue },
      token
    );
    setSubmitting(false);

    if (res.status && res.data?.status) {
      toast.success(res.data.message, { containerId: "toastOrder" });
      setCompleteOrder(null);
      setPinValue("");
      fetchOrders();
    } else {
      toast.error(res.message || "PIN tidak sesuai", { containerId: "toastOrder" });
      focusSequentialPin();
    }
  };

  const formatWaUrl = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    const norm = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
    return `https://wa.me/${norm}`;
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  const filteredOrders = orders.filter(
    (o) =>
      o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick Status Counts untuk Tab Cepat
  const waitingCount = orders.filter((o) => o.status === "WAITING_VERIFICATION").length;
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const unexportedCount = orders.filter(
    (o) => (o.status === "PAID" || o.status === "COMPLETED") && !o.isExported
  ).length;

  return (
    <div className="space-y-5">
      <ToastContainer containerId="toastOrder" />

      {/* Header & Action Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#292D2B]">
              Order Management & Verifikasi
            </h1>
            <p className="text-xs text-[#777D78] mt-0.5">
              Verifikasi bukti transfer QRIS, konfirmasi penyerahan PIN, dan ekspor rekap kantin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {unexportedCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-[#FFF4D5] text-[#946200] text-xs font-bold">
                {unexportedCount} order lunas belum direkap
              </span>
            )}

            <button
              type="button"
              onClick={fetchOrders}
              className="p-2.5 rounded-xl bg-[#FFF9F2] hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#245F52] transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245F52] hover:bg-[#19483F] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#F8CF5F]" />
              Export Rekap Excel
            </button>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E8E2D9]">
          {[
            { label: "Semua Order", value: "", count: orders.length },
            { label: "Waiting Verification", value: "WAITING_VERIFICATION", count: waitingCount },
            { label: "Paid (Siap Ambil)", value: "PAID", count: paidCount },
            { label: "Completed", value: "COMPLETED" },
            { label: "Pending Payment", value: "PENDING_PAYMENT" },
            { label: "Rejected", value: "REJECTED" },
          ].map((tab) => {
            const active = filterStatus === tab.value;
            return (
              <button
                key={tab.value || "ALL"}
                type="button"
                onClick={() => setFilterStatus(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-[#245F52] text-white border-[#245F52]"
                    : "bg-[#FFF9F2] text-[#292D2B] border-[#E8E2D9] hover:border-[#245F52]"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      active ? "bg-white/20 text-white" : "bg-[#E8E2D9] text-[#292D2B]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#777D78] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Kode Order / Pemesan..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] placeholder:text-[#777D78] focus:border-[#245F52] focus:outline-none"
            />
          </div>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
          />

          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
          >
            <option value="">Semua Sesi</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.deliveryTime})
              </option>
            ))}
          </select>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
          >
            <option value="">Semua Metode Ambil</option>
            <option value="DROP_POINT">Drop-Point MB (+Rp 2.000)</option>
            <option value="SELF_PICKUP">Ambil di Kantin (Gratis)</option>
          </select>
        </div>
      </div>

      {/* Tabel Operasional Pesanan */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-sm font-medium text-[#777D78]">
            Memuat daftar pesanan...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#777D78]">
            Belum ada data pesanan sesuai filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF9F2] border-b border-[#E8E2D9] text-[11px] font-extrabold uppercase tracking-wider text-[#777D78]">
                  <th className="py-3.5 px-4">Order ID & Jadwal</th>
                  <th className="py-3.5 px-4">Pemesan</th>
                  <th className="py-3.5 px-4">Metode Ambil</th>
                  <th className="py-3.5 px-4">Detail Menu</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9] text-xs">
                {filteredOrders.map((order) => {
                  const proofFile = order.proofImageUrl || order.paymentProof;
                  const meta = STATUS_META[order.status];
                  const isSelfPickup =
                    order.deliveryMethod === "SELF_PICKUP" || order.deliveryFee === 0;

                  return (
                    <tr key={order.id} className="hover:bg-[#FFF9F2]/70 transition align-top">
                      {/* Kolom 1: Kode Order & Sesi */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-extrabold text-sm text-[#245F52] block">
                          {order.orderCode}
                        </span>
                        <span className="text-[11px] text-[#777D78] block mt-0.5">
                          {order.deliveryDate.split("T")[0]} • {order.session?.name}
                        </span>
                        {order.isExported && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#DCEAE5] text-[#245F52] text-[10px] font-bold">
                            Terekap Excel
                          </span>
                        )}
                      </td>

                      {/* Kolom 2: Pemesan */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-[#292D2B]">{order.customerName}</p>
                        <p className="text-[11px] text-[#777D78]">{order.customerPhone}</p>
                        {order.notes && (
                          <p className="text-[11px] text-[#C95724] italic mt-1 max-w-[200px]">
                            &ldquo;{order.notes}&rdquo;
                          </p>
                        )}
                      </td>

                      {/* Kolom 3: Metode Ambil */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isSelfPickup ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DFF2E5] text-[#246B40] text-[11px] font-bold">
                            <Store className="w-3 h-3" /> Ambil di Kantin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FBE4D6] text-[#C95724] text-[11px] font-bold">
                            <MapPin className="w-3 h-3" /> Drop-Point MB
                          </span>
                        )}
                      </td>

                      {/* Kolom 4: Item Menu */}
                      <td className="py-4 px-4 min-w-[210px]">
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <p key={item.id} className="text-[#292D2B]">
                              <span className="font-bold text-[#245F52]">
                                [{item.canteen?.name}]
                              </span>{" "}
                              {item.menuNameSnapshot}{" "}
                              <span className="font-bold">×{item.quantity}</span>
                            </p>
                          ))}
                        </div>
                      </td>

                      {/* Kolom 5: Nominal */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-sm text-[#292D2B] block">
                          {formatRupiah(order.totalAmount)}
                        </span>
                        <span className="text-[10px] text-[#777D78]">
                          {isSelfPickup ? "Ongkir Rp 0" : "+Ongkir Rp 2.000"}
                        </span>
                      </td>

                      {/* Kolom 6: Semantic Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      {/* Kolom 7: Aksi Cepat */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={formatWaUrl(order.customerPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#DFF2E5] hover:bg-[#246B40] text-[#246B40] hover:text-white transition"
                            title="Hubungi WhatsApp Pemesan"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {proofFile && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order);
                                setRejectMode(false);
                                setRejectionReason("");
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                order.status === "WAITING_VERIFICATION"
                                  ? "bg-[#ED7134] hover:bg-[#C95724] text-white"
                                  : "bg-[#FFF9F2] hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#292D2B]"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {order.status === "WAITING_VERIFICATION" ? "Verifikasi" : "Bukti"}
                            </button>
                          )}

                          {order.status === "PAID" && (
                            <button
                              type="button"
                              onClick={() => {
                                setCompleteOrder(order);
                                setPinValue("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#245F52] hover:bg-[#19483F] text-white text-xs font-bold transition cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#F8CF5F]" />
                              PIN Ambil
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: INSPEKSI & VERIFIKASI BUKTI TRANSFER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E8E2D9] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#292D2B]">
                  Bukti Pembayaran — {selectedOrder.orderCode}
                </h3>
                <p className="text-xs text-[#777D78] mt-0.5">
                  Pemesan: <strong className="text-[#292D2B]">{selectedOrder.customerName}</strong>{" "}
                  • Nominal:{" "}
                  <span className="text-[#245F52] font-extrabold">
                    {formatRupiah(selectedOrder.totalAmount)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-[#FFF9F2] border border-[#E8E2D9] flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE_IMAGE_PROOF}/${
                  selectedOrder.proofImageUrl || selectedOrder.paymentProof
                }`}
                alt="Bukti Transfer QRIS"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>

            {rejectMode && (
              <div className="space-y-1.5">
                <label className="text-xs text-[#B93832] font-bold block">
                  Alasan Penolakan (akan dikirim ke email pemesan):
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Nominal transfer kurang Rp 2.000 / Foto buram"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#B93832] text-xs text-[#292D2B] focus:outline-none"
                />
              </div>
            )}

            {selectedOrder.status === "WAITING_VERIFICATION" && (
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E8E2D9]">
                {!rejectMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectMode(true)}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FCE5E3] hover:bg-[#B93832] text-[#B93832] hover:text-white text-xs font-bold transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Tolak Bukti
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify("PAID")}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {submitting ? "Memproses..." : "Terima & Lunas (PAID)"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectMode(false)}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl bg-[#ECEDEA] text-[#292D2B] text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify("REJECTED")}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl bg-[#B93832] hover:opacity-90 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? "Mengirim..." : "Konfirmasi Tolak"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: VERIFIKASI PIN 4-DIGIT BERURUTAN (COMPLETED) */}
      {completeOrder && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E8E2D9] p-6 space-y-5 shadow-2xl text-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#DCEAE5] text-[#245F52] text-[11px] font-extrabold uppercase tracking-wider">
                Serah Terima Pesanan
              </span>
              <h3 className="font-extrabold text-lg text-[#292D2B] mt-2">
                Konfirmasi Penyerahan
              </h3>
              <p className="text-xs text-[#777D78] mt-1 leading-relaxed">
                Masukkan 4 digit PIN Pengambilan milik{" "}
                <strong className="text-[#292D2B]">{completeOrder.customerName}</strong> (
                <span className="font-mono font-bold text-[#245F52]">
                  {completeOrder.orderCode}
                </span>
                )
              </p>
            </div>

            {/* Single Sequential Input + 4 Visual Slots (Selalu isi & hapus urut kiri <-> kanan) */}
            <div
              onClick={focusSequentialPin}
              className="relative flex justify-center gap-3 cursor-text select-none py-1"
            >
              <input
                ref={hiddenPinInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={pinValue}
                onChange={(e) => handleSequentialPinChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pinValue.length === 4) {
                    handleCompleteOrder();
                  }
                }}
                aria-label="Masukkan 4 digit PIN pengambilan"
                className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
              />

              {[0, 1, 2, 3].map((idx) => {
                const char = pinValue[idx] || "";
                const isActiveSlot =
                  idx === pinValue.length || (pinValue.length === 4 && idx === 3);

                return (
                  <div
                    key={idx}
                    className={`w-13 h-15 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-extrabold transition ${
                      char
                        ? "bg-[#DCEAE5]/60 border-[#245F52] text-[#245F52]"
                        : isActiveSlot
                          ? "bg-[#FFF9F2] border-[#ED7134] text-[#292D2B]"
                          : "bg-[#FFF9F2] border-[#E8E2D9] text-[#777D78]"
                    }`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompleteOrder(null);
                  setPinValue("");
                }}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#ECEDEA] hover:bg-[#E8E2D9] text-xs font-bold text-[#292D2B] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={submitting || pinValue.length !== 4}
                className="flex-1 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-xs font-extrabold text-white transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Memverifikasi..." : "Selesaikan Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}