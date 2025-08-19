import React, { useState, useCallback, useMemo } from "react";
import { self } from "@/services/request";
import useSWR from "swr";

interface ImagingDiagnostic {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
}

interface UseImagingDiagnosticsParams {
  searchTerm?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

interface UseImagingDiagnosticsResult {
  diagnostics: ImagingDiagnostic[];
  loading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  searchDiagnostics: (term: string) => Promise<ImagingDiagnostic[]>;
  loadMore: () => void;
  refresh: () => void;
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const useOptimizedImagingDiagnostics = ({
  searchTerm = "",
  limit = 50,
  offset = 0,
  enabled = true
}: UseImagingDiagnosticsParams = {}): UseImagingDiagnosticsResult => {
  const [allDiagnostics, setAllDiagnostics] = useState<ImagingDiagnostic[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Create cache key
  const cacheKey = enabled
    ? `/api/diagnostics/imaging?search=${encodeURIComponent(debouncedSearchTerm)}&limit=${limit}&offset=${offset}`
    : null;

  const fetcher = useCallback(async (url: string) => {
    const result = await self.get<{
      status: boolean;
      data: {
        data: ImagingDiagnostic[];
        total: number;
        message: string;
      };
    }>(url);

    if (result.status && result.data) {
      return {
        diagnostics: result.data.data.map((diag: ImagingDiagnostic) => ({
          ...diag,
          description: typeof diag.description === "string" ? diag.description : undefined,
        })),
        total: result.data.total
      };
    }

    return { diagnostics: [], total: 0 };
  }, []);

  const { data, error, isLoading, mutate } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000, // 30 seconds cache
  });

  // Update state when data changes
  React.useEffect(() => {
    if (data) {
      if (offset === 0) {
        // New search or initial load
        setAllDiagnostics(data.diagnostics);
      } else {
        // Loading more results
        setAllDiagnostics(prev => [...prev, ...data.diagnostics]);
      }
      setTotalCount(data.total);
    }
  }, [data, offset]);

  // Search function for instant filtering
  const searchDiagnostics = useCallback(async (term: string): Promise<ImagingDiagnostic[]> => {
    if (!term.trim()) {
      return [];
    }

    try {
      const url = `/api/diagnostics/imaging/search?q=${encodeURIComponent(term)}&limit=20`;
      const result = await self.get<{
        status: boolean;
        data: {
          data: ImagingDiagnostic[];
          message: string;
        };
      }>(url);

      if (result.status && result.data) {
        return result.data.data.map((diag: ImagingDiagnostic) => ({
          ...diag,
          description: typeof diag.description === "string" ? diag.description : undefined,
        }));
      }
    } catch (error) {
      console.error("Search diagnostics error:", error);
    }

    return [];
  }, []);

  const loadMore = useCallback(() => {
    // This would trigger a new SWR request with updated offset
    // Implementation depends on how you want to handle pagination
  }, []);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const hasMore = useMemo(() => {
    return allDiagnostics.length < totalCount;
  }, [allDiagnostics.length, totalCount]);

  return {
    diagnostics: allDiagnostics,
    loading: isLoading,
    error,
    total: totalCount,
    hasMore,
    searchDiagnostics,
    loadMore,
    refresh
  };
};
