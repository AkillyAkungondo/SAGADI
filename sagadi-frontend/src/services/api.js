import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@SAGADI:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Requisição:', config.method.toUpperCase(), config.url);
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => {
    console.log('Resposta:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Erro na requisição:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('@SAGADI:token');
      localStorage.removeItem('@SAGADI:user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;