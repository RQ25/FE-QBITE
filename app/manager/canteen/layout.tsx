import ManagerTemplate from "@/components/managerTemplate";
import MenuList from "../menuList";

export const metadata = {
  title: "Kantin Mitra | Q-Bite",
};

export default function CanteenLayout({ children }: { children: React.ReactNode }) {
  return (
    <ManagerTemplate title="Kantin Mitra" id="canteen" menuList={MenuList}>
      {children}
    </ManagerTemplate>
  );
}