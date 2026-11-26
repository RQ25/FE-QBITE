import { IMenu, ICanteen } from "@/app/types";
import { getCookies } from "@/lib/server-cookie";
import { BASE_IMAGE_MENU } from "@/global";
import { get } from "@/lib/api-bridge";
import Search from "./search";
import AddMenu from "./addMenu";
import EditMenu from "./editMenu";
import DeleteMenu from "./deleteMenu";
import { UtensilsCrossed } from "lucide-react";

interface EnrichedMenu extends IMenu {
  imageUrl?: string | null;
}

const getMenus = async (search: string): Promise<EnrichedMenu[]> => {
  try {
    const TOKEN = (await getCookies("token")) || "";
    const url = `/menus?search=${encodeURIComponent(search)}`;
    const res = await get(url, TOKEN);
    if (res.status && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching menu:", error);
    return [];
  }
};

const getCanteens = async (): Promise<ICanteen[]> => {
  try {
    const TOKEN = (await getCookies("token")) || "";
    const res = await get("/canteens", TOKEN);
    if (res.status && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching canteens:", error);
    return [];
  }
};

const resolveMenuImg = (raw: string | null | undefined) => {
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `${BASE_IMAGE_MENU}/${raw}`;
};

const CategoryBadge = ({ category }: { category: string }) => {
  if (category === "FOOD") {
    return (
      <span className="bg-[#FBE4D6] text-[#C95724] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
        Makanan
      </span>
    );
  }
  return (
    <span className="bg-[#DCEAE5] text-[#245F52] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
      Minuman
    </span>
  );
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const MenuPage = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search ? String(resolvedSearchParams.search) : "";

  const [menus, canteens] = await Promise.all([getMenus(search), getCanteens()]);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#292D2B]">Manajemen Menu Kantin</h1>
            <p className="text-xs text-[#777D78] mt-1">
              Kelola daftar makanan & minuman lintas kantin, harga, kuota harian, dan ketersediaan.
            </p>
          </div>
          <AddMenu canteens={canteens} />
        </div>

        <div className="max-w-md pt-2 border-t border-[#E8E2D9]">
          <Search url="/manager/menu" search={search} />
        </div>
      </div>

      {menus.length === 0 ? (
        <div className="p-12 rounded-2xl border border-[#E8E2D9] bg-white text-center text-sm text-[#777D78]">
          Belum ada data menu ditemukan.
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((data) => {
            const imgRaw = data.imageUrl || data.picture;

            return (
              <div
                key={`menu-${data.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#245F52]/40 transition flex flex-wrap items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-4 min-w-[240px] flex-1">
                  <div className="w-15 h-15 rounded-xl overflow-hidden bg-[#FFF9F2] border border-[#E8E2D9] shrink-0 flex items-center justify-center">
                    {imgRaw ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMenuImg(imgRaw)}
                        alt={data.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="w-6 h-6 text-[#245F52]/40" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-[#292D2B]">{data.name}</span>
                      <CategoryBadge category={data.category} />
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          data.isAvailable
                            ? "bg-[#DFF2E5] text-[#246B40]"
                            : "bg-[#FCE5E3] text-[#B93832]"
                        }`}
                      >
                        {data.isAvailable ? "Tersedia" : "Habis / Nonaktif"}
                      </span>
                    </div>
                    <p className="text-xs text-[#245F52] font-bold mt-0.5">
                      {data.canteen?.name || `Kantin #${data.canteenId}`}
                    </p>
                    {data.description && (
                      <p className="text-xs text-[#777D78] line-clamp-1 mt-0.5">
                        {data.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-5 ml-auto sm:ml-0">
                  <div className="text-left sm:text-right">
                    <p className="text-base font-extrabold text-[#245F52]">
                      {formatRupiah(data.price)}
                    </p>
                    <p className="text-[11px] font-medium text-[#777D78]">
                      Kuota:{" "}
                      {data.dailyQuota !== null && data.dailyQuota !== undefined
                        ? `${data.dailyQuota} porsi/hari`
                        : "Tanpa batas"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <EditMenu selectedMenu={data} canteens={canteens} />
                    <DeleteMenu selectedMenu={data} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuPage;