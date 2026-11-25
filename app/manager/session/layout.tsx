import ManagerTemplate from "@/components/managerTemplate";
import MenuList from "../menuList";

export const metadata = {
  title: "Jadwal Sesi | Q-Bite",
};

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ManagerTemplate title="Jadwal Sesi" id="session" menuList={MenuList}>
      {children}
    </ManagerTemplate>
  );
}