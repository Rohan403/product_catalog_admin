import api from './axiosInstance';

export const categoryApi = {
  /** Fetch all categories */
  getAll: (includeInactive = false) =>
    api.get('/categories', { params: { includeInactive } }).then((r) => r.data.data),

  /** Fetch a single category with its attributes */
  getById: (idOrSlug) =>
    api.get(`/categories/${idOrSlug}`).then((r) => r.data.data),

  /** Create a category */
  create: (data) =>
    api.post('/categories', data).then((r) => r.data.data),

  /** Update a category */
  update: (id, data) =>
    api.put(`/categories/${id}`, data).then((r) => r.data.data),

  /** Deactivate a category */
  remove: (id) =>
    api.delete(`/categories/${id}`).then((r) => r.data),

  // ── Attributes ─────────────────────────────────────────────
  /** Fetch attributes for a category */
  getAttributes: (categoryId) =>
    api.get(`/categories/${categoryId}/attributes`).then((r) => r.data.data),

  /** Add an attribute to a category */
  createAttribute: (categoryId, data) =>
    api.post(`/categories/${categoryId}/attributes`, data).then((r) => r.data.data),

  /** Update an attribute */
  updateAttribute: (categoryId, attrId, data) =>
    api.put(`/categories/${categoryId}/attributes/${attrId}`, data).then((r) => r.data.data),

  /** Delete an attribute */
  deleteAttribute: (categoryId, attrId) =>
    api.delete(`/categories/${categoryId}/attributes/${attrId}`).then((r) => r.data),
};
