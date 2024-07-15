"use client";

import { Input } from "@components/ui/input"
import { useDebounce } from "@hooks/useDebounce";
import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  placeholder?: string
}

export default function SearchBar({placeholder}: SearchBarProps) {
  const [search, setSearch] = useState("")
  const router = useRouter()
  const debounceValue = useDebounce(search, 500)
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current  || debounceValue) {
      isMountedRef.current = true;
      const searchParams = new URLSearchParams();
      searchParams.set("search", debounceValue);
      router.push(`?${searchParams.toString()}`);
    }
  }, [debounceValue, router]);
  
  return (
    <div className="relative ml-auto flex-1 md:grow-0">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder || "Search..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg bg-background pl-8 md:w-[400px] lg:w-[550px]"
      />
    </div>
  )
}
