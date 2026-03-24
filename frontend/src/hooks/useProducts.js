import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/productApi';
import { toast } from 'react-toastify';

export function useProducts(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn:  () => productApi.getAll(params),
    keepPreviousData: true,
  });
}

export function useProduct(idOrSlug) {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn:  () => productApi.getById(idOrSlug),
    enabled:  !!idOrSlug,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to create product';
      const validationErrors = err.response?.data?.errors;
      if (validationErrors?.length) {
        toast.error(validationErrors.map((e) => e.message).join(', '));
      } else {
        toast.error(msg);
      }
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productApi.update(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.setQueryData(['product', data.id], data);
      qc.setQueryData(['product', data.slug], data);
      toast.success('Product updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate product'),
  });
}
