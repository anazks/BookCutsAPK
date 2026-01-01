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

export const myBookings = async ()=>{
   try {
        const response = await Axios.post('/booking/myBookings');
        console.log("Response from myBookings:", response);
        return response.data;   
   } catch (error) {
      console.log(error)
   }
}

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