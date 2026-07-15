// store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

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
export const loginApiCall = async (dispatch: any, payload: any) => {
  dispatch(setLoading(true));
  try {
    const {data} = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, payload);
  
    if (data?.success === true) {
      dispatch(setUser(data?.data?.user));
      dispatch(setToken(data?.data?.token));
      dispatch(setAuthenticated(true));
      dispatch(setLoading(false));
      toast.success(data?.data?.message);
      return data?.data;
    } else {
      dispatch(setLoading(false));
      toast.error(data?.data?.message);
      return data?.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Login failed');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Register
export const registerApiCall = async (dispatch: any, payload: any) => {
  dispatch(setLoading(true));
  try {
    const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/register`, payload);
    
    if (res?.data?.success === true) {
      toast.success(res?.data?.message || 'Registration successful');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Registration failed');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Registration failed');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Get Current User Profile
export const getCurrentUserApiCall = async (dispatch: any, token: string) => {
  dispatch(setLoading(true));
  try {
    if (!token) {
      toast.error('No token found');
      dispatch(setLoading(false));
      return;
    }

    const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res?.data?.success === true) {
      dispatch(setUser(res?.data?.data));
      dispatch(setAuthenticated(true));
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to get user profile');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to get user profile');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Update User
export const updateUserApiCall = async (dispatch: any, token: string, payload: any) => {
  dispatch(setLoading(true));
  try {
    if (!token) {
      toast.error('No token found');
      dispatch(setLoading(false));
      return;
    }

    const res = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-update`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res?.data?.success === true) {
      dispatch(setUser(res?.data?.data));
      toast.success(res?.data?.message || 'User updated successfully');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to update user');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to update user');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Update User Profile with Image
export const updateUserProfileApiCall = async (dispatch: any, token: string, payload: any) => {
  dispatch(setLoading(true));
  try {
    if (!token) {
      toast.error('No token found');
      dispatch(setLoading(false));
      return;
    }

    const formData = new FormData();
    
    if (payload.firstName) formData.append('firstName', payload.firstName);
    if (payload.lastName) formData.append('lastName', payload.lastName);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.address) formData.append('address', payload.address);
    if (payload.profileImage) formData.append('profileImage', payload.profileImage);

    const res = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-profile`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res?.data?.success === true) {
      dispatch(setUser(res?.data?.data));
      toast.success(res?.data?.message || 'Profile updated successfully');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to update profile');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to update profile');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Change Password
export const changePasswordApiCall = async (dispatch: any, token: string, payload: any) => {
  dispatch(setLoading(true));
  try {
    if (!token) {
      toast.error('No token found');
      dispatch(setLoading(false));
      return;
    }

    const res = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/change-password`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res?.data?.success === true) {
      toast.success(res?.data?.message || 'Password changed successfully');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to change password');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to change password');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Forgot Password
export const forgotPasswordApiCall = async (dispatch: any, payload: any) => {
  dispatch(setLoading(true));
  try {
    const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/forgot-password`, payload);

    if (res?.data?.success === true) {
      toast.success(res?.data?.message || 'Reset password link sent to your email');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to send reset password email');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to send reset password email');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Reset Password (Verify Token)
export const resetPasswordApiCall = async (dispatch: any, payload: any) => {
  dispatch(setLoading(true));
  try {
    const res = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`, payload);

    if (res?.data?.success === true) {
      toast.success(res?.data?.message || 'Password reset successful');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to reset password');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to reset password');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Update User Role
export const updateUserRoleApiCall = async (dispatch: any, token: string, payload: any) => {
  dispatch(setLoading(true));
  try {
    if (!token) {
      toast.error('No token found');
      dispatch(setLoading(false));
      return;
    }

    const res = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-role`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res?.data?.success === true) {
      toast.success(res?.data?.message || 'User role updated successfully');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to update user role');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to update user role');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Delete User
export const deleteUserApiCall = async (dispatch: any, token: string) => {
  dispatch(setLoading(true));
  try {
    if (!token) {
      toast.error('No token found');
      dispatch(setLoading(false));
      return;
    }

    const res = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/user-delete`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res?.data?.success === true) {
      dispatch(clearAuth());
      toast.success(res?.data?.message || 'User deleted successfully');
      dispatch(setLoading(false));
      return res.data;
    } else {
      toast.error(res?.data?.message || 'Failed to delete user');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Failed to delete user');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// Logout
export const logoutApiCall = async (dispatch: any, token: string) => {
  dispatch(setLoading(true));
  try {
    if (!token) {
      dispatch(clearAuth());
      toast.info('Logged out');
      dispatch(setLoading(false));
      return;
    }

    const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res?.data?.success === true) {
      dispatch(clearAuth());
      toast.success(res?.data?.message || 'Logout successful');
      dispatch(setLoading(false));
      return res.data;
    } else {
      dispatch(clearAuth());
      toast.info('Logged out');
      dispatch(setLoading(false));
      return res.data;
    }
  } catch (error: any) {
    dispatch(clearAuth());
    toast.info('Logged out');
    dispatch(setLoading(false));
    return error?.response?.data;
  }
};

// ==================== Export ====================
export default authSlice.reducer;