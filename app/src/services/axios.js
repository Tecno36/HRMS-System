import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const apiBaseUrl = Capacitor.isNativePlatform() 
  ? 'http://192.168.1.46:5000/api' 
  : 'http://localhost:5000/api';  

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