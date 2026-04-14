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

export const getmyProfile = async (userId?: string) => {
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
    } catch (error: any) {
        throw error?.response?.data || { message: "Failed to send OTP" };
    }
}

export const verifyForgotOtp = async (data) => {
    try {
        const response = await Axios.post('auth/verify-forgot-otp',data)
        return response.data
    } catch (error: any) {
        throw error?.response?.data || { message: "OTP verification failed" };
    }
}

export const resetPassword = async (data) => {
    try {
        const response = await Axios.post('auth/reset-password',data)
        return response.data
    } catch (error: any) {
        throw error?.response?.data || { message: "Password reset failed" };
    }
}

export const userGoogleSignin = async (data) => {
    try {
        const response = await Axios.post('auth/user/google-signin',data)
        return response.data
    } catch (error: any) {
        throw error?.response?.data || { message: "Google Sign-In connection failed." };
    }
}

export const getNearbyCitiesFallback = async (lat: number, lng: number) => {
  try {
    console.log(`🔍 Fetching fallback cities for: ${lat}, ${lng}...`);
    const response = await Axios.get('/auth/cities', {
      params: { lat, lng },
    });
    
    console.log('✅ Fallback Cities Raw Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching nearby cities fallback:', error.response?.data || error.message);
    throw error;
  }
};

export const savePushToken = async (pushToken) => {
  try {

    // 👉 THE FIX: Notice the backticks (`) and ${pushToken} in the URL
    const response = await Axios.post(
      `/auth/register-push-token/${pushToken}`, 
    );

    console.log('✅ Push token successfully saved:', response.data);
    return response.data;

  } catch (error) {
    console.error(
      '❌ Failed to save push token:', 
      error.response?.data || error.message
    );
  }
};

export const getNotifications = async () => {
  try {
    const response = await Axios.get('/auth/notification');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return null;
  }
};

export const getCustomization = async (screen?: string) => {
  try {
    const response = await Axios.get('/auth/customization', {
      params: screen ? { screen } : {}
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching customization:', error);
    return null;
  }
};
