import { useState, useCallback, useEffect } from "react";
import { PaginatedResponse } from "@/shared/api/baseService";

interface UsePaginationOptions<T> {
  initialPage?: number;
  initialPerPage?: number;
  fetchFn: (page: number, perPage: number) => Promise<PaginatedResponse<T>>;
}

interface UsePaginationReturn<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  goToPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  refetch: () => Promise<void>;
}

export function usePagination<T>({
  initialPage = 1,
  initialPerPage = 20,
  fetchFn,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPageState] = useState(initialPerPage);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFn(page, perPage);
      setData(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao carregar dados"));
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, fetchFn]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const setPerPage = useCallback((newPerPage: number) => {
    setPerPageState(newPerPage);
    setPage(1);
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    page,
    perPage,
    total,
    totalPages,
    isLoading,
    error,
    goToPage,
    setPerPage,
    refetch,
  };
}
