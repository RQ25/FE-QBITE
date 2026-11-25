"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, HelpCircle } from "lucide-react";

export default function CustomerFooter() {
  return (
    <footer className="mt-16 bg-[#245F52] text-white border-t border-[#19483F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kolom 1: Identitas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 p-1.5 flex items-center justify-center">
              <Image
                src="/image/logoNOBG.png"
                alt="Q-Bite Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-extrabold text-lg tracking-tight">Q-Bite</span>
          </div>
          <p className="text-xs text-[#DCEAE5] leading-relaxed max-w-xs">
            Layanan pre-order makanan lintas kantin terjadwal untuk mahasiswa Departemen Manajemen
            Bisnis ITS. Pesan sebelum jeda kelas, ambil tanpa antre.
          </p>
        </div>

        {/* Kolom 2: Lokasi & Operasional */}
        <div className="space-y-2.5 text-xs">
          <h4 className="font-bold text-sm text-[#F8CF5F]">Titik Ambil & Jadwal</h4>
          <p className="flex items-start gap-2 text-[#DCEAE5]">
            <MapPin className="w-4 h-4 text-[#F8CF5F] shrink-0 mt-0.5" />
            <span>Drop-Point Selasar Gedung Manajemen Bisnis ITS / Ambil Langsung di Kantin Mitra</span>
          </p>
          <p className="flex items-start gap-2 text-[#DCEAE5]">
            <Clock className="w-4 h-4 text-[#F8CF5F] shrink-0 mt-0.5" />
            <span>Pemesanan dibuka H-7 hingga batas cut-off masing-masing sesi harian.</span>
          </p>
        </div>

        {/* Kolom 3: Bantuan & Akses */}
        <div className="space-y-2.5 text-xs">
          <h4 className="font-bold text-sm text-[#F8CF5F]">Bantuan & Informasi</h4>
          <p className="flex items-start gap-2 text-[#DCEAE5]">
            <HelpCircle className="w-4 h-4 text-[#F8CF5F] shrink-0 mt-0.5" />
            <span>Simpan kode order & PIN 4-digit pada halaman resi untuk verifikasi pengambilan.</span>
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-3.5 py-2 rounded-xl bg-[#19483F] hover:bg-black/25 border border-white/15 text-xs font-semibold text-white transition"
            >
              Akses Portal Pengurus →
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 px-4 text-center text-[11px] text-[#DCEAE5]/80">
        © 2026 Q-Bite — Departemen Manajemen Bisnis ITS. All rights reserved.
      </div>
    </footer>
  );
}