import { IUser } from "@/app/types";
import { getCookies } from "@/lib/server-cookie";
import { get } from "@/lib/api-bridge";
import Search from "./search";
import AddUser from "./addUser";
import EditUser from "./editUser";

const getUsers = async (search: string): Promise<IUser[]> => {
  try {
    const TOKEN = (await getCookies("token")) || "";
    const res = await get("/users", TOKEN);
    if (res.status && Array.isArray(res.data?.data)) {
      const list: IUser[] = res.data.data;
      if (!search.trim()) return list;
      const q = search.toLowerCase();
      return list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

const RoleBadge = ({ role }: { role: string }) => {
  if (role === "ADMIN") {
    return (
      <span className="bg-[#FBE4D6] text-[#C95724] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
        ADMIN
      </span>
    );
  }
  return (
    <span className="bg-[#DCEAE5] text-[#245F52] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
      STAFF
    </span>
  );
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const UserPage = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search ? String(resolvedSearchParams.search) : "";

  const userList: IUser[] = await getUsers(search);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#292D2B]">
              Manajemen Pengurus & Staff
            </h1>
            <p className="text-xs text-[#777D78] mt-1">
              Kelola akun pengurus Q-Bite (Admin akses penuh atau Staff operasional).
            </p>
          </div>
          <AddUser />
        </div>

        <div className="max-w-md pt-2 border-t border-[#E8E2D9]">
          <Search url="/manager/user" search={search} />
        </div>
      </div>

      {/* Daftar Pengurus */}
      {userList.length === 0 ? (
        <div className="p-12 rounded-2xl border border-[#E8E2D9] bg-white text-center text-sm text-[#777D78]">
          Tidak ada data pengurus atau akses dibatasi khusus Admin.
        </div>
      ) : (
        <div className="space-y-3">
          {userList.map((data) => (
            <div
              key={`user-${data.id}`}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#245F52]/40 transition flex flex-wrap items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-3.5 min-w-[220px]">
                <div className="w-11 h-11 rounded-full bg-[#245F52] text-[#F8CF5F] flex items-center justify-center font-extrabold text-sm shrink-0">
                  {data.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-[#292D2B]">{data.name}</span>
                    <RoleBadge role={data.role} />
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        data.isActive
                          ? "bg-[#DFF2E5] text-[#246B40]"
                          : "bg-[#FCE5E3] text-[#B93832]"
                      }`}
                    >
                      {data.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs text-[#777D78] mt-0.5">{data.email}</p>
                </div>
              </div>

              <div>
                <EditUser selectedUser={data} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPage;