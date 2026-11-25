import { ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  Store,
  UtensilsCrossed,
  Clock,
  Users,
} from "lucide-react";

export interface IPropMenu {
  id: string;
  path: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const MenuList: IPropMenu[] = [
  {
    id: "dashboard",
    path: "/manager/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "transaksi",
    path: "/manager/transaksi",
    label: "Pesanan & Verifikasi",
    icon: <ClipboardCheck className="w-5 h-5" />,
  },
  {
    id: "canteen",
    path: "/manager/canteen",
    label: "Kantin Mitra",
    icon: <Store className="w-5 h-5" />,
  },
  {
    id: "menu",
    path: "/manager/menu",
    label: "Menu Kantin",
    icon: <UtensilsCrossed className="w-5 h-5" />,
  },
  {
    id: "session",
    path: "/manager/session",
    label: "Jadwal Sesi",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "user",
    path: "/manager/user",
    label: "Pengurus & Staff",
    icon: <Users className="w-5 h-5" />,
    adminOnly: true,
  },
];

export default MenuList;