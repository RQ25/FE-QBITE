"use client";

import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { get, post } from "@/lib/api-bridge";
import { IOrder, OrderStatus } from "@/app/types";
import { BASE_IMAGE_PROOF } from "@/global";
import { ToastContainer, toast } from "react-toastify";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Copy,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  MapPin,
  Store,
  Download,
} from "lucide-react";
import Image from "next/image";

interface ExtendedOrder extends IOrder {
  deliveryMethod?: "DROP_POINT" | "SELF_PICKUP";
  subtotalAmount?: number;
  deliveryFee?: number;
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; desc: string; badgeClass: string }
> = {
  PENDING_PAYMENT: {
    label: "Menunggu Pembayaran QRIS",
    desc: "Segera lakukan transfer sesuai nominal pas dan unggah bukti bayar sebelum batas waktu berakhir.",
    badgeClass: "badge-pending",
  },
  WAITING_VERIFICATION: {
    label: "Menunggu Verifikasi Pengurus",
    desc: "Bukti pembayaran sudah diterima. Pengurus Q-Bite sedang mengecek mutasi masuk.",
    badgeClass: "badge-waiting",
  },
  PAID: {
    label: "Pembayaran Lunas (Siap Diproses)",
    desc: "Pesananmu sudah masuk daftar rekap kantin! Simpan PIN 4-digit di bawah untuk pengambilan makanan.",
    badgeClass: "badge-paid",
  },
  REJECTED: {
    label: "Bukti Pembayaran Ditolak",
    desc: "Silakan periksa catatan dari pengurus dan unggah ulang bukti transfer yang valid.",
    badgeClass: "badge-rejected",
  },
  EXPIRED: {
    label: "Pesanan Kedaluwarsa",
    desc: "Batas waktu pembayaran telah habis dan kuota pesanan telah dikembalikan.",
    badgeClass: "badge-expired",
  },
  COMPLETED: {
    label: "Pesanan Selesai Diambil",
    desc: "Terima kasih sudah menggunakan layanan pre-order terjadwal Q-Bite!",
    badgeClass: "badge-completed",
  },
};

const TrackingHeader = () => (
  <header className="sticky top-0 z-30 bg-[#FCF0E4]/95 backdrop-blur-md border-b border-[#E8E2D9]">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#245F52] flex items-center justify-center p-1.5">
          <Image
            src="/image/logoNOBG.png"
            alt="Q-Bite Logo"
            width={28}
            height={28}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <span className="font-extrabold text-base text-[#245F52] block leading-none">
            Q-Bite
          </span>
          <span className="text-[11px] font-medium text-[#777D78]">
            Pre-Order Kantin MB ITS
          </span>
        </div>
      </Link>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#DCEAE5]/60 border border-[#E8E2D9] text-xs font-bold text-[#245F52] transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Menu
      </Link>
    </div>
  </header>
);

