import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor: Attach JWT bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('campusmitra_token') ||
      localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Handle response errors (401 token expiry, 503 DB unavailable)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response ? error.response.status : null;
    const data = error.response ? error.response.data : null;

    if (status === 401) {
      // Don't clear on login/register failures, only on authenticated routes
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('campusmitra_token');
        localStorage.removeItem('token');
        localStorage.removeItem('campusmitra_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    const message =
      data?.message ||
      (status === 503
        ? 'Database service is currently unavailable. Please verify MongoDB.'
        : error.message || 'An unexpected network error occurred');

    return Promise.reject({
      status,
      message,
      data,
      isNetworkError: !error.response,
    });
  }
);

export default apiClient;
export { baseURL };
