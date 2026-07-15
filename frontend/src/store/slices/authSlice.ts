// store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

// ==================== Slice ====================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

// ==================== Actions ====================
export const {
  setUser,
  setToken,
  setAuthenticated,
  logout,
  clearAuth,
  setLoading,
} = authSlice.actions;

// ==================== API Calls ====================

// Login
export const loginApiCall = async (payload: any) => {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, payload);
  return data;
};

// Register
export const registerApiCall = async (payload: any) => {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/register`, payload);
  return data;
};

// Get Current User Profile
export const getCurrentUserApiCall = async (token: string) => {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Update User
export const updateUserApiCall = async (token: string, payload: any) => {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-update`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Update User Profile with Image
export const updateUserProfileApiCall = async (token: string, payload: any) => {
  const formData = new FormData();
  
  if (payload.firstName) formData.append('firstName', payload.firstName);
  if (payload.lastName) formData.append('lastName', payload.lastName);
  if (payload.phone) formData.append('phone', payload.phone);
  if (payload.address) formData.append('address', payload.address);
  if (payload.profileImage) formData.append('profileImage', payload.profileImage);

  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-profile`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Change Password
export const changePasswordApiCall = async (token: string, payload: any) => {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/change-password`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Forgot Password
export const forgotPasswordApiCall = async (payload: any) => {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/forgot-password`, payload);
  return data;
};

// Reset Password
export const resetPasswordApiCall = async (payload: any) => {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`, payload);
  return data;
};

// Update User Role
export const updateUserRoleApiCall = async (token: string, payload: any) => {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-role`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Delete User
export const deleteUserApiCall = async (token: string) => {
  const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-delete`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Logout
export const logoutApiCall = async (token: string) => {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/logout`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// ==================== Export ====================
export default authSlice.reducer;