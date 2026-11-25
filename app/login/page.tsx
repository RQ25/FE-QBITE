"use client";

import { BASE_API_URL } from "@/global";
import { StoreCookie } from "@/lib/client-cookie";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { ArrowLeft, ShieldCheck, FileSpreadsheet, QrCode, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = `${BASE_API_URL}/users/login`;
      const { data } = await axios.post(
        url,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (data.status === true) {
        toast.success(data.message, {
          hideProgressBar: true,
          containerId: "toastLogin",
          autoClose: 1500,
        });
        StoreCookie("token", data.token);
        StoreCookie("id", String(data.data.id));
        StoreCookie("name", data.data.name);
        StoreCookie("role", data.data.role);

        setTimeout(() => router.replace("/manager/dashboard"), 1000);
      } else {
        toast.warning(data.message, {
          hideProgressBar: true,
          containerId: "toastLogin",
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || "Gagal terhubung ke server.";
      toast.error(msg, {
        hideProgressBar: true,
        containerId: "toastLogin",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FCF0E4] text-[#292D2B] flex flex-col lg:flex-row">
      <ToastContainer containerId="toastLogin" />

      {/* SISI KIRI: Brand Deep Teal Q-Bite */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#245F52] text-white p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="w-11 h-11 rounded-xl bg-[#19483F] border border-white/15 flex items-center justify-center p-1.5">
            <Image
              src="/image/logoNOBG.png"
              alt="Q-Bite Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight block leading-none">
              Q-BITE
            </span>
            <span className="text-[11px] text-[#DCEAE5] font-medium">
              Manajemen Bisnis ITS
            </span>
          </div>
        </Link>

        <div className="space-y-6 max-w-sm">
          <span className="inline-block px-3 py-1 rounded-full bg-[#19483F] text-[#F8CF5F] text-xs font-bold">
            Portal Pengurus & Kurir
          </span>
          <h2 className="text-3xl font-extrabold leading-snug">
            Kelola Pre-Order Kantin MB ITS Lebih Teratur & Tanpa Antre.
          </h2>
          <p className="text-sm text-[#DCEAE5] leading-relaxed">
            Satu pusat kendali untuk verifikasi mutasi QRIS, kontrol stok & sesi PO, validasi PIN
            pengambilan, hingga ekspor rekap dapur otomatis.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#19483F] border border-white/10 flex items-center gap-3">
              <QrCode className="w-5 h-5 text-[#F8CF5F] shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Verifikasi QRIS Terpusat</p>
                <p className="text-[#DCEAE5]/80">Cek bukti transfer & kirim PIN 4-digit otomatis</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#19483F] border border-white/10 flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-[#F8CF5F] shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Rekap Excel 2-Sheet</p>
                <p className="text-[#DCEAE5]/80">Pisah otomatis Drop-Point MB & Ambil di Kantin</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#DCEAE5]/70">
          © 2026 Q-Bite • Departemen Manajemen Bisnis ITS
        </p>
      </div>

      {/* SISI KANAN: Form Login */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#245F52] flex items-center justify-center p-1.5">
              <Image
                src="/image/logoNOBG.png"
                alt="Q-Bite Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-extr  abold text-[#245F52]">Q-BITE</span>
          </Link>

          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#DCEAE5]/60 border border-[#E8E2D9] text-xs font-bold text-[#245F52] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Halaman Pemesanan
          </Link>
        </div>

        <div className="w-full max-w-[400px] mx-auto my-auto py-8">
          <div className="bg-[#FFF9F2] border border-[#E8E2D9] rounded-2xl p-7 sm:p-8 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DCEAE5] text-[#245F52] text-[11px] font-extrabold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Akses Pengurus Terdaftar
              </div>
              <h1 className="text-2xl font-extrabold text-[#292D2B]">Portal Pengurus Q-Bite</h1>
              <p className="text-xs text-[#777D78] mt-1 leading-relaxed">
                Masuk untuk memverifikasi bukti QRIS, mengelola menu kantin, dan rekap pengantaran.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold text-[#292D2B] block">
                  Email Pengurus
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@qbite.id"
                  className="w-full rounded-xl border border-[#E8E2D9] bg-white px-4 py-3 text-xs text-[#292D2B] placeholder:text-[#777D78] focus:border-[#245F52] focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-[#292D2B]">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-[#245F52] hover:text-[#19483F] inline-flex items-center gap-1 cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Tampilkan
                      </>
                    )}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#E8E2D9] bg-white px-4 py-3 text-xs text-[#292D2B] placeholder:text-[#777D78] focus:border-[#245F52] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#ED7134] hover:bg-[#C95724] px-4 py-3.5 text-xs sm:text-sm font-extrabold text-white transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Memproses..." : "Masuk Dashboard"}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-[#777D78]">
          © 2026 Q-Bite Campus Pre-Order. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;