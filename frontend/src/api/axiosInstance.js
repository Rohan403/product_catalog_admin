/**
 * Configured Axios instance.
 * All API calls in the application should use this instance.
 */
import axios from 'axios';
import { toast } from 'react-toastify';

const axiosInstance = axios.create({
  baseURL:        '/api',
  timeout:        15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Response interceptor ───────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'An unexpected error occurred';

    // Show toast only for server-side errors (5xx), not validation (4xx)
    if (error.response?.status >= 500) {
      toast.error(`Server error: ${message}`);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