export default function OrderTrackingPage() {
  const params = useParams();
  const uuid = String(params?.uuid || "");

  const [order, setOrder] = useState<ExtendedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Upload state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [qrisImgError, setQrisImgError] = useState<boolean>(false);

  const fetchOrder = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    const res = await get(`/orders/${uuid}`);
    if (res.status && res.data?.status && res.data?.data) {
      setOrder(res.data.data);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [uuid]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Live Countdown Timer berdasarkan paymentExpiry
  useEffect(() => {
    if (!order || !order.paymentExpiry) return;
    if (order.status !== "PENDING_PAYMENT" && order.status !== "REJECTED") {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const expiryMs = new Date(order.paymentExpiry).getTime();
      const nowMs = Date.now();
      const diff = expiryMs - nowMs;

      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsTimeUp(true);
        return;
      }

      setIsTimeUp(false);
      const totalSeconds = Math.floor(diff / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setTimeLeft(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.warning("Ukuran foto maksimal 3MB.", { containerId: "toastTracking" });
      return;
    }
    setProofFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadProof = async (e: FormEvent) => {
    e.preventDefault();
    if (!proofFile || uploading) {
      toast.warning("Pilih foto bukti transfer terlebih dahulu!", {
        containerId: "toastTracking",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("proof", proofFile);

      const res = await post(`/orders/${uuid}/proof`, formData);
      if (res.status && res.data?.status) {
        toast.success(res.data.message || "Bukti pembayaran berhasil diunggah!", {
          containerId: "toastTracking",
        });
        setProofFile(null);
        setPreviewUrl(null);
        fetchOrder();
      } else {
        toast.error(res.message || res.data?.message || "Gagal mengunggah bukti bayar.", {
          containerId: "toastTracking",
        });
      }
    } catch {
      toast.error("Terjadi gangguan jaringan saat mengunggah bukti.", {
        containerId: "toastTracking",
      });
    } finally {
      setUploading(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin!`, {
      containerId: "toastTracking",
      autoClose: 1500,
      hideProgressBar: true,
    });
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF0E4] text-[#292D2B]">
        <TrackingHeader />
        <div className="py-20 text-center text-sm font-medium text-[#777D78]">
          Memuat detail transaksi Q-Bite...
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-[#FCF0E4] text-[#292D2B]">
        <TrackingHeader />
        <div className="max-w-md mx-auto my-12 px-4">
          <div className="p-8 rounded-2xl bg-[#FFF9F2] border border-[#E8E2D9] text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#FCE5E3] text-[#B93832] flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-[#292D2B]">Pesanan Tidak Ditemukan</h2>
            <p className="text-xs text-[#777D78] leading-relaxed">
              Tautan pesanan tidak valid atau transaksi sudah dihapus dari sistem.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const canUploadProof =
    (order.status === "PENDING_PAYMENT" || order.status === "REJECTED") && !isTimeUp;
  const uploadedProofFilename = order.proofImageUrl || order.paymentProof;

  const itemsSubtotal =
    order.subtotalAmount && order.subtotalAmount > 0
      ? order.subtotalAmount
      : order.items.reduce((acc, item) => acc + item.subtotal, 0);
  const feeAmount =
    typeof order.deliveryFee === "number"
      ? order.deliveryFee
      : Math.max(0, order.totalAmount - itemsSubtotal);
  const isSelfPickup = order.deliveryMethod === "SELF_PICKUP" || feeAmount === 0;

  return (
    <div className="min-h-screen bg-[#FCF0E4] text-[#292D2B]">
      <ToastContainer containerId="toastTracking" />
      <TrackingHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
        {/* Bar Refresh Status */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-[#777D78]">
            Resi & Pelacakan Transaksi
          </p>
          <button
            type="button"
            onClick={fetchOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#DCEAE5]/60 border border-[#E8E2D9] text-xs font-bold text-[#292D2B] transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#245F52]" /> Cek Status Terbaru
          </button>
        </div>

        {/* CARD 1: STATUS UTAMA & KODE ORDER */}
        <div className="p-6 rounded-2xl bg-[#FFF9F2] border border-[#E8E2D9] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E8E2D9] pb-4">
            <div>
              <p className="text-[11px] font-bold text-[#777D78] uppercase tracking-wider">
                Kode Pesanan
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="font-mono text-2xl font-extrabold text-[#245F52]">
                  {order.orderCode}
                </h1>
                <button
                  type="button"
                  onClick={() => copyText(order.orderCode, "Kode pesanan")}
                  className="p-1.5 rounded-lg bg-white hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#292D2B] cursor-pointer transition"
                  title="Salin Kode Order"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold ${meta.badgeClass}`}>
              {meta.label}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#292D2B]/90 leading-relaxed">{meta.desc}</p>

          {/* Banner Alasan Penolakan (Jika REJECTED) */}
          {order.status === "REJECTED" && order.rejectionReason && (
            <div className="p-4 rounded-xl bg-[#FCE5E3] border border-[#B93832]/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B93832] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-[#B93832]">
                  Catatan Penolakan Pengurus:
                </p>
                <p className="text-xs text-[#292D2B] mt-0.5">{order.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Live Countdown Timer (Jika PENDING_PAYMENT / REJECTED) */}
          {(order.status === "PENDING_PAYMENT" || order.status === "REJECTED") && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${isTimeUp
                ? "bg-[#FCE5E3] border-[#B93832]/30 text-[#B93832]"
                : "bg-[#FFF4D5] border-[#F8CF5F] text-[#946200]"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold">
                    {isTimeUp ? "Batas Waktu Bayar Habis" : "Sisa Waktu Pembayaran"}
                  </p>
                  <p className="text-[11px] opacity-85">
                    Maksimal 15 menit atau sebelum sesi tutup
                  </p>
                </div>
              </div>
              <span className="font-mono text-2xl font-extrabold">{timeLeft || "--:--"}</span>
            </div>
          )}
        </div>

        {/* CARD 2: PIN PENGAMBILAN 4-DIGIT (Jika PAID / COMPLETED) */}
        {(order.status === "PAID" || order.status === "COMPLETED") && (
          <div className="p-6 rounded-2xl bg-[#245F52] text-white text-center space-y-3.5 shadow-sm">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#19483F] text-[#F8CF5F] text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              {order.status === "PAID" ? "PIN Pengambilan Makanan" : "PIN Terverifikasi"}
            </div>

            <div className="flex justify-center gap-3 py-1">
              {order.pickupPin.split("").map((digit, i) => (
                <span
                  key={i}
                  className="w-14 h-16 rounded-xl bg-white text-[#245F52] flex items-center justify-center font-mono text-3xl font-extrabold shadow-sm"
                >
                  {digit}
                </span>
              ))}
            </div>

            <p className="text-xs text-[#DCEAE5] max-w-md mx-auto leading-relaxed">
              Tunjukkan 4 digit PIN di atas kepada pengurus/kantin saat mengambil pesanan{" "}
              <strong className="text-white">{order.session?.name}</strong> (
              {order.deliveryDate.split("T")[0]}) di{" "}
              <strong className="text-[#F8CF5F]">
                {isSelfPickup ? "Stand Kantin Mitra" : "Drop-Point Gedung MB"}
              </strong>
              .
            </p>
          </div>
        )}

        {/* CARD 3: PEMBAYARAN QRIS & FORM UPLOAD BUKTI (Jika Belum Lunas) */}
        {canUploadProof && (
          <div className="p-6 rounded-2xl bg-[#FFF9F2] border border-[#E8E2D9] space-y-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Kolom Kiri: Kode QRIS */}
              <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] flex flex-col items-center text-center space-y-3">
                <div className="px-3 py-1 rounded-full bg-[#DCEAE5] text-[#245F52] font-extrabold text-xs tracking-wide">
                  QRIS RESMI Q-BITE MB ITS
                </div>

                {!qrisImgError ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/image/QRnobg.jpg"
                      alt="QRIS Q-Bite"
                      onError={() => setQrisImgError(true)}
                      className="w-48 h-48 object-contain rounded-xl border border-[#E8E2D9] p-1"
                    />
                    <a
                      href="/image/QRnobg.jpg"
                      download="QRIS-QBite-MB-ITS.jpg"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFF9F2] hover:bg-[#DCEAE5] border border-[#E8E2D9] text-xs font-bold text-[#245F52] transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Simpan Gambar QRIS
                    </a>
                  </>
                ) : (
                  <div className="w-48 h-48 rounded-xl border-2 border-dashed border-[#E8E2D9] flex flex-col items-center justify-center p-4 text-[#777D78]">
                    <QrCode className="w-16 h-16 text-[#245F52] mb-2" />
                    <span className="text-[11px] font-semibold">
                      Scan QRIS Resmi Pengurus Q-Bite
                    </span>
                  </div>
                )}

                <div className="w-full pt-2 border-t border-[#E8E2D9]">
                  <p className="text-[11px] font-medium text-[#777D78]">Nominal Transfer Pas:</p>
                  <button
                    type="button"
                    onClick={() => copyText(String(order.totalAmount), "Nominal transfer")}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#DCEAE5]/70 hover:bg-[#DCEAE5] font-extrabold text-lg text-[#245F52] cursor-pointer transition"
                  >
                    {formatRupiah(order.totalAmount)} <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Kolom Kanan: Upload Form */}
              <form onSubmit={handleUploadProof} className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-base text-[#292D2B]">
                    {order.status === "REJECTED"
                      ? "Unggah Ulang Bukti Transfer"
                      : "Unggah Bukti Pembayaran"}
                  </h3>
                  <p className="text-xs text-[#777D78] mt-1 leading-relaxed">
                    Pastikan nominal transfer{" "}
                    <strong className="text-[#292D2B]">{formatRupiah(order.totalAmount)}</strong>,
                    tanggal, dan status berhasil terlihat jelas pada screenshot.
                  </p>
                </div>

                <label className="block border-2 border-dashed border-[#245F52]/40 hover:border-[#ED7134] rounded-2xl p-4 text-center cursor-pointer transition bg-white">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    className="hidden"
                  />
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Preview Bukti Bayar"
                      className="max-h-48 mx-auto rounded-xl object-contain"
                    />
                  ) : (
                    <div className="py-6 space-y-2">
                      <div className="w-11 h-11 rounded-xl bg-[#FBE4D6] text-[#ED7134] flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-[#292D2B]">
                        Klik untuk pilih foto bukti transfer
                      </p>
                      <p className="text-[11px] text-[#777D78]">JPG, PNG, atau WEBP (Maks. 3MB)</p>
                    </div>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={!proofFile || uploading}
                  className="w-full py-3.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white font-extrabold text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
                >
                  {uploading ? "Mengunggah Bukti..." : "Kirim Bukti Pembayaran"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CARD 4: RINCIAN PESANAN & BUKTI TERUNGGAH */}
        <div className="p-6 rounded-2xl bg-[#FFF9F2] border border-[#E8E2D9] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9] pb-3">
            <h3 className="font-extrabold text-base text-[#292D2B]">Rincian Pesanan</h3>
            <span className="text-xs font-semibold text-[#245F52]">
              {order.session?.name} • {order.deliveryDate.split("T")[0]} (
              {order.session?.deliveryTime} WIB)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E8E2D9]">
            <div>
              <span className="text-[#777D78] block">Nama Pemesan</span>
              <span className="font-bold text-[#292D2B]">{order.customerName}</span>
            </div>
            <div>
              <span className="text-[#777D78] block">WhatsApp & Email</span>
              <span className="font-bold text-[#292D2B]">
                {order.customerPhone} • {order.customerEmail}
              </span>
            </div>
            <div className="sm:col-span-2 pt-1 border-t border-[#E8E2D9]/60 flex items-center justify-between">
              <span className="text-[#777D78]">Metode Pengambilan</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DCEAE5] text-[#245F52] font-bold">
                {isSelfPickup ? (
                  <>
                    <Store className="w-3.5 h-3.5" /> Ambil Sendiri di Kantin (Gratis)
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" /> Drop-Point Gedung MB (+Rp 2.000)
                  </>
                )}
              </span>
            </div>
            {order.notes && (
              <div className="sm:col-span-2 pt-1 border-t border-[#E8E2D9]/60">
                <span className="text-[#777D78] block">Catatan Pesanan</span>
                <span className="text-[#C95724] font-medium italic">
                  &ldquo;{order.notes}&rdquo;
                </span>
              </div>
            )}
          </div>

          {/* Item List */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-2.5 border-b border-[#E8E2D9]/70 last:border-none"
              >
                <div>
                  <span className="text-[#245F52] font-bold">
                    [{item.canteen?.name || "Kantin"}]
                  </span>{" "}
                  <span className="text-[#292D2B] font-semibold">{item.menuNameSnapshot}</span>
                  <span className="text-[#777D78]"> × {item.quantity}</span>
                </div>
                <span className="font-bold text-[#292D2B]">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Ringkasan Subtotal + Ongkir + Total */}
          <div className="pt-3 border-t border-[#E8E2D9] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#777D78]">
              <span>Subtotal Makanan</span>
              <span className="font-semibold text-[#292D2B]">{formatRupiah(itemsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-[#777D78]">
              <span>Ongkos Kirim ({isSelfPickup ? "Ambil di Kantin" : "Drop-Point MB"})</span>
              <span className="font-semibold text-[#292D2B]">
                {feeAmount === 0 ? "Gratis (Rp 0)" : formatRupiah(feeAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9]">
              <span className="text-sm font-bold text-[#292D2B]">Total Pembayaran</span>
              <span className="text-lg font-extrabold text-[#245F52]">
                {formatRupiah(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Preview Bukti yang Sudah Diunggah */}
          {uploadedProofFilename && (
            <div className="pt-4 border-t border-[#E8E2D9] space-y-2">
              <p className="text-xs font-bold text-[#246B40] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Bukti Transfer Terunggah:
              </p>
              <div className="w-full max-h-64 rounded-xl overflow-hidden bg-white border border-[#E8E2D9] flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BASE_IMAGE_PROOF}/${uploadedProofFilename}`}
                  alt="Bukti Transfer Terunggah"
                  className="max-h-60 object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}