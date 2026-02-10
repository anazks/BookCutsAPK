import Axios from '../axios';

export const getAllBookings = async () => {
  try {
    const response = await Axios.get('/booking/viewAllBookings');
    console.log("Response from getAllBookings:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch bookings" };
  }
};

export const getMyProfile = async (shopId: string) => {
    try {
        const response = await Axios.get(`/shop/getMyProfile`);
        console.log("Response from getMyProfile:", response);
        return response.data;
    } catch (error: any) {  
        throw error?.response?.data || { message: "Failed to fetch profile" };
    }
}

export const getDashBoardIncome = async () => {
  try {
      const response = await Axios.get('/booking/dashboardIncome/')
      console.log("Response from dashboardIncome",response)
      return response.data
  } catch (error: any) {
      throw error?.response?.data || { message: "Failed to fetch dashboardIncme" };
  }
}

export const otpLogin = async (data) => { // ✅ Added data parameter
  try {
    const response = await Axios.post('/auth/otpRequest', data) // ✅ Pass data to API
    console.log("response of otpLogin:", response)
    return response.data
  } catch (error) {
    console.log(error)
    return { success: false, message: error.message || 'Failed to send OTP' } // ✅ Return error object
  }
}

export const verifyOtp = async (data) => { // ✅ Added data parameter
  try {
    const response = await Axios.post('/auth/verifyOtp', data) // ✅ Pass data to API
    console.log("response of verifyOtp:", response)
    return response.data
  } catch (error) {
    console.log(error)
    return { success: false, message: error.message || 'Failed to verify OTP' } // ✅ Return error object
  }
}