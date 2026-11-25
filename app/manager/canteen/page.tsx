"use client";

import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { get, post, put } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { ICanteen } from "@/app/types";
import { ToastContainer, toast } from "react-toastify";
import { Store, Plus, Pencil, Power, X } from "lucide-react";

export default function CanteenPage() {
  const [canteens, setCanteens] = useState<ICanteen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCanteen, setEditingCanteen] = useState<ICanteen | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const fetchCanteens = useCallback(async () => {
    setLoading(true);
    const token = GetCookie("token") || "";
    const res = await get("/canteens", token);
    if (res.status && res.data?.status) {
      setCanteens(res.data.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCanteens();
  }, [fetchCanteens]);

  const openAddModal = () => {
    setEditingCanteen(null);
    setName("");
    setDescription("");
    setIsOpen(true);
    setIsModalOpen(true);
  };

  const openEditModal = (canteen: ICanteen) => {
    setEditingCanteen(canteen);
    setName(canteen.name);
    setDescription(canteen.description || "");
    setIsOpen(canteen.isOpen);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = GetCookie("token") || "";
    const payload = { name: name.trim(), description: description.trim(), isOpen };

    const res = editingCanteen
      ? await put(`/canteens/${editingCanteen.id}`, payload, token)
      : await post("/canteens", payload, token);

    setSubmitting(false);

    if (res.status && res.data?.status) {
      toast.success(res.data.message || "Data kantin tersimpan!", { containerId: "toastCanteen" });
      setIsModalOpen(false);
      fetchCanteens();
    } else {
      toast.warning(res.message || "Gagal menyimpan data kantin", { containerId: "toastCanteen" });
    }
  };

  const handleQuickToggle = async (canteen: ICanteen) => {
    const token = GetCookie("token") || "";
    const res = await put(
      `/canteens/${canteen.id}`,
      { name: canteen.name, description: canteen.description || "", isOpen: !canteen.isOpen },
      token
    );
    if (res.status && res.data?.status) {
      toast.success(`${canteen.name} sekarang ${!canteen.isOpen ? "BUKA" : "TUTUP"}`, {
        containerId: "toastCanteen",
      });
      fetchCanteens();
    } else {
      toast.error(res.message || "Gagal mengubah status kantin", { containerId: "toastCanteen" });
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer containerId="toastCanteen" />

      {/* Header & Action */}
      <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#292D2B]">Manajemen Kantin Mitra</h1>
          <p className="text-xs text-[#777D78] mt-1">
            Kelola daftar kantin kampus yang bermitra dengan Q-Bite serta status buka/tutupnya.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-extrabold transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Kantin
        </button>
      </div>

      {/* Grid Daftar Kantin */}
      {loading ? (
        <div className="p-10 rounded-2xl border border-[#E8E2D9] bg-white text-center text-sm font-medium text-[#777D78]">
          Memuat data kantin...
        </div>
      ) : canteens.length === 0 ? (
        <div className="p-10 rounded-2xl border border-[#E8E2D9] bg-white text-center text-sm text-[#777D78]">
          Belum ada kantin terdaftar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canteens.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#245F52]/40 transition flex flex-col justify-between gap-4 shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DCEAE5] text-[#245F52] flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#292D2B]">{c.name}</h3>
                      <span className="text-[11px] font-medium text-[#777D78]">
                        {c._count?.menus ?? 0} menu terdaftar
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                      c.isOpen
                        ? "bg-[#DFF2E5] text-[#246B40]"
                        : "bg-[#FCE5E3] text-[#B93832]"
                    }`}
                  >
                    {c.isOpen ? "BUKA" : "TUTUP"}
                  </span>
                </div>

                {c.description && (
                  <p className="text-xs text-[#777D78] mt-3 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => handleQuickToggle(c)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    c.isOpen
                      ? "bg-[#FCE5E3] hover:bg-[#B93832] text-[#B93832] hover:text-white"
                      : "bg-[#DFF2E5] hover:bg-[#246B40] text-[#246B40] hover:text-white"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {c.isOpen ? "Tutup Kantin" : "Buka Kantin"}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(c)}
                  className="p-2 rounded-xl bg-[#FFF9F2] hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#245F52] transition cursor-pointer"
                  title="Edit Kantin"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Kantin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white border border-[#E8E2D9] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <h3 className="font-extrabold text-base text-[#292D2B]">
                {editingCanteen ? "Edit Kantin Mitra" : "Tambah Kantin Mitra"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#292D2B] block mb-1">Nama Kantin</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kantin Bu Siti (Blok A)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#292D2B] block mb-1">
                  Deskripsi / Spesialisasi
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Spesialis penyetan, nasi goreng, dan aneka es."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-[#292D2B] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                  className="w-4 h-4 accent-[#245F52] rounded"
                />
                Kantin sedang buka dan menerima pesanan
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#ECEDEA] hover:bg-[#E8E2D9] text-xs font-bold text-[#292D2B] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-xs font-extrabold text-white cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}