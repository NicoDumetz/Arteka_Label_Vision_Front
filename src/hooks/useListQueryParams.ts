// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : useListQueryParams.ts
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Friday May 15 2026
//
// =============================================================

import { useCallback, useMemo, useState } from "react";

export type SearchMode = "contains" | "prefix";
export type ListFilterValue = string | number | boolean | null | undefined;
export type ListFilters = Record<string, ListFilterValue>;
export type BackendListParams = Record<string, string | number | boolean>;

interface UseListQueryParamsOptions<Filters extends ListFilters> {
  initialSearch?: string;
  searchMode?: SearchMode;
  initialFilters?: Filters;
  limit?: number;
  initialCursor?: string | null;
}

function isEmptyFilterValue(value: ListFilterValue) {
  return value === "" || value === null || value === undefined;
}

function trimSearch(search: string) {
  return search.trim();
}

export function useListQueryParams<Filters extends ListFilters = ListFilters>({
  initialSearch = "",
  searchMode = "contains",
  initialFilters,
  limit = 50,
  initialCursor = null,
}: UseListQueryParamsOptions<Filters> = {}) {
  const [search, setSearchState] = useState(initialSearch);
  const [filters, setFiltersState] = useState<Filters>((initialFilters ?? {}) as Filters);
  const [cursor, setCursorState] = useState<string | null>(initialCursor);

  const resetCursor = useCallback(() => {
    setCursorState(null);
  }, []);

  const setSearch = useCallback((nextSearch: string) => {
    setSearchState((currentSearch) => {
      if (currentSearch === nextSearch) {
        return currentSearch;
      }

      setCursorState(null);
      return nextSearch;
    });
  }, []);

  const setFilter = useCallback(<Key extends keyof Filters>(key: Key, value: Filters[Key]) => {
    setFiltersState((currentFilters) => {
      if (currentFilters[key] === value) {
        return currentFilters;
      }

      setCursorState(null);
      return {
        ...currentFilters,
        [key]: value,
      };
    });
  }, []);

  const setFilters = useCallback((nextFilters: Partial<Filters>) => {
    setFiltersState((currentFilters) => {
      const hasChanged = Object.entries(nextFilters).some(([key, value]) => {
        return currentFilters[key as keyof Filters] !== value;
      });

      if (!hasChanged) {
        return currentFilters;
      }

      setCursorState(null);
      return {
        ...currentFilters,
        ...nextFilters,
      };
    });
  }, []);

  const setCursor = useCallback((nextCursor: string | null) => {
    setCursorState(nextCursor);
  }, []);

  const reset = useCallback(() => {
    setSearchState(initialSearch);
    setFiltersState((initialFilters ?? {}) as Filters);
    setCursorState(initialCursor);
  }, [initialCursor, initialFilters, initialSearch]);

  const backendParams = useMemo<BackendListParams>(() => {
    const params: BackendListParams = {
      limit,
    };

    const normalizedSearch = trimSearch(search);
    if (normalizedSearch) {
      params.search = normalizedSearch;
      params.search_mode = searchMode;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (!isEmptyFilterValue(value)) {
        params[key] = value;
      }
    });

    if (cursor) {
      params.cursor = cursor;
    }

    return params;
  }, [cursor, filters, limit, search, searchMode]);

  return {
    search,
    searchMode,
    filters,
    limit,
    cursor,
    backendParams,
    setSearch,
    setFilter,
    setFilters,
    setCursor,
    resetCursor,
    reset,
  };
}
