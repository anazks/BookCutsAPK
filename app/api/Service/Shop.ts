import Axios from '../axios';
import AsyncStorage from '@react-native-async-storage/async-storage';



export const getAllShops = async () => {
  try {
    const response = await Axios.get('/shop/ViewAllShop');
    console.log("Response from getAllShops:", JSON.stringify(response, null, 2));
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Registration failed" };
  }
};

export const getShopById = async (shopId: string) => {
  try {
    let id = shopId
    let data = id
    const response = await Axios.post('/shop/viewSigleShop/', { id });
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


interface GetShopBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const getShopBookings = async (
  params: GetShopBookingsParams = {}
) => {
  try {
    const { page = 1, limit = 10, status } = params;

    const response = await Axios.get("/shop/viewMyBooking", {
      params: {
        page,
        limit,
        status
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching shop bookings:", error);
    return null;
  }
};
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
    // console.log("Response from LoginShopUser:", response);
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

export const viewMyBarbers = async (shopId?: string) => {
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

export const viewMyService = async () => {
  try {
    const response = await Axios.get(`/shop/viewMyService`);
    return response.data;
  } catch (error: any) {
    // Handle 404 specially - return empty array instead of throwing
    if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
        message: "No services found"
      };
    }
    // For other errors, still throw
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

export const modifyBarber = async (barberId, data) => {
  try {
    const response = await Axios.put(`/shop/updateBarber/${barberId}`, data)
    return response.data
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update barber" }
  }
}

export const modifyService = async (serviceId, data) => {
  try {
    const response = await Axios.put(`/shop/editService/${serviceId}`, data)
    return response.data
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to edit service" }
  }
}

export const deleteBarberAPI = async (barberId, shopId) => {
  try {
    console.log("barberId:", barberId);
    const response = await Axios.delete(`/shop/deleteBarber/${barberId}/${shopId}`);
    console.log('Delete barber response:', response);
    return response;
  } catch (error: any) {
    console.error('Delete barber API error:', error);
    throw error?.response?.data || { message: "Failed to delete" };
  }
};

export const deleteServiceAPI = async (serviceId) => {
  try {
    console.log("serviceId:", serviceId);
    const response = await Axios.delete(`/shop/deleteService/${serviceId}`);
    console.log('Delete service response:', response);
    return response;
  } catch (error: any) {
    console.error('Delete barber API error:', error);
    throw error?.response?.data || { message: "Failed to delete" };
  }
}

export const findNearestShops = async ({ latitude, longitude, page = 1, limit = 10 }) => {
  try {
    console.log({ latitude, longitude, page, limit }, "in shop.ts");
    const lat = latitude;
    const lng = longitude;

    const shops = await Axios.get('/shop/findNearByShops', {
      params: { lat, lng, page, limit },
    });

    return shops.data;
  } catch (error) {
    console.log("Error fetching nearest shops:", error);
    throw error;
  }
};

export const saveToCloud = async (shopId: string, data: FormData) => {
  try {
    console.log('📤 Uploading to:', `/uploadMedia/${shopId}`);

    // Backend route is /uploadMedia/:id, so shopId goes in URL
    const response = await Axios.post(`/uploadMedia/${shopId}`, data, {
      headers: {
        'Accept': 'application/json',
        // Content-Type will be handled automatically by interceptor
      },
      timeout: 60000, // 60 seconds for file uploads
    });

    console.log('✅ Upload successful:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Axios upload error:', error);

    // Handle axios error structure
    if (error.response) {
      // Server responded with error status
      console.error('Error response data:', error.response.data);
      const errorMessage = error.response.data?.message || 'Failed to store in cloud';
      throw { message: errorMessage };
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      throw { message: 'No response from server. Check your connection.' };
    } else if (error.message) {
      // Something else happened
      throw { message: error.message };
    } else {
      throw { message: 'Failed to store in cloud' };
    }
  }
};

export const search = async (q) => {
  try {
    // Use template literal with proper query parameter
    const response = await Axios.get(`/shop/search?q=${encodeURIComponent(q)}`);
    console.log("search result", JSON.stringify(response, null, 2))
    return response.data;

  } catch (error) {
    console.log(error);
    return null;
  }
};

export const addWorkingHours = async (shopId, days) => {
  try {
    const response = await Axios.post('/shop/workingHours/addWorkingHours', {
      shopId,
      days
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const updateWorkinghours = async (data) => {
  try {
    const response = await Axios.put('/shop/workingHours/updateWorkingHours', data)
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const getWorkingHours = async (shopId) => {
  try {
    const response = await Axios.get(`/shop/workingHours/getWorkingHoursByShop/${shopId}`)
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const filterShopsByService = async ({ shopIds, serviceName }) => {
  try {
    const response = await Axios.post('/shop/filterShopsByService', {
      shopIds,    // array
      serviceName     // string
    });
    return response.data;
  } catch (error) {
    console.error("filterShopsByService error:", error);
    throw error;
  }
};

export const createBankDetails = async (data) => {
  try {
    const response = await Axios.post('/shop/saveBankDetails', data)
    return response.data
  } catch (error) {
    console.log("error in createBankDetails api:", error)
  }
}

export const viewBankDetails = async () => {
  try {
    const response = await Axios.get(`/shop/viewBankDetails`)
    return response.data
  } catch (error) {
    console.log("error in viewBankDetails", error)
  }
}

export const fetchPayoutAccounts = async () => {
  try {
    const response = await Axios.get('/shop/payout/accounts');
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch payout accounts" };
  }
};

export const savePayoutAccounts = async (data: any) => {
  try {
    const response = await Axios.post('/shop/payout/accounts', data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to save payout accounts" };
  }
};

export const ownerToBarber = async (shopId) => {
  try {
    const response = await Axios.post(`/shop//shop-owner/create-as-barber/${shopId}`)
    return response.data
  } catch (error) {
    console.log("error in ownerToBarber", error)
  }
}

export const confirmArrival = async (userId: string) => {
  try {
    const response = await Axios.post(`/auth/confirm-arrival/${userId}`);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to confirm arrival" };
  }
};

export const completeBooking = async (bookingId: string) => {
  try {
    const response = await Axios.post('/booking/complete-booking', { bookingId });
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to complete booking" };
  }
};

export const verifyPremiumPayment = async (data: {
  shopId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  try {
    const response = await Axios.post('/shop/premium/verify', data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to verify premium payment" };
  }
};

// ── Offer System API ──

export interface Offer {
  _id: string;
  title: string;
  description: string;
  offerLevel: 'platform' | 'shop';
  offerType: 'discount' | 'bundle';
  discountValue?: number;
  discountType?: 'percentage' | 'flat';
  shopId?: string;
  validUntil: string;
  isActive: boolean;
}

export const getPlatformOffers = async () => {
  try {
    const response = await Axios.get('/offers/platform');
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch platform offers" };
  }
};

export const getShopOffers = async (shopId: string) => {
  try {
    const response = await Axios.get(`/offers/shop/${shopId}`);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch shop offers" };
  }
};

export const createOffer = async (data: Partial<Offer>) => {
  try {
    const response = await Axios.post('/offers', data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create offer" };
  }
};

export const createBookingOrderWithOffer = async (data: {
  amount: number;
  shopId: string;
  offerId?: string;
}) => {
  try {
    const response = await Axios.post('/booking/create-order', data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create booking order" };
  }
};

export const deleteMediaAPI = async (mediaId: string) => {
  try {
    const response = await Axios.delete(`/shop/deleteMedia/${mediaId}`);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to delete media" };
  }
};

export const updateMediaDetailsAPI = async (mediaId: string, data: { title: string; description?: string }) => {
  try {
    const response = await Axios.put(`/shop/updateMedia/${mediaId}`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update media details" };
  }
};

export const uploadShopMedia = async (shopId: string, formData: FormData) => {
  try {
    console.log('📤 Uploading media for shop:', shopId);
    
    // Using the centralized Axios instance so we hit the active BASE_URL 
    // and automatically attach the auth tokens from the interceptor.
    const response = await Axios.post(`/shop/uploadMedia/${shopId}`, formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, 
    });

    console.log('✅ Media upload successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Media upload error:', error);
    
    if (error.response) {
      // Backend returned an error response (e.g., 400, 404, 500)
      console.error('Error response data:', error.response.data);
      throw error?.response?.data || { message: 'Upload failed' };
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
      throw { message: 'No response from server. Check your connection.' };
    } else {
      // Something happened while setting up the request
      throw { message: error.message || 'Upload failed. Please try again.' };
    }
  }
};

export const uploadShopProfileImage = async (shopId: string, formData: FormData) => {
  try {
    console.log('📤 Uploading profile image for shop:', shopId);
    
    const response = await Axios.post(`/shop/addProfileImage/${shopId}`, formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, 
    });

    console.log('✅ Profile image upload successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Profile image upload error:', error);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      throw error?.response?.data || { message: 'Upload failed' };
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw { message: 'No response from server. Check your connection.' };
    } else {
      throw { message: error.message || 'Upload failed. Please try again.' };
    }
  }
};
