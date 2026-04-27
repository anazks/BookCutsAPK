
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// const BASE_URL = 'http://192.168.29.81:5000/api';
const BASE_URL = "https://bookmycutsapp-1s3p.onrender.com/api"
//  

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
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

// 🔹 Response interceptor: log responses and handle token refresh
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
    
    // Handle 401 or 403 (unauthorized/forbidden) and avoid infinite loops
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Send request directly via standard axios to avoid infinite loops with the interceptor
          const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
          
          if (refreshResponse.data && (refreshResponse.data.accessToken || refreshResponse.data.token)) {
            const newAccessToken = refreshResponse.data.accessToken || refreshResponse.data.token;
            await AsyncStorage.setItem('accessToken', newAccessToken);
            
            if (refreshResponse.data.refreshToken) {
               await AsyncStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            }
            
            // Update header with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            // Re-run the original request with the new token
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.log('❌ Refresh token failed:', refreshError);
        // Clear stored tokens as refresh token has expired or is invalid
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        // UI logic will likely handle redirecting the user to the login screen
      }
    }

    if (error.response) {
      console.log('❌ Axios Error Response:', error.response.status, error.response.data);
    } else {
      console.log('❌ Axios Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;