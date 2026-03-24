import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';

export function useSearch(params = {}) {
  const enabled = !!(params.q || params.categoryId);
  return useQuery({
    queryKey:         ['search', params],
    queryFn:          () => searchApi.search(params),
    enabled,
    keepPreviousData: true,
    staleTime:        1000 * 30,
  });
}

export function useFilterOptions(categoryId) {
  return useQuery({
    queryKey:  ['filter-options', categoryId],
    queryFn:   () => searchApi.getFilterOptions(categoryId),
    enabled:   !!categoryId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSuggestions(q) {
  return useQuery({
    queryKey:  ['suggestions', q],
    queryFn:   () => searchApi.getSuggestions(q),
    enabled:   !!q && q.length >= 2,
    staleTime: 1000 * 10,
  });
}
