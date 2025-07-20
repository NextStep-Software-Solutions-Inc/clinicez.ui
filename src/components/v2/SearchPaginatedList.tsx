"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/dashboard/SearchBar";
import { Button } from "@/components/ui/button";
import { Filter, ArrowUpDown } from "lucide-react";
import Each from "../utils/Each";

interface SearchPaginatedListProps<T> {
  data: T[];
  searchBy: (item: T, search: string) => boolean;
  render: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
}

export default function SearchPaginatedList<T>({
  data,
  searchBy,
  render,
  itemsPerPage = 6,
}: SearchPaginatedListProps<T>) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase().trim() ?? "";

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter((item) => searchBy(item, search));
  }, [search, data, searchBy]);

  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const visibleData = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage);
  };

  return (
    <>
      {/* Search and Filter Section */}
      <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 w-full flex gap-3 items-center">
          <SearchBar placeholder="Search..." className="flex-1" />
          <Button variant="outline" size="default" className="flex items-center gap-2 bg-transparent whitespace-nowrap">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="default" className="flex items-center gap-2 bg-transparent whitespace-nowrap">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>

      {/* Rendered List */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Each 
          of={visibleData}
          render={(item, i) => (
            <div key={i}>{render (item, i)}</div>
          )}
        />
        {/* {visibleData.map((item, i) => (
          <div key={i}>{render(item, i)}</div>
        ))} */}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button variant="outline" size="lg" className="px-8 bg-transparent" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </>
  );
}
