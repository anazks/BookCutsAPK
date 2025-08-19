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