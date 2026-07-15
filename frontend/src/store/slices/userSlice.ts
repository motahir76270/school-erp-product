// store/slices/userSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  users: null,
  loading: false,
};

// ==================== Slice ====================
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearUsers: (state) => {
      state.users = null;
    },
  },
});

const baseURl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth`

// ==================== Actions ====================
export const { setUsers, setLoading, clearUsers } = userSlice.actions;

// ==================== API Calls ====================

// Get All Users
export const getAllUsersApiCall = async (
  token: string,
  page: number = 1,
  search: string = ""
) => {
  const { data } = await axios.get(`${baseURl}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page,
      search,
    },
  });

  return data;
};

// Create User
export const createUserApiCall = async (token: string, formData: FormData) => {
  const { data } = await axios.post(`${baseURl}/users/create`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Delete User
export const deleteUserApiCall = async (token: string, userId: string) => {
  const { data } = await axios.delete(`${baseURl}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Update User Role
export const updateUserRoleApiCall = async (
  token: string,
  payload: { userId: string; role: 'super_admin' | 'admin' | 'teacher' | 'student' }
) => {
  const { data } = await axios.put(
    `${baseURl}/users/role/${payload.userId}`,
    { role: payload.role },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Get Single User
export const getUserByIdApiCall = async (token: string, userId: string) => {
  const { data } = await axios.get(`${baseURl}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Update User (Admin)
export const updateUserApiCall = async (token: string, userId: string, formData: FormData) => {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/users/${userId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Toggle User Status (Activate/Deactivate)
export const toggleUserStatusApiCall = async (
  token: string,
  userId: string,
  isActive: boolean
) => {
  const { data } = await axios.patch(
    `${baseURl}/users/${userId}/status`,
    { isActive },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// ==================== Export ====================
export default userSlice.reducer;