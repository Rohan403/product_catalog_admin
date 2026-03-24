import api from './axiosInstance';

export const productApi = {
  /** Paginated product list */
  getAll: (params = {}) =>
    api.get('/products', { params }).then((r) => r.data),

  /** Single product by ID or slug */
  getById: (idOrSlug) =>
    api.get(`/products/${idOrSlug}`).then((r) => r.data.data),

  /** Create a product */
  create: (data) =>
    api.post('/products', data).then((r) => r.data.data),

  /** Update a product */
  update: (id, data) =>
    api.put(`/products/${id}`, data).then((r) => r.data.data),

  /** Deactivate a product */
  remove: (id) =>
    api.delete(`/products/${id}`).then((r) => r.data),
};
