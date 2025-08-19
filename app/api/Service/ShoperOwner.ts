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