"use client";

import { Input } from "@components/ui/input";
import { useDebounce } from "@hooks/useDebounce";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onSearch?: (value: string) => void;
  debounceDelay?: number;
}

export default function SearchBar({ 
  placeholder, 
  className, 
  value = "",
  onSearch, 
  debounceDelay = 500 
}: SearchBarProps) {
  const [search, setSearch] = useState(value);
  const debouncedSearch = useDebounce(search, debounceDelay);

  // Sync external value changes
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Call onSearch only when debounced value changes
  useEffect(() => {
    onSearch?.(debouncedSearch);
  }, [debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const wrapperClass = cn(
    "relative w-full",
    className ?? "md:ml-auto md:max-w-[400px] lg:max-w-[550px]"
  );

  return (
    <div className={wrapperClass}>
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder || "Search..."}
        value={search}
        onChange={handleChange}
        className="w-full rounded-lg bg-background pl-8"
      />
    </div>
  );
}
