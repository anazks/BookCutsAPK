import Axios from '../axios';

export const SlotBooking = async (data: any) => {
    try {
        const response = await Axios.post('/booking/BookNow',data);
        console.log("Response from BookNow:", response);
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || { message: "Booking failed" };
    }
}


interface BookingParams {
  limit?: number;
  lastDate?: string;     // ISO string from previous nextCursor
}

export const myBookings = async (
  params: BookingParams = {}
): Promise<{
  success: boolean;
  bookings: any[];
  nextCursor: string | null;
}> => {
  try {
    // POST + send params directly as JSON body
    const response = await Axios.post('/booking/myBookings', params);

    // Optional: basic response validation
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from server');
    }

    return response.data;
  } catch (error: any) {
    // Improved error logging – helps debugging
    console.error('myBookings failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        data: error.config.data,
      } : undefined,
    });

    // Re-throw so the component can catch & show UI error
    throw error;

    // Alternative (if you prefer not throwing):
    /*
    return {
      success: false,
      bookings: [],
      nextCursor: null,
    };
    */
  }
};

export const createOrder = async (data:any)=>{
    try {
        const response = await Axios.post('/booking/create-order',data);
        console.log("order:",response)
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

export const verifyPayment = async(data:any)=>{
    try {
        // console.log("----------------------------------",data)
        const response = await Axios.post('/booking/verifyPayment',data)
        console.log(response)
        return response.data
    } catch (error) {
        console.log(error)  
        return null   
    }
}


export const getBarberFreeTime = async (barberId, dateStr,shopId) => {
  try {
    const dateObject = new Date(dateStr);
    const isoDate = dateObject.toISOString();
    console.log("date:",dateStr)
    console.log("Sending Date to Backend:", JSON.stringify(dateStr));
    const response = await Axios.post('/booking/getBarberFreeTime', {
      barberId,
      bookingDate: dateStr,
      shopId
    });

    const data = response.data;

    // Matching your nested logic: data.success && data.availableHours.success
    if (data.success) {
      return data || [];
    }

    console.error('Unexpected data structure:', data);
    return [];

  } catch (error) {
    // Your interceptor already logs the error, so we just return the fallback here
    // But you can add specific UI logic here if needed
    return [];
  }
};

export const fetchAllAvailableTimeSlots = async (shopId,dateStr) => {
  try {
       const dateObject = new Date(dateStr);
    const isoDate = dateObject.toISOString();
    console.log("date:",dateStr)
    console.log("Sending Date to Backend:", JSON.stringify(dateStr));
    const response = await Axios.post('/booking/fetchAllAvailableTimeSlots', {
      bookingDate: dateStr,
      shopId
    });
        console.log("shop available slots:",response.data)

    const data = response.data;

    if (data.success) {
      return data || [];
    }

    console.error('Unexpected data structure:', data);
    return [];
  } catch (error) {
    return []
  }
}