import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


const axiosInstance = axios.create({
  // https://bookmycuts.onrender.com
    // baseURL: ' https://aca5eeb8242d.ngrok-free.app/api/',
  // baseURL: 'http://localhost:3002/api/',

  baseURL: 'https://2f39c93bdb03.ngrok-free.app/api/',
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
