const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'API Request failed');
  }

  return data;
};
