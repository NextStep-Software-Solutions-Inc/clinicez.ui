"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Filter, Search as SearchIcon, X as ClearIcon } from "lucide-react";

import SearchBar from "@/components/dashboard/SearchBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppPagination from "@/components/v2/pagination/AppPagination";
import { useDebounce } from "@/hooks/useDebounce";

import Each from "../utils/Each";

const DEFAULT_DEBOUNCE = 400;

type BaseProps<T> = {
  data: T[];
  render: (item: T, index: number) => ReactNode;
  searchPlaceholder?: string;
  itemsWrapperClassName?: string;
  emptyMessage?: string;
  filterSlot?: ReactNode;
  sortSlot?: ReactNode;
  loadingSlot?: ReactNode;
};

type LocalSearchPaginatedListProps<T> = BaseProps<T> & {
  mode?: "local";
  searchBy: (item: T, search: string) => boolean;
  itemsPerPage?: number;
};

type RemoteSearchPaginatedListProps<T> = BaseProps<T> & {
  mode: "remote";
  searchValue: string;
  onSearchChange: (value: string) => void;
  pagination: {
    page: number;
    totalPages: number;
    generateHref: (page: number) => string;
  };
  debounceMs?: number;
  isSearching?: boolean;
  onNavigate?: (page: number) => void;
};

type SearchPaginatedListProps<T> =
  | LocalSearchPaginatedListProps<T>
  | RemoteSearchPaginatedListProps<T>;

function FilterSortButtons({
  filterSlot,
  sortSlot,
}: {
  filterSlot?: ReactNode;
  sortSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {filterSlot ?? (
        <Button
          variant="outline"
          size="default"
          className="flex items-center gap-2 bg-transparent"
        >
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      )}
      {sortSlot ?? (
        <Button
          variant="outline"
          size="default"
          className="flex items-center gap-2 bg-transparent"
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort
        </Button>
      )}
    </div>
  );
}

function LocalSearchPaginatedList<T>(props: LocalSearchPaginatedListProps<T>) {
  const {
    data,
    searchBy,
    render,
    itemsPerPage = 6,
    searchPlaceholder = "Search...",
    itemsWrapperClassName = "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
    filterSlot,
    sortSlot,
    emptyMessage = "No results found.",
    loadingSlot: _loadingSlot,
  } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase().trim() ?? "";

  const handleSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter((item) => searchBy(item, search));
  }, [data, search, searchBy]);

  const [visibleCount, setVisibleCount] = useState(itemsPerPage);

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [itemsPerPage, search]);

  const visibleData = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            placeholder={searchPlaceholder}
            className="flex-1"
            value={search}
            onSearch={handleSearch}
          />
          <FilterSortButtons filterSlot={filterSlot} sortSlot={sortSlot} />
        </div>
      </div>

      {visibleData.length ? (
        <div className={itemsWrapperClassName}>
          <Each
            of={visibleData}
            render={(item, index) => (
              <div key={index}>{render(item, index)}</div>
            )}
          />
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          {emptyMessage}
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            className="bg-transparent px-8"
            onClick={handleLoadMore}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function RemoteSearchPaginatedList<T>(props: RemoteSearchPaginatedListProps<T>) {
  const {
    data,
    render,
    searchValue,
    onSearchChange,
    pagination,
    debounceMs = DEFAULT_DEBOUNCE,
    isSearching = false,
    searchPlaceholder = "Search...",
    itemsWrapperClassName = "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3",
    emptyMessage = "No results found.",
    filterSlot,
    sortSlot,
    loadingSlot,
    onNavigate,
  } = props;

  const [inputValue, setInputValue] = useState(searchValue);
  const debouncedValue = useDebounce(inputValue, debounceMs);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    if (debouncedValue === searchValue) {
      return;
    }

    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange, searchValue]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleClearSearch = () => {
    setInputValue("");
    onSearchChange("");
  };

  const showEmptyState = !data.length && !isSearching;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg bg-background pl-8 focus-visible:ring-primary-v2"
              aria-label="Search"
            />
            {inputValue ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1.5 h-7 w-7"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <ClearIcon className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <FilterSortButtons filterSlot={filterSlot} sortSlot={sortSlot} />
        </div>
      </div>

      {isSearching ? (
        loadingSlot ?? (
          <div className="text-center text-sm text-muted-foreground sm:text-base">
            Searching...
          </div>
        )
      ) : showEmptyState ? (
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          {emptyMessage}
        </p>
      ) : (
        <div className={itemsWrapperClassName}>
          <Each
            of={data}
            render={(item, index) => (
              <div key={index}>{render(item, index)}</div>
            )}
          />
        </div>
      )}

      <AppPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        generateHref={pagination.generateHref}
        onNavigate={onNavigate}
        isDisabled={isSearching}
      />
    </div>
  );
}

export default function SearchPaginatedList<T>(props: SearchPaginatedListProps<T>) {
  if (props.mode === "remote") {
    return <RemoteSearchPaginatedList {...props} />;
  }

  return <LocalSearchPaginatedList {...props} />;
}
