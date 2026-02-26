import Axios from '../axios';

export const userRegister = async (userData: any) => {
    try {
        console.log("User Data in userRegister:", userData);
        const response = await Axios.post('/auth/user/register', userData);
        console.log("Response from userRegister:", response);
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || { message: "Registration failed" };
    }
}

export const userLogin = async (userData: any) => {
    try {
        console.log("User Data in userLogin:", userData);
        const response = await Axios.post('/auth/user/login', userData);
        console.log("Response from userLogin:", response);
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || { message: "Login failed" };
    }
}

export const getmyProfile = async (userId: string) => {
    try {
        const response = await Axios.get('/auth/user/getProfile');
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || { message: "Failed to fetch profile" };
    }
}

export const fetchUniqueServices = async () => {
    try {
        const response = await Axios.get('/shop/fetchAllUniqueService')
        return response.data
    } catch (error) {
        throw error?.response?.data || { message: "Faild to fetch unique service" }
    }
}

export const fetchUpcomingBooking  = async (userId) => {
    try {
    console.log("USER ID:",userId)
    const response = await Axios.get(`booking/fetchUpComingBooking/${userId}`)
        return response.data   
    } catch (error) {
        console.log(error)
    }
}

export const fetchPremiumShops = async () => {
    try {
        const response = await Axios.get('shop/getAllPremium')
        return response.data
    } catch (error) {
        console.log(error)
    }
}

export const forgotPassword = async (data) => {
    try {
        const resposne = await Axios.post('/auth/forgot-password',data)
        return resposne.data
    } catch (error) {
        console.log(error)
    }
}

export const verifyForgotOtp = async (data) => {
    try {
        const response = await Axios.post('auth/verify-forgot-otp',data)
        return response.data
    } catch (error) {
        console.log(error)
    }
}

export const resetPassword = async (data) => {
    try {
        const response = await Axios.post('auth/reset-password',data)
        return response.data
    } catch (error) {
        console.log(error)
    }
}

export const userGoogleSignin = async (data) => {
    try {
        const response = await Axios.post('auth/user/google-sigin',data)
        return response.data
    } catch (error) {
        console.log(error)
    }
}

export const getNearbyCitiesFallback = async (lat: number, lon: number) => {
  try {
    const response = await Axios.get('/api/cities/nearby', {   // ← better endpoint name
      params: { lat, lon },
    });

    return response.data;   // ← usually you want this
  } catch (error) {
    console.error('Error fetching nearby cities:', error);
    
    // Option A: throw so caller can handle it
    throw error;

    // Option B: return null / empty array + handle in UI
    // return { success: false, data: [], error: 'Failed to load cities' };
  }
};

