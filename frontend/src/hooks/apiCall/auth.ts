import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/auth`;


export const login = async(payload:any)=> {
    const res = await axios.post(`${API_URL}/login`,payload);
    return res;
}


export const getCurrentUser = async (token:any) => {
    const res = await axios.get(`${API_URL}/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};