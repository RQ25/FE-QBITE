"use client";

import { IMenu } from "@/app/types";
import { drop } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Trash2, X } from "lucide-react";

const DeleteMenu = ({ selectedMenu }: { selectedMenu: IMenu }) => {
  const [isShow, setIsShow] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = GetCookie("token") || "";
      const res = await drop(`/menus/${selectedMenu.id}`, token);
      if (res.status && res.data?.status) {
        setIsShow(false);
        toast.success(res.data.message || "Menu berhasil dihapus!", {
          containerId: "toastMenu",
        });
        setTimeout(() => router.refresh(), 800);
      } else {
        toast.warning(res.message || res.data?.message || "Gagal menghapus menu", {
          containerId: "toastMenu",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menghapus menu.", { containerId: "toastMenu" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <ToastContainer containerId="toastMenu" />
      <button
        type="button"
        onClick={() => setIsShow(true)}
        className="p-2 rounded-xl bg-[#FCE5E3] hover:bg-[#B93832] text-[#B93832] hover:text-white transition cursor-pointer"
        title="Hapus Menu"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isShow && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white border border-[#E8E2D9] shadow-2xl overflow-hidden text-left"
          >
            <div className="px-6 py-4 bg-[#FFF9F2] border-b border-[#E8E2D9] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#292D2B]">Hapus Menu</h3>
                <p className="text-[11px] text-[#777D78]">
                  Menu dengan riwayat order sebaiknya dinonaktifkan saja.
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

            <div className="p-6 text-xs text-[#292D2B] leading-relaxed">
              Yakin ingin menghapus menu <strong>{selectedMenu.name}</strong> dari katalog?
            </div>

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
                className="px-4 py-2 rounded-xl bg-[#B93832] hover:opacity-90 text-xs font-extrabold text-white cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Menghapus..." : "Hapus Menu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DeleteMenu;