import ManagerTemplate from "@/components/managerTemplate";
import MenuList from "../menuList";

export const metadata = {
  title: "Dashboard | AEON VELVRA",
  description: "Manager Dashboard System",
};

type PropsLayout = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: PropsLayout) => {
  return (
    <ManagerTemplate
      title="Dashboard"
      id="dashboard"
      menuList={MenuList}
      user={null}
    >
      {children}
    </ManagerTemplate>
  );
};

export default RootLayout;