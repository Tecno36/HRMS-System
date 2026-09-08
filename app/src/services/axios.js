import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const isLocalWeb = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const apiBaseUrl = Capacitor.isNativePlatform()
  ? 'https://hrms-system-1-r05y.onrender.com/api'
  : (isLocalWeb ? 'http://localhost:5000/api' : 'https://hrms-system-1-r05y.onrender.com/api');

const instance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      const customError = new Error('Network error. Please check your internet connection.');
      customError.isNetworkError = true;
      return Promise.reject(customError);
    }
    
    if (error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default instance;