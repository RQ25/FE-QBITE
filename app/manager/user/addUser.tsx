"use client";

import { post } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { UserPlus, X, Eye, EyeOff } from "lucide-react";

const AddUser = () => {
  const [isShow, setIsShow] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<string>("STAFF");

  const router = useRouter();

  const openModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("STAFF");
    setShowPassword(false);
    setIsShow(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = GetCookie("token") || "";
      const res = await post("/users", { name, email, password, role }, token);

      if (res.status && res.data?.status) {
        setIsShow(false);
        toast.success(res.data.message || "Pengurus berhasil ditambahkan!", {
          containerId: "toastUser",
        });
        setTimeout(() => router.refresh(), 800);
      } else {
        toast.warning(res.message || res.data?.message || "Gagal menambah pengurus", {
          containerId: "toastUser",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan pengurus.", { containerId: "toastUser" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <ToastContainer containerId="toastUser" />
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-extrabold transition cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        Tambah Pengurus
      </button>

      {isShow && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white border border-[#E8E2D9] shadow-2xl overflow-hidden text-left"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#FFF9F2] border-b border-[#E8E2D9] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#292D2B]">Tambah Akun Pengurus</h3>
                <p className="text-[11px] text-[#777D78]">
                  Buat akun baru untuk Admin atau Staff operasional Q-Bite.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShow(false)}
                className="p-1.5 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Nadya Putri"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Email Login *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@qbite.id"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#292D2B]">
                    Password (Minimal 6 karakter) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[11px] font-bold text-[#245F52] hover:text-[#19483F] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Lihat
                      </>
                    )}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Role Akses *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                >
                  <option value="STAFF">STAFF (Verifikasi & Operasional)</option>
                  <option value="ADMIN">ADMIN (Akses Penuh)</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FFF9F2] border-t border-[#E8E2D9] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsShow(false)}
                className="px-4 py-2 rounded-xl bg-[#ECEDEA] hover:bg-[#E8E2D9] text-xs font-bold text-[#292D2B] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-xs font-extrabold text-white cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan Akun"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddUser;