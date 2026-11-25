"use client";

import React, { useEffect, useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomerTemplate from "@/components/customerTemplate";
import { get, post } from "@/lib/api-bridge";
import { ICanteen, IMenu, IOrderSession, ICartItem } from "@/app/types";
import { BASE_IMAGE_MENU } from "@/global";
import { ToastContainer, toast } from "react-toastify";
import {
  Calendar,
  Clock,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Store,
  AlertCircle,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Flame,
  MapPin,
  Info,
  X,
} from "lucide-react";

interface SavedOrderHistory {
  id: string;
  orderCode: string;
  deliveryDate: string;
  totalAmount: number;
}

interface EnrichedMenu extends IMenu {
  imageUrl?: string | null;
  totalSold?: number;
  remainingQuota?: number | null;
}

const DELIVERY_FEE_DROP_POINT = 2000;
const STORAGE_HISTORY_KEY = "qbite_recent_orders";

const getUpcomingDates = () => {
  const dates: { value: string; dayName: string; label: string; isToday: boolean }[] = [];
  const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

  for (let i = 0; i <= 7; i++) {
    const d = new Date(nowWib);
    d.setDate(nowWib.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const value = `${yyyy}-${mm}-${dd}`;
    const dayName = i === 0 ? "Hari Ini" : d.toLocaleDateString("id-ID", { weekday: "short" });
    const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    dates.push({ value, dayName, label, isToday: i === 0 });
  }
  return dates;
};

export default function CustomerOrderPage() {
  const router = useRouter();
  const upcomingDates = useMemo(() => getUpcomingDates(), []);

  // Data Master
  const [canteens, setCanteens] = useState<ICanteen[]>([]);
  const [menus, setMenus] = useState<EnrichedMenu[]>([]);
  const [availableSessions, setAvailableSessions] = useState<IOrderSession[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);

  // Pilihan Jadwal
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0]?.value || "");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Filter Katalog
  const [selectedCanteen, setSelectedCanteen] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Keranjang & Checkout
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState<boolean>(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"DROP_POINT" | "SELF_PICKUP">(
    "DROP_POINT"
  );
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Riwayat Pesanan Tersimpan Khusus Perangkat Ini
  const [recentOrders, setRecentOrders] = useState<SavedOrderHistory[]>([]);

  // Load Kantin & Validasi Riwayat Perangkat Terhadap Server
  useEffect(() => {
    const fetchCanteens = async () => {
      const canteenRes = await get("/canteens");
      if (canteenRes.status && canteenRes.data?.status) {
        setCanteens(canteenRes.data.data || []);
      }
    };
    fetchCanteens();

    const syncDeviceOrders = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
        if (!raw) return;
        const parsed: SavedOrderHistory[] = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return;

        // Pastikan hanya order yang masih eksis di database yang tampil di perangkat ini
        const checks = await Promise.all(
          parsed.map(async (item) => {
            const res = await get(`/orders/${item.id}`);
            return res.status && res.data?.status && res.data?.data ? item : null;
          })
        );
        const validOrders = checks.filter((x): x is SavedOrderHistory => x !== null);
        setRecentOrders(validOrders);
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(validOrders));
      } catch {
        localStorage.removeItem(STORAGE_HISTORY_KEY);
      }
    };
    syncDeviceOrders();
  }, []);

  const handleClearDeviceOrders = () => {
    localStorage.removeItem(STORAGE_HISTORY_KEY);
    setRecentOrders([]);
    setIsOrdersModalOpen(false);
    toast.info("Riwayat pesanan di perangkat ini telah dibersihkan.", {
      containerId: "toastCustomer",
    });
  };

  // Load Sesi Aktif setiap kali tanggal berubah
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSessions = async () => {
      setLoadingSession(true);
      const res = await get(`/sessions/available?date=${selectedDate}`);
      if (res.status && res.data?.status) {
        const list: IOrderSession[] = res.data.data || [];
        setAvailableSessions(list);
        setSelectedSessionId(list.length > 0 ? list[0].id : null);
      } else {
        setAvailableSessions([]);
        setSelectedSessionId(null);
      }
      setLoadingSession(false);
    };
    fetchSessions();
  }, [selectedDate]);

  // Load Menu & Sisa Kuota Real-Time berdasarkan tanggal + sesi terpilih
  useEffect(() => {
    const fetchMenus = async () => {
      setLoadingMenu(true);
      const queryParams = new URLSearchParams();
      if (selectedDate) queryParams.set("deliveryDate", selectedDate);
      if (selectedSessionId) queryParams.set("sessionId", String(selectedSessionId));

      const menuRes = await get(`/menus?${queryParams.toString()}`);
      if (menuRes.status && menuRes.data?.status) {
        setMenus(menuRes.data.data || []);
      }
      setLoadingMenu(false);
    };
    fetchMenus();
  }, [selectedDate, selectedSessionId]);

  const getMenuImage = (menu: EnrichedMenu) => menu.imageUrl || menu.picture || null;

  const getItemQty = (menuId: number) =>
    cart.find((item) => item.menuId === menuId)?.quantity || 0;

  const updateCartQty = (menu: EnrichedMenu, delta: number) => {
    const maxAllowed =
      menu.remainingQuota !== null && menu.remainingQuota !== undefined
        ? menu.remainingQuota
        : menu.dailyQuota;

    setCart((prev) => {
      const existing = prev.find((i) => i.menuId === menu.id);
      if (!existing && delta > 0) {
        if (maxAllowed !== null && maxAllowed !== undefined && maxAllowed <= 0) {
          toast.warning("Kuota menu ini untuk sesi terpilih sudah habis.", {
            containerId: "toastCustomer",
          });
          return prev;
        }
        return [
          ...prev,
          {
            menuId: menu.id,
            canteenId: menu.canteenId,
            canteenName: menu.canteen?.name || `Kantin #${menu.canteenId}`,
            name: menu.name,
            price: menu.price,
            picture: getMenuImage(menu) || undefined,
            quantity: 1,
            dailyQuota: maxAllowed,
          },
        ];
      }
      if (!existing) return prev;

      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((i) => i.menuId !== menu.id);
      }
      if (maxAllowed !== null && maxAllowed !== undefined && nextQty > maxAllowed) {
        toast.warning(`Maksimal sisa kuota menu ini ${maxAllowed} porsi.`, {
          containerId: "toastCustomer",
        });
        return prev;
      }
      return prev.map((i) => (i.menuId === menu.id ? { ...i, quantity: nextQty } : i));
    });
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === "DROP_POINT" ? DELIVERY_FEE_DROP_POINT : 0;
  const grandTotalAmount = subtotalAmount + deliveryFee;

  const isEmailValid =
    customerEmail === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  const isPhoneValid =
    customerPhone === "" || /^(08|628|\+628)\d{7,12}$/.test(customerPhone.replace(/\s|-/g, ""));

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!selectedSessionId) {
      toast.warning("Pilih sesi pengantaran terlebih dahulu!", { containerId: "toastCustomer" });
      return;
    }
    if (cart.length === 0) {
      toast.warning("Keranjang pesanan masih kosong!", { containerId: "toastCustomer" });
      return;
    }
    if (!isEmailValid || !isPhoneValid) {
      toast.warning("Periksa kembali format email dan nomor WhatsApp aktif.", {
        containerId: "toastCustomer",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.replace(/\s|-/g, ""),
        notes: notes.trim() || undefined,
        sessionId: selectedSessionId,
        deliveryDate: selectedDate,
        deliveryMethod,
        items: cart.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      };

      const res = await post("/orders", payload);
      if (res.status && res.data?.status && res.data?.data?.id) {
        const created = res.data.data;
        const newEntry: SavedOrderHistory = {
          id: created.id,
          orderCode: created.orderCode,
          deliveryDate: selectedDate,
          totalAmount: created.totalAmount,
        };
        const updatedHistory = [newEntry, ...recentOrders.filter((r) => r.id !== created.id)].slice(
          0,
          5
        );
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

        toast.success("Pesanan dibuat! Mengalihkan ke pembayaran QRIS...", {
          containerId: "toastCustomer",
        });
        router.replace(`/order/${created.id}`);
      } else {
        toast.error(res.message || res.data?.message || "Gagal membuat pesanan.", {
          containerId: "toastCustomer",
        });
        setSubmitting(false);
      }
    } catch {
      toast.error("Terjadi gangguan jaringan saat checkout.", { containerId: "toastCustomer" });
      setSubmitting(false);
    }
  };

  const popularMenus = useMemo(() => {
    const available = menus.filter((m) => m.isAvailable && m.canteen?.isOpen !== false);
    const sorted = [...available].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    return sorted.slice(0, 3);
  }, [menus]);

  const filteredMenus = menus.filter((m) => {
    const matchCanteen =
      selectedCanteen === "ALL" || String(m.canteenId) === selectedCanteen;
    const matchCategory = selectedCategory === "ALL" || m.category === selectedCategory;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.canteen?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCanteen && matchCategory && matchSearch;
  });

  const activeSessionObj = availableSessions.find((s) => s.id === selectedSessionId);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <CustomerTemplate
      cartCount={totalItems}
      recentOrdersCount={recentOrders.length}
      onOpenCart={() => setIsCartOpen(true)}
      onOpenOrders={() => setIsOrdersModalOpen(true)}
    >
      <ToastContainer containerId="toastCustomer" />

      <div className="space-y-10 pb-24">
        {/* 1. HERO SECTION */}
        <section className="rounded-3xl bg-[#245F52] text-white p-6 sm:p-10 relative overflow-hidden shadow-sm">
          <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-[#19483F] pointer-events-none" />
          <div className="absolute right-12 top-6 w-20 h-20 rounded-2xl rotate-12 bg-[#F8CF5F]/15 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#19483F] text-[#F8CF5F] text-xs font-bold tracking-wide">
                Pre-Order Kantin MB ITS • Bebas Antre
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                Makan Siang Harga Kantin,{" "}
                <span className="text-[#F8CF5F]">Siap Ambil Pas Jeda Kelas.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#DCEAE5] max-w-2xl leading-relaxed">
                Gabungkan menu favorit dari berbagai kantin kampus dalam sekali pesan sebelum jam
                tutup sesi. Bayar praktis pakai QRIS, lalu tinggal ambil pakai PIN.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <a
                  href="#jadwal"
                  className="px-5 py-3 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-sm font-bold inline-flex items-center gap-2 transition shadow-sm"
                >
                  Mulai Pesan Sekarang <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#menu"
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
                >
                  Lihat Daftar Menu
                </a>
              </div>
            </div>

            {/* Kartu Ringkas Pesanan Aktif Khusus Perangkat Ini */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl bg-[#19483F] border border-white/15 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F8CF5F]">
                    Status Pesanan Kamu
                  </span>
                  <Receipt className="w-4 h-4 text-[#DCEAE5]" />
                </div>
                {recentOrders.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#DCEAE5]">
                      Lacak status pembayaran & PIN pengambilan di perangkat ini:
                    </p>
                    {recentOrders.slice(0, 2).map((ord) => (
                      <Link
                        key={ord.id}
                        href={`/order/${ord.id}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#245F52] hover:bg-black/20 border border-white/10 text-xs transition"
                      >
                        <div>
                          <span className="font-mono font-bold text-white block">
                            {ord.orderCode}
                          </span>
                          <span className="text-[11px] text-[#DCEAE5]">{ord.deliveryDate}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-bold text-[#F8CF5F]">
                          Lacak <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#DCEAE5] leading-relaxed">
                    Belum ada pesanan aktif di perangkat ini. Pilih sesi & menu di bawah untuk mulai
                    pre-order.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. TODAY'S SCHEDULE (scroll-mt-24 agar tidak tertutup sticky header saat diklik) */}
        <section
          id="jadwal"
          className="scroll-mt-24 rounded-2xl bg-[#FFF9F2] border border-[#E8E2D9] p-5 sm:p-7 space-y-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#245F52]">
                Langkah 1 • Today&apos;s Schedule
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#292D2B] mt-0.5">
                Pilih Tanggal & Sesi Pengantaran
              </h2>
            </div>
            {activeSessionObj && (
              <span className="px-3 py-1.5 rounded-xl bg-[#FFF4D5] text-[#946200] text-xs font-bold">
                Cut-off PO: {activeSessionObj.closeTime} WIB
              </span>
            )}
          </div>

          {/* Date Chips (H s/d H+7) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#777D78] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#245F52]" /> Tanggal Pengantaran (H s/d H+7)
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {upcomingDates.map((d) => {
                const active = selectedDate === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setSelectedDate(d.value)}
                    className={`px-4 py-2.5 rounded-xl border text-left shrink-0 transition cursor-pointer ${
                      active
                        ? "bg-[#245F52] border-[#245F52] text-white shadow-sm"
                        : "bg-white border-[#E8E2D9] text-[#292D2B] hover:border-[#245F52]"
                    }`}
                  >
                    <p
                      className={`text-[11px] font-semibold ${
                        active ? "text-[#F8CF5F]" : "text-[#777D78]"
                      }`}
                    >
                      {d.dayName}
                    </p>
                    <p className="text-sm font-extrabold">{d.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#777D78] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#245F52]" /> Sesi Tersedia (WIB)
            </label>
            {loadingSession ? (
              <p className="text-xs text-[#777D78] py-2">Memuat jadwal sesi...</p>
            ) : availableSessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FCE5E3] text-[#B93832] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Semua sesi untuk tanggal ini sudah melewati batas cut-off. Silakan pilih tanggal
                berikutnya.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {availableSessions.map((s) => {
                  const active = selectedSessionId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? "bg-[#DCEAE5] border-[#245F52] text-[#292D2B]"
                          : "bg-white border-[#E8E2D9] text-[#292D2B] hover:border-[#245F52]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#245F52]">{s.name}</span>
                        {active && <CheckCircle2 className="w-4 h-4 text-[#245F52]" />}
                      </div>
                      <p className="text-xs text-[#292D2B] mt-1.5">
                        Estimasi siap / antar:{" "}
                        <strong className="text-[#245F52]">{s.deliveryTime} WIB</strong>
                      </p>
                      <p className="text-[11px] font-semibold text-[#C95724] mt-0.5">
                        Batas order: {s.closeTime} WIB
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 3. POPULAR MENUS */}
        {!loadingMenu && popularMenus.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#FBE4D6] text-[#ED7134] flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-[#292D2B]">Popular Menus</h2>
                  <p className="text-xs text-[#777D78]">
                    Pilihan paling sering dipesan mahasiswa MB ITS
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularMenus.map((menu) => {
                const qty = getItemQty(menu.id);
                const imgFile = getMenuImage(menu);
                const quotaLeft =
                  menu.remainingQuota !== null && menu.remainingQuota !== undefined
                    ? menu.remainingQuota
                    : menu.dailyQuota;
                const soldOut = quotaLeft !== null && quotaLeft !== undefined && quotaLeft <= 0;

                return (
                  <div
                    key={`pop-${menu.id}`}
                    className="rounded-2xl bg-[#FFF9F2] border border-[#E8E2D9] overflow-hidden flex flex-col justify-between shadow-sm hover:border-[#245F52]/50 transition"
                  >
                    <div>
                      <div className="h-40 bg-[#DCEAE5] relative overflow-hidden">
                        {imgFile ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${BASE_IMAGE_MENU}/${imgFile}`}
                            alt={menu.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {menu.category === "DRINK" ? "🥤" : "🍱"}
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#245F52] text-[#F8CF5F] text-[11px] font-bold">
                          Terlaris
                        </span>
                      </div>

                      <div className="p-4 space-y-1">
                        <p className="text-[11px] font-bold text-[#245F52]">{menu.canteen?.name}</p>
                        <h3 className="font-extrabold text-base text-[#292D2B] line-clamp-1">
                          {menu.name}
                        </h3>
                        {menu.description && (
                          <p className="text-xs text-[#777D78] line-clamp-2">{menu.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-base text-[#292D2B]">
                          {formatRupiah(menu.price)}
                        </p>
                        {quotaLeft !== null && quotaLeft !== undefined && (
                          <p className="text-[11px] text-[#777D78]">Sisa {quotaLeft} porsi</p>
                        )}
                      </div>

                      {soldOut ? (
                        <span className="px-3 py-1.5 rounded-xl bg-[#ECEDEA] text-[#626761] text-xs font-bold">
                          Kuota Habis
                        </span>
                      ) : qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateCartQty(menu, 1)}
                          className="px-3.5 py-2 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-white border border-[#E8E2D9] rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateCartQty(menu, -1)}
                            className="w-6 h-6 rounded-lg bg-[#FCF0E4] hover:bg-[#E8E2D9] flex items-center justify-center text-[#292D2B] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-extrabold w-5 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(menu, 1)}
                            className="w-6 h-6 rounded-lg bg-[#ED7134] hover:bg-[#C95724] flex items-center justify-center text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. CANTEEN SELECTION & SEMUA MENU (scroll-mt-24 agar pas di bawah sticky header) */}
        <section id="menu" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#245F52]">
                Langkah 2 • Canteen Selection & Menu
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#292D2B] mt-0.5">
                Gabungkan Menu Lintas Kantin dalam 1 Pesanan
              </h2>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#777D78] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu atau nama kantin..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] placeholder:text-[#777D78] focus:border-[#245F52] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCanteen("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                selectedCanteen === "ALL"
                  ? "bg-[#245F52] text-white border-[#245F52]"
                  : "bg-white text-[#292D2B] border-[#E8E2D9] hover:border-[#245F52]"
              }`}
            >
              Semua Kantin
            </button>
            {canteens.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCanteen(String(c.id))}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedCanteen === String(c.id)
                    ? "bg-[#245F52] text-white border-[#245F52]"
                    : "bg-white text-[#292D2B] border-[#E8E2D9] hover:border-[#245F52]"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                {c.name}
                {!c.isOpen && (
                  <span className="px-1.5 py-0.5 rounded bg-[#FCE5E3] text-[#B93832] text-[10px]">
                    Tutup
                  </span>
                )}
              </button>
            ))}

            <span className="h-5 w-px bg-[#E8E2D9] mx-1 hidden sm:inline-block" />

            {(["ALL", "FOOD", "DRINK"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#DCEAE5] text-[#245F52] border-[#245F52]"
                    : "bg-white text-[#777D78] border-[#E8E2D9] hover:text-[#292D2B]"
                }`}
              >
                {cat === "ALL" ? "Semua Jenis" : cat === "FOOD" ? "Makanan" : "Minuman"}
              </button>
            ))}
          </div>

          {loadingMenu ? (
            <p className="text-sm text-[#777D78] text-center py-12">Memuat daftar menu...</p>
          ) : filteredMenus.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#FFF9F2] border border-[#E8E2D9] text-center text-sm text-[#777D78]">
              Menu tidak ditemukan untuk filter yang dipilih.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMenus.map((menu) => {
                const qty = getItemQty(menu.id);
                const imgFile = getMenuImage(menu);
                const canteenClosed = menu.canteen?.isOpen === false;
                const quotaLeft =
                  menu.remainingQuota !== null && menu.remainingQuota !== undefined
                    ? menu.remainingQuota
                    : menu.dailyQuota;
                const quotaEmpty = quotaLeft !== null && quotaLeft !== undefined && quotaLeft <= 0;
                const unavailable = !menu.isAvailable || canteenClosed || quotaEmpty;

                return (
                  <div
                    key={menu.id}
                    className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition ${
                      unavailable
                        ? "bg-[#FFF9F2]/60 border-[#E8E2D9] opacity-65"
                        : "bg-[#FFF9F2] border-[#E8E2D9] hover:border-[#245F52]/50 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="h-44 bg-[#DCEAE5] relative overflow-hidden">
                        {imgFile ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${BASE_IMAGE_MENU}/${imgFile}`}
                            alt={menu.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {menu.category === "DRINK" ? "🥤" : "🍱"}
                          </div>
                        )}

                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/95 text-[#245F52] text-[11px] font-bold shadow-xs">
                          {menu.canteen?.name}
                        </span>

                        {unavailable && (
                          <div className="absolute inset-0 bg-[#292D2B]/65 flex items-center justify-center px-3">
                            <span className="px-3 py-1 rounded-lg bg-[#FCE5E3] text-[#B93832] text-xs font-extrabold uppercase tracking-wider">
                              {canteenClosed
                                ? "Kantin Tutup"
                                : quotaEmpty
                                  ? "Kuota Habis"
                                  : "Menu Habis"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h3 className="font-extrabold text-base text-[#292D2B] leading-snug">
                          {menu.name}
                        </h3>
                        {menu.description && (
                          <p className="text-xs text-[#777D78] line-clamp-2 leading-relaxed">
                            {menu.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-[#E8E2D9]/60 mt-2">
                      <div>
                        <p className="font-extrabold text-base text-[#292D2B]">
                          {formatRupiah(menu.price)}
                        </p>
                        {quotaLeft !== null && quotaLeft !== undefined && (
                          <p className="text-[11px] font-medium text-[#777D78]">
                            Sisa kuota: {quotaLeft} porsi
                          </p>
                        )}
                      </div>

                      {!unavailable && (
                        <div>
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => updateCartQty(menu, 1)}
                              className="px-3.5 py-2 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-white border border-[#E8E2D9] rounded-xl px-2 py-1">
                              <button
                                type="button"
                                onClick={() => updateCartQty(menu, -1)}
                                className="w-6 h-6 rounded-lg bg-[#FCF0E4] hover:bg-[#E8E2D9] flex items-center justify-center text-[#292D2B] cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-extrabold w-5 text-center">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(menu, 1)}
                                className="w-6 h-6 rounded-lg bg-[#ED7134] hover:bg-[#C95724] flex items-center justify-center text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. ORDER REMINDER */}
        <section className="rounded-2xl bg-[#FFF4D5] border border-[#F8CF5F] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8CF5F]/40 text-[#946200] flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-[#946200]">
                Pengingat Batas Pemesanan & Pembayaran QRIS
              </h3>
              <p className="text-xs text-[#292D2B]/85 leading-relaxed">
                Selesaikan checkout & unggah bukti transfer QRIS maksimal{" "}
                <strong>15 menit setelah pesan</strong> atau sebelum{" "}
                <strong>jam tutup sesi ({activeSessionObj?.closeTime || "sesuai jadwal"} WIB)</strong>{" "}
                agar pesananmu langsung diproses dapur kantin.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* FLOATING CART BAR */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 rounded-2xl bg-[#ED7134] hover:bg-[#C95724] text-white shadow-xl flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/15 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold opacity-95">{totalItems} Item di Keranjang</p>
                <p className="text-base font-extrabold">{formatRupiah(subtotalAmount)}</p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-xl bg-white text-[#ED7134] text-xs font-extrabold inline-flex items-center gap-1.5">
              Lanjut Checkout <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}

      {/* MODAL RIWAYAT PESANAN DI PERANGKAT INI (MY ORDERS) */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E8E2D9] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#292D2B]">My Orders</h3>
                <p className="text-xs text-[#777D78]">
                  Riwayat pesanan yang dibuat dari browser/perangkat ini
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrdersModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-xs text-[#777D78] py-6 text-center">
                Belum ada riwayat pesanan yang tersimpan di browser ini.
              </p>
            ) : (
              <>
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {recentOrders.map((ord) => (
                    <Link
                      key={ord.id}
                      href={`/order/${ord.id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F2] hover:bg-[#DCEAE5]/60 border border-[#E8E2D9] transition"
                    >
                      <div>
                        <p className="font-mono font-bold text-sm text-[#245F52]">{ord.orderCode}</p>
                        <p className="text-xs text-[#777D78]">
                          {ord.deliveryDate} • {formatRupiah(ord.totalAmount)}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-lg bg-[#245F52] text-white text-xs font-bold inline-flex items-center gap-1">
                        Buka Resi <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E8E2D9] flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearDeviceOrders}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B93832] hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bersihkan Riwayat di Perangkat Ini
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* DRAWER / MODAL CHECKOUT */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-[#292D2B]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white border border-[#E8E2D9] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-[#292D2B]">Konfirmasi & Checkout</h3>
                <p className="text-xs text-[#777D78]">
                  Jadwal: <strong>{selectedDate}</strong> •{" "}
                  <strong>{activeSessionObj?.name || "-"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daftar Item Keranjang */}
            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-xs text-[#777D78] text-center py-6">
                  Keranjang masih kosong. Tambahkan menu terlebih dahulu.
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menuId}
                    className="p-3 rounded-xl bg-[#FFF9F2] border border-[#E8E2D9] flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-[#245F52]">{item.canteenName}</p>
                      <p className="text-xs font-bold text-[#292D2B]">{item.name}</p>
                      <p className="text-xs font-extrabold text-[#245F52]">
                        {formatRupiah(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(
                            { id: item.menuId, dailyQuota: item.dailyQuota } as EnrichedMenu,
                            -1
                          )
                        }
                        className="p-1.5 rounded-lg bg-white border border-[#E8E2D9] hover:bg-[#FCF0E4] text-[#292D2B] cursor-pointer"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-[#B93832]" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-xs font-extrabold w-4 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(
                            { id: item.menuId, dailyQuota: item.dailyQuota } as EnrichedMenu,
                            1
                          )
                        }
                        className="p-1.5 rounded-lg bg-[#ED7134] hover:bg-[#C95724] text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pilihan Metode Pengambilan & Ongkir */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2D9]">
              <label className="text-xs font-bold text-[#292D2B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#245F52]" /> Metode Pengambilan Pesanan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("DROP_POINT")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    deliveryMethod === "DROP_POINT"
                      ? "bg-[#DCEAE5] border-[#245F52] text-[#292D2B]"
                      : "bg-white border-[#E8E2D9] text-[#292D2B] hover:border-[#245F52]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#245F52]">Drop-Point MB</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FBE4D6] text-[#C95724] text-[11px] font-extrabold">
                      +Rp 2.000
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777D78] mt-1">
                    Diantar kolektif ke titik ambil Gedung MB ITS
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod("SELF_PICKUP")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    deliveryMethod === "SELF_PICKUP"
                      ? "bg-[#DCEAE5] border-[#245F52] text-[#292D2B]"
                      : "bg-white border-[#E8E2D9] text-[#292D2B] hover:border-[#245F52]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#245F52]">Ambil di Kantin</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#DFF2E5] text-[#246B40] text-[11px] font-extrabold">
                      Gratis (Rp 0)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777D78] mt-1">
                    Ambil langsung di stand kantin mitra tanpa antre
                  </p>
                </button>
              </div>
            </div>

            {/* Form Data Pemesan */}
            <form onSubmit={handleCheckout} className="space-y-3 pt-2 border-t border-[#E8E2D9]">
              <div>
                <label className="text-xs font-bold text-[#292D2B] block mb-1">
                  Nama Lengkap / Panggilan
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Thoriq (MB '26)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#292D2B] block mb-1">
                    Email (Untuk Link Resi & PIN)
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="nama@student.its.ac.id"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-[#292D2B] focus:outline-none ${
                      !isEmailValid
                        ? "border-[#B93832]"
                        : "border-[#E8E2D9] focus:border-[#245F52]"
                    }`}
                  />
                  {!isEmailValid && (
                    <p className="text-[10px] text-[#B93832] mt-1">Format email tidak valid</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-[#292D2B] block mb-1">
                    No. WhatsApp Aktif
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-[#292D2B] focus:outline-none ${
                      !isPhoneValid
                        ? "border-[#B93832]"
                        : "border-[#E8E2D9] focus:border-[#245F52]"
                    }`}
                  />
                  {!isPhoneValid && (
                    <p className="text-[10px] text-[#B93832] mt-1">Gunakan awalan 08 / 628</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#292D2B] block mb-1">
                  Catatan Pesanan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sambal dipisah / titip meja depan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] focus:border-[#245F52] focus:outline-none"
                />
              </div>

              {/* Ringkasan Biaya Transparan */}
              <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#E8E2D9] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#777D78]">
                  <span>Subtotal Makanan ({totalItems} item)</span>
                  <span className="font-semibold text-[#292D2B]">
                    {formatRupiah(subtotalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-[#777D78]">
                  <span>
                    Ongkos Kirim ({deliveryMethod === "DROP_POINT" ? "Drop-Point MB" : "Ambil di Kantin"})
                  </span>
                  <span className="font-semibold text-[#292D2B]">
                    {deliveryFee === 0 ? "Gratis (Rp 0)" : formatRupiah(deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between">
                  <span className="font-bold text-[#292D2B]">Total Pembayaran QRIS</span>
                  <span className="text-lg font-extrabold text-[#245F52]">
                    {formatRupiah(grandTotalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedSessionId || cart.length === 0}
                className="w-full py-3.5 rounded-xl bg-[#ED7134] hover:bg-[#C95724] text-white font-extrabold text-sm transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Membuat Pesanan..." : "Konfirmasi & Lanjut Bayar QRIS →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </CustomerTemplate>
  );
}