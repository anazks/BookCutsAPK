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
        console.log(response)
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