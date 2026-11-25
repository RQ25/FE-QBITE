"use client";

import { useRouter } from "next/navigation";
import { KeyboardEvent, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";

type Props = {
  url: string;
  search: string;
};

const Search = ({ url, search }: Props) => {
  const [keyword, setKeyword] = useState<string>(search);
  const router = useRouter();

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      router.push(`${url}?search=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const handleClear = () => {
    setKeyword("");
    router.push(url);
  };

  return (
    <div className="relative flex items-center w-full">
      <SearchIcon className="w-4 h-4 text-[#777D78] absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        id="keyword"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleSearch}
        placeholder="Cari nama atau email pengurus lalu Enter..."
        className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#292D2B] placeholder:text-[#777D78] focus:border-[#245F52] focus:outline-none"
      />
      {keyword && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-1 rounded-lg hover:bg-[#FCF0E4] text-[#777D78] hover:text-[#292D2B] cursor-pointer"
          title="Reset pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Search;