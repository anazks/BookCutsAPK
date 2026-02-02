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

export const myBookings = async (params: BookingParams = {}): Promise<{
  success: boolean;
  bookings: any[];
  nextCursor: string | null;
  // ... other fields your backend returns
}> => {
  try {
    const response = await Axios.post('/booking/myBookings', {
      params,                    // → automatically becomes ?limit=10&lastDate=...
    });

    return response.data;
  } catch (error: any) {
    console.error('myBookings error:', error?.response?.data || error.message);

    // Let the component handle the error (throw so use catch in component works naturally)
    throw error;

    // Alternative: return fallback shape if your UI prefers it
    // return {
    //   success: false,
    //   bookings: [],
    //   nextCursor: null,
    //   message: error?.response?.data?.message || 'Failed to fetch bookings',
    // };
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