import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { toast } from 'react-toastify';

export function useCategories(options = {}) {
  return useQuery({
    queryKey: ['categories', options],
    queryFn:  () => categoryApi.getAll(options.includeInactive),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategory(idOrSlug) {
  return useQuery({
    queryKey: ['category', idOrSlug],
    queryFn:  () => categoryApi.getById(idOrSlug),
    enabled:  !!idOrSlug,
  });
}

export function useCategoryAttributes(categoryId) {
  return useQuery({
    queryKey: ['category-attributes', categoryId],
    queryFn:  () => categoryApi.getAttributes(categoryId),
    enabled:  !!categoryId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create category'),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => categoryApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['category', id] });
      toast.success('Category updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update category'),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate category'),
  });
}

export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, data }) => categoryApi.createAttribute(categoryId, data),
    onSuccess: (_, { categoryId }) => {
      qc.invalidateQueries({ queryKey: ['category-attributes', categoryId] });
      qc.invalidateQueries({ queryKey: ['category', categoryId] });
      toast.success('Attribute added');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add attribute'),
  });
}

export function useDeleteAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, attrId }) => categoryApi.deleteAttribute(categoryId, attrId),
    onSuccess: (_, { categoryId }) => {
      qc.invalidateQueries({ queryKey: ['category-attributes', categoryId] });
      qc.invalidateQueries({ queryKey: ['category', categoryId] });
      toast.success('Attribute deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete attribute'),
  });
}
