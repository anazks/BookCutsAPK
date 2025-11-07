import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'http://192.168.29.81:3002/api';     

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  // ❌ Don't set Content-Type here - let axios handle it based on data type
});

// 🔹 Request interceptor: attach token + log request
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // ✅ Only set Content-Type to JSON if it's not FormData
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }
      // If it IS FormData, axios will automatically set the correct Content-Type with boundary

      console.log('➡️ Axios Request:', {
        method: config.method?.toUpperCase(),
        url: config.baseURL + config.url,
        headers: config.headers,
        dataType: config.data instanceof FormData ? 'FormData' : 'JSON',
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