"use client";

import { IMenu, ICanteen } from "@/app/types";
import { put } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Pencil, X, Upload } from "lucide-react";

const EditMenu = ({
  selectedMenu,
  canteens,
}: {
  selectedMenu: IMenu;
  canteens: ICanteen[];
}) => {
  const [isShow, setIsShow] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [canteenId, setCanteenId] = useState<string>(String(selectedMenu.canteenId));
  const [name, setName] = useState<string>(selectedMenu.name);
  const [price, setPrice] = useState<string>(String(selectedMenu.price));
  const [description, setDescription] = useState<string>(selectedMenu.description || "");
  const [category, setCategory] = useState<string>(selectedMenu.category);
  const [dailyQuota, setDailyQuota] = useState<string>(
    selectedMenu.dailyQuota !== null && selectedMenu.dailyQuota !== undefined
      ? String(selectedMenu.dailyQuota)
      : ""
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(selectedMenu.isAvailable);
  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const openModal = () => {
    setCanteenId(String(selectedMenu.canteenId));
    setName(selectedMenu.name);
    setPrice(String(selectedMenu.price));
    setDescription(selectedMenu.description || "");
    setCategory(selectedMenu.category);
    setDailyQuota(
      selectedMenu.dailyQuota !== null && selectedMenu.dailyQuota !== undefined
        ? String(selectedMenu.dailyQuota)
        : ""
    );
    setIsAvailable(selectedMenu.isAvailable);
    setFile(null);
    setIsShow(true);
    if (formRef.current) formRef.current.reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = GetCookie("token") || "";
      const payload = new FormData();
      payload.append("canteenId", canteenId);
      payload.append("name", name);
      payload.append("price", price || "0");
      payload.append("description", description);
      payload.append("category", category);
      payload.append("isAvailable", String(isAvailable));
      payload.append("dailyQuota", dailyQuota.trim() !== "" ? dailyQuota : "");
      if (file) {
        payload.append("picture", file);
      }

      const res = await put(`/menus/${selectedMenu.id}`, payload, token);
      if (res.status && res.data?.status) {
        setIsShow(false);
        toast.success(res.data.message || "Menu berhasil diperbarui!", {
          containerId: "toastMenu",
        });
        setTimeout(() => router.refresh(), 800);
      } else {
        toast.warning(res.message || res.data?.message || "Gagal memperbarui menu", {
          containerId: "toastMenu",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memperbarui menu.", { containerId: "toastMenu" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <ToastContainer containerId="toastMenu" />
      <button
        type="button"
        onClick={openModal}
        className="p-2 rounded-xl bg-[#FFF9F2] hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#245F52] transition cursor-pointer"
        title="Edit Menu"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {isShow && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            ref={formRef}
            className="w-full max-w-lg rounded-2xl bg-white border border-[#E8E2D9] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#FFF9F2] border-b border-[#E8E2D9] flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#292D2B]">Edit Menu</h3>
              <button
                type="button"
                onClick={() => setIsShow(false)}
                className="p-1.5 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-3.5 overflow-y-auto text-xs text-left">
              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Kantin Mitra *</label>
                <select
                  value={canteenId}
                  onChange={(e) => setCanteenId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                >
                  {canteens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Nama Menu *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#292D2B] block mb-1">Harga (Rp) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#292D2B] block mb-1">
                    Kuota Harian (Kosong = Bebas)
                  </label>
                  <input
                    type="number"
                    value={dailyQuota}
                    onChange={(e) => setDailyQuota(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Kategori *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                >
                  <option value="FOOD">Makanan (FOOD)</option>
                  <option value="DRINK">Minuman (DRINK)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#292D2B] block mb-1">
                  Ganti Foto Menu (Opsional, Maks 2MB)
                </label>
                <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FFF9F2] border border-dashed border-[#245F52]/40 hover:border-[#ED7134] cursor-pointer transition">
                  <Upload className="w-4 h-4 text-[#245F52]" />
                  <span className="text-[#292D2B] font-medium truncate">
                    {file ? file.name : "Pilih foto baru jika ingin mengganti..."}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2.5 font-semibold text-[#292D2B] pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 accent-[#245F52] rounded"
                />
                Menu tersedia untuk dipesan
              </label>
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
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditMenu;