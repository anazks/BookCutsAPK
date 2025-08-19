import Axios from '../axios';



export const getAllShops = async () => {
  try {
    const response = await Axios.get('/shop/ViewAllShop');
    console.log("Response from getAllShops:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Registration failed" };
  }
};

export const getShopById = async (shopId: string) => {
  try {
    let id =shopId
    let data = id
    const response = await Axios.post('/shop/viewSigleShop/', {id});
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch shop details" };
  }
};

export const getmyBarbers = async (shopId: string) => {
  try {
    const response = await Axios.get(`/shop/viewSingleShopBarbers/${shopId}`);
    console.log("Response from getmyBarbers:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch barbers" };
  }
}
export const getShopServices = async (shopId: string) => {
  try {
    const response = await Axios.get(`/shop/viewSingleShopService/${shopId}`);
    console.log("Response from getShopServices:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch shop services" };
  }
}

export const getShopBookings = async ()=>{
  try {
    let response = await Axios('/shop/viewMyBooking')
    console.log(response)
    console.log(response)
    return response.data
  } catch (error) {
    console.log(error)
    return null
  }
}
// --------------------------------for Shop Side------------------------------------------------------------
export const RegisterShopUser = async (data: any) => {
  try {
    const response = await Axios.post('/auth/shop/register', data);
    console.log("Response from RegisterShopUser:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Registration failed" };
  }
}

export const LoginShopUser = async (data: any) => {
  try {
    console.log("Data being sent to LoginShopUser:", data);
    const response = await Axios.post('/auth/shop/login', data);
    console.log("Response from LoginShopUser:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Login failed" };
  }
}

export const AddBarber = async (data: any) => {
  try {
    console.log("Data being sent to AddBarber:", data);
    const response = await Axios.post('/shop/addBarber', data);
    console.log("Response from AddBarber:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to add barber" };
  }
}

export const viewMyBarbers = async (shopId: string) => {
  try {
    const response = await Axios.get(`/shop/viewMyBarbers/`);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch barbers" };
  }
}

export const AddService = async (data: any) => {
  try {
    const response = await Axios.post('/shop/addService', data);
    console.log("Response from AddService:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to add service" };
  }
}

export const viewMyService = async (shopId: string) => {
  try {
    const response = await Axios.get(`/shop/viewMyService`);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch services" };
  }
}

export const addNewShop = async (data: any) => {
  try {

    console.log("Data being sent to addShop:", data);
    const response = await Axios.post('/shop/addShop', data);
    console.log("Response from addShop:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to add shop" };
  }
}

export const viewMyShop = async () => {
  try {
    const response = await Axios.get('/shop/viewMyshop/');
    console.log("Response from viewMyShop:", response);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch shop details" };
  }
}