import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// 👇 Replace this with your machine's IP address
// Android Emulator: 'http://10.0.2.2:3002/api/'
// iOS Simulator or real device: 'http://192.168.29.81:3002/api/'
const BASE_URL = 'http://10.18.120.39:3002/api/';     

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔹 Request interceptor: attach token + log request
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('➡️ Axios Request:', {
        method: config.method?.toUpperCase(),
        url: config.baseURL + config.url,
        headers: config.headers,
        data: config.data,
      });

      return config;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  (error) => Promise.reject(error)
);

// 🔹 Response interceptor: log responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Axios Response:', response.status, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.log('❌ Axios Error Response:', error.response.status, error.response.data);
    } else {
      console.log('❌ Axios Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
