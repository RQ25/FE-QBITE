"use client";

import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { get, post, put } from "@/lib/api-bridge";
import { GetCookie } from "@/lib/client-cookie";
import { IOrderSession } from "@/app/types";
import { ToastContainer, toast } from "react-toastify";
import { Clock, Plus, Pencil, Power, X } from "lucide-react";

export default function SessionPage() {
  const [sessions, setSessions] = useState<IOrderSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<IOrderSession | null>(null);
  const [name, setName] = useState<string>("");
  const [openTime, setOpenTime] = useState<string>("07:00");
  const [closeTime, setCloseTime] = useState<string>("11:00");
  const [deliveryTime, setDeliveryTime] = useState<string>("12:00");
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const token = GetCookie("token") || "";
    const res = await get("/sessions", token);
    if (res.status && res.data?.status) {
      setSessions(res.data.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openAddModal = () => {
    setEditingSession(null);
    setName("");
    setOpenTime("07:00");
    setCloseTime("11:00");
    setDeliveryTime("12:00");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (s: IOrderSession) => {
    setEditingSession(s);
    setName(s.name);
    setOpenTime(s.openTime);
    setCloseTime(s.closeTime);
    setDeliveryTime(s.deliveryTime);
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = GetCookie("token") || "";
    const payload = {
      name: name.trim(),
      openTime,
      closeTime,
      deliveryTime,
      isActive,
    };

    const res = editingSession
      ? await put(`/sessions/${editingSession.id}`, payload, token)
      : await post("/sessions", payload, token);

    setSubmitting(false);

    if (res.status && res.data?.status) {
      toast.success(res.data.message || "Jadwal sesi berhasil disimpan!", {
        containerId: "toastSession",
      });
      setIsModalOpen(false);
      fetchSessions();
    } else {
      toast.warning(res.message || "Gagal menyimpan jadwal sesi", {
        containerId: "toastSession",
      });
    }
  };

  const handleQuickToggle = async (s: IOrderSession) => {
    const token = GetCookie("token") || "";
    const res = await put(
      `/sessions/${s.id}`,
      {
        name: s.name,
        openTime: s.openTime,
        closeTime: s.closeTime,
        deliveryTime: s.deliveryTime,
        isActive: !s.isActive,
      },
      token
    );
    if (res.status && res.data?.status) {
      toast.success(`${s.name} sekarang ${!s.isActive ? "AKTIF" : "NONAKTIF"}`, {
        containerId: "toastSession",
      });
      fetchSessions();
    } else {
      toast.error(res.message || "Gagal mengubah status sesi", { containerId: "toastSession" });
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer containerId="toastSession" />

      {/* Header & Action */}
      <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#292D2B]">Manajemen Jadwal Sesi (WIB)</h1>
          <p className="text-xs text-[#777D78] mt-1">
            Atur jam tutup pemesanan (cutoff) dan jadwal pengantaran makanan ke titik temu.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-extrabold transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Sesi
        </button>
      </div>

      {/* Grid Jadwal Sesi */}
      {loading ? (
        <div className="p-10 rounded-2xl border border-[#E8E2D9] bg-white text-center text-sm font-medium text-[#777D78]">
          Memuat jadwal sesi...
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-10 rounded-2xl border border-[#E8E2D9] bg-white text-center text-sm text-[#777D78]">
          Belum ada sesi terjadwal.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#245F52]/40 transition flex flex-col justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#DCEAE5] text-[#245F52] flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-base text-[#292D2B]">{s.name}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                      s.isActive
                        ? "bg-[#DFF2E5] text-[#246B40]"
                        : "bg-[#FCE5E3] text-[#B93832]"
                    }`}
                  >
                    {s.isActive ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-[#FFF9F2] border border-[#E8E2D9]">
                  <div>
                    <p className="text-[10px] font-bold text-[#777D78] uppercase">Buka PO</p>
                    <p className="font-mono text-xs font-extrabold text-[#292D2B] mt-0.5">
                      {s.openTime}
                    </p>
                  </div>
                  <div className="border-x border-[#E8E2D9]">
                    <p className="text-[10px] font-bold text-[#C95724] uppercase">Tutup PO</p>
                    <p className="font-mono text-xs font-extrabold text-[#ED7134] mt-0.5">
                      {s.closeTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#245F52] uppercase">Antar</p>
                    <p className="font-mono text-xs font-extrabold text-[#245F52] mt-0.5">
                      {s.deliveryTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => handleQuickToggle(s)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    s.isActive
                      ? "bg-[#FCE5E3] hover:bg-[#B93832] text-[#B93832] hover:text-white"
                      : "bg-[#DFF2E5] hover:bg-[#246B40] text-[#246B40] hover:text-white"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {s.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(s)}
                  className="p-2 rounded-xl bg-[#FFF9F2] hover:bg-[#DCEAE5] border border-[#E8E2D9] text-[#245F52] transition cursor-pointer"
                  title="Edit Sesi"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Sesi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white border border-[#E8E2D9] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <h3 className="font-extrabold text-base text-[#292D2B]">
                {editingSession ? "Edit Jadwal Sesi" : "Tambah Jadwal Sesi"}
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
                <label className="text-xs font-bold text-[#292D2B] block mb-1">Nama Sesi</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Sesi 1 - Makan Siang"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#292D2B] block mb-1">Buka (WIB)</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#C95724] block mb-1">Tutup PO</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#245F52] block mb-1">Pengantaran</label>
                  <input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-[#292D2B] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#245F52] rounded"
                />
                Sesi aktif dan dapat dipilih pemesan
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