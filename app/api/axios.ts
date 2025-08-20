import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


const axiosInstance = axios.create({
  // https://bookmycuts.onrender.com
  // http://localhost:3002/api/
// https://b19e2a345648.ngrok-free.app
  baseURL: 'http://localhost:3002/api', // ⬅️ Replace with your real API base URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

export default axiosInstance;
