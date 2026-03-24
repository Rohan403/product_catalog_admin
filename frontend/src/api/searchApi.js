import api from './axiosInstance';

export const searchApi = {
  /**
   * Full-text + filter search.
   * @param {{ q, categoryId, filters, page, limit, sortBy }} params
   */
  search: (params = {}) => {
    // Flatten nested filter objects into filter[key]=value
    const { filters = {}, ...rest } = params;
    const query = { ...rest };
    for (const [key, val] of Object.entries(filters)) {
      if (val !== null && val !== undefined && val !== '') {
        if (typeof val === 'object' && !Array.isArray(val)) {
          // Range: filter[ram][min] etc.
          if (val.min !== undefined) query[`filter[${key}][min]`] = val.min;
          if (val.max !== undefined) query[`filter[${key}][max]`] = val.max;
        } else if (Array.isArray(val)) {
          query[`filter[${key}]`] = val;
        } else {
          query[`filter[${key}]`] = val;
        }
      }
    }
    return api.get('/search', { params: query }).then((r) => r.data.data);
  },

  /** Dynamic filter options for a category */
  getFilterOptions: (categoryId) =>
    api.get(`/search/filters/${categoryId}`).then((r) => r.data.data),

  /** Autocomplete suggestions */
  getSuggestions: (q) =>
    api.get('/search/suggestions', { params: { q } }).then((r) => r.data.data),
};
