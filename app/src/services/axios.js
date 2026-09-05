import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const isLocalWeb = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const apiBaseUrl = Capacitor.isNativePlatform()
  ? 'https://hrms-system-yri7.onrender.com/api'
  : (isLocalWeb ? 'http://localhost:5000/api' : 'https://hrms-system-yri7.onrender.com/api');

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

export default instance;