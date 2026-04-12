"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { VALID_HP_SORT_OPTIONS, type HPSortOption } from "@/actions/hp.actions";

function parseSortOption(raw: string | null | undefined): HPSortOption {
  if (raw && (VALID_HP_SORT_OPTIONS as readonly string[]).includes(raw)) {
    return raw as HPSortOption;
  }
  return "name-asc";
}

interface UseHPListNavigationParams {
  hpTypeName: string;
  initialSearch?: string;
}

export function useHPListNavigation({
  hpTypeName,
  initialSearch = "",
}: UseHPListNavigationParams) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const canonicalTypeName = hpTypeName.trim();
  const safeTypeName = canonicalTypeName.length ? canonicalTypeName : hpTypeName;

  const searchParamValue = searchParams?.get("search") ?? undefined;
  const sortParamValue = searchParams?.get("sort") ?? undefined;

  const activeSearch = useMemo(() => {
    if (typeof searchParamValue === "string") {
      return searchParamValue;
    }
    return initialSearch;
  }, [initialSearch, searchParamValue]);

  const activeSort = useMemo<HPSortOption>(() => parseSortOption(sortParamValue), [sortParamValue]);

  const normalizedActiveSearch = activeSearch.trim();

  const pushWithParams = useCallback(
    (params: URLSearchParams) => {
      const currentQuery = searchParams?.toString() ?? "";
      const nextQuery = params.toString();

      if (nextQuery === currentQuery) {
        return;
      }

      const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      startTransition(() => {
        router.push(nextPath);
      });
    },
    [pathname, router, searchParams],
  );

  const buildParams = useCallback(
    (overrides: { search?: string; page?: number; sort?: HPSortOption }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("type", safeTypeName);

      const nextSearch = overrides.search !== undefined ? overrides.search : normalizedActiveSearch;
      if (nextSearch) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }

      const nextSort = overrides.sort ?? activeSort;
      if (nextSort && nextSort !== "name-asc") {
        params.set("sort", nextSort);
      } else {
        params.delete("sort");
      }

      const nextPage = overrides.page ?? 1;
      params.set("page", nextPage.toString());

      return params;
    },
    [searchParams, safeTypeName, normalizedActiveSearch, activeSort],
  );

  const handleSearchChange = useCallback(
    (nextValue: string) => {
      if (!safeTypeName) return;
      pushWithParams(buildParams({ search: nextValue.trim(), page: 1 }));
    },
    [buildParams, pushWithParams, safeTypeName],
  );

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      if (!safeTypeName) return;
      const targetPage = Number.isFinite(pageNumber) ? Math.max(1, Math.floor(pageNumber)) : 1;
      pushWithParams(buildParams({ page: targetPage }));
    },
    [buildParams, pushWithParams, safeTypeName],
  );

  const handleSortChange = useCallback(
    (nextSort: HPSortOption) => {
      if (!safeTypeName) return;
      pushWithParams(buildParams({ sort: nextSort, page: 1 }));
    },
    [buildParams, pushWithParams, safeTypeName],
  );

  const createHref = useCallback(
    (pageNumber: number) => {
      if (!safeTypeName) return pathname;
      const params = buildParams({ page: pageNumber });
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [buildParams, pathname, safeTypeName],
  );

  return {
    activeSearch,
    normalizedActiveSearch,
    activeSort,
    handleSearchChange,
    handlePageChange,
    handleSortChange,
    createHref,
    isPending,
  };
}
