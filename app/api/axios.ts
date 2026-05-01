
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// const BASE_URL = 'http://10.135.145.39:5000/api';
const BASE_URL = "https://bookmycutsapp-1s3p.onrender.com/api"
//  

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  // ❌ Don't set Content-Type here - let axios handle it based on data type
});

// Variables to handle multiple requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

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

      console.log(
        '➡️ Axios Request:\n',
        JSON.stringify(
          {
            method: config.method?.toUpperCase(),
            url: (config.baseURL || '') + (config.url || ''),
            headers: config.headers,
            dataType: config.data instanceof FormData ? 'FormData' : 'JSON',
            payload: config.data
          },
          null,
          2
        )
      );

      return config;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  (error) => Promise.reject(error)
);

// 🔹 Response interceptor with Token Refresh Logic
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      '✅ Axios Response:\n',
      JSON.stringify(
        {
          status: response.status,
          data: response.data
        },
        null,
        2
      )
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      console.log('❌ Axios Error Response:', error.response.status, error.response.data);
    } else {
      console.log('❌ Axios Error Message:', error.message);
    }

    // Check if error is 401 (expired) or 403 (missing) and request has not been retried yet
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // If already refreshing, queue the request until refresh is complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Attempting to refresh token...');
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken: refreshToken,
        });

        // Handle the backend response for refresh token.
        // E.g., const { accessToken } = response.data;
        const accessToken = response.data?.accessToken || response.data?.token;

        if (!accessToken) {
            throw new Error('Invalid refresh token response');
        }

        await AsyncStorage.setItem('accessToken', accessToken);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }

        processQueue(null, accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        console.log('❌ Refresh token failed:', refreshError);
        processQueue(refreshError, null);
        
        // Log out the user by clearing storage
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'role', 'shopId']);
        
        // We reject with the original error so that the caller knows it was an auth error
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;