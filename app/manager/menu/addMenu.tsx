"use client";

import { ICanteen } from "@/app/types";
import { post } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Plus, X, Upload } from "lucide-react";

const AddMenu = ({ canteens }: { canteens: ICanteen[] }) => {
  const [isShow, setIsShow] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [canteenId, setCanteenId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("FOOD");
  const [dailyQuota, setDailyQuota] = useState<string>("");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const openModal = () => {
    setCanteenId(canteens.length > 0 ? String(canteens[0].id) : "");
    setName("");
    setPrice("");
    setDescription("");
    setCategory("FOOD");
    setDailyQuota("");
    setIsAvailable(true);
    setFile(null);
    setIsShow(true);
    if (formRef.current) formRef.current.reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canteenId) {
      toast.warning("Pilih kantin terlebih dahulu!", { containerId: "toastMenu" });
      return;
    }

    setSubmitting(true);
    try {
      const token = GetCookie("token") || "";
      const payload = new FormData();
      payload.append("canteenId", canteenId);
      payload.append("name", name);
      payload.append("price", price || "0");
      payload.append("category", category);
      payload.append("description", description);
      payload.append("isAvailable", String(isAvailable));
      if (dailyQuota.trim() !== "") {
        payload.append("dailyQuota", dailyQuota);
      }
      if (file) {
        payload.append("picture", file);
      }

      const res = await post("/menus", payload, token);
      if (res.status && res.data?.status) {
        setIsShow(false);
        toast.success(res.data.message || "Menu berhasil ditambahkan!", {
          containerId: "toastMenu",
        });
        setTimeout(() => router.refresh(), 800);
      } else {
        toast.warning(res.message || res.data?.message || "Gagal menambah menu", {
          containerId: "toastMenu",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan menu.", { containerId: "toastMenu" });
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
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-extrabold transition cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Tambah Menu
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
              <div>
                <h3 className="font-extrabold text-base text-[#292D2B]">Tambah Menu Baru</h3>
                <p className="text-[11px] text-[#777D78]">
                  Tambahkan menu makanan atau minuman ke kantin mitra Q-Bite.
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
            <div className="p-6 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-[#292D2B] block mb-1">Kantin Mitra *</label>
                <select
                  value={canteenId}
                  onChange={(e) => setCanteenId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                >
                  <option value="">--- Pilih Kantin ---</option>
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
                  placeholder="Contoh: Nasi Ayam Geprek Sambal Bawang"
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
                    placeholder="15000"
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
                    placeholder="Contoh: 25"
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
                  placeholder="Contoh: Nasi hangat + ayam geprek + lalapan + es teh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#292D2B] block mb-1">
                  Foto Menu (JPG/PNG/WEBP, Maks 2MB)
                </label>
                <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FFF9F2] border border-dashed border-[#245F52]/40 hover:border-[#ED7134] cursor-pointer transition">
                  <Upload className="w-4 h-4 text-[#245F52]" />
                  <span className="text-[#292D2B] font-medium truncate">
                    {file ? file.name : "Pilih file foto menu..."}
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
                {submitting ? "Menyimpan..." : "Simpan Menu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddMenu;