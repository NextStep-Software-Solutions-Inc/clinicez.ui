"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

  const activeSearch = useMemo(() => {
    if (typeof searchParamValue === "string") {
      return searchParamValue;
    }
    return initialSearch;
  }, [initialSearch, searchParamValue]);

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
    [pathname, router, searchParams, startTransition],
  );

  const handleSearchChange = useCallback(
    (nextValue: string) => {
      if (!safeTypeName) {
        return;
      }
      const trimmedValue = nextValue.trim();
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      params.set("type", safeTypeName);

      if (trimmedValue) {
        params.set("search", trimmedValue);
      } else {
        params.delete("search");
      }

      params.set("page", "1");

      pushWithParams(params);
    },
    [pushWithParams, safeTypeName, searchParams],
  );

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      if (!safeTypeName) {
        return;
      }

      const targetPage = Number.isFinite(pageNumber) ? Math.max(1, Math.floor(pageNumber)) : 1;
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      params.set("type", safeTypeName);

      if (normalizedActiveSearch) {
        params.set("search", normalizedActiveSearch);
      } else {
        params.delete("search");
      }

      params.set("page", targetPage.toString());

      pushWithParams(params);
    },
    [normalizedActiveSearch, pushWithParams, safeTypeName, searchParams],
  );

  const createHref = useCallback(
    (pageNumber: number) => {
      if (!safeTypeName) {
        return pathname;
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("type", safeTypeName);

      if (normalizedActiveSearch) {
        params.set("search", normalizedActiveSearch);
      } else {
        params.delete("search");
      }

      params.set("page", pageNumber.toString());

      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [normalizedActiveSearch, pathname, safeTypeName, searchParams],
  );

  return {
    activeSearch,
    normalizedActiveSearch,
    handleSearchChange,
    handlePageChange,
    createHref,
    isPending,
  };
}
