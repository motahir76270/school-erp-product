// store/slices/receiptSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/receipts`;

interface ReceiptState {
  studentFeesReceipts: any;
  loading: boolean;
  error: string | null;
}

const initialState: ReceiptState = {
  studentFeesReceipts: null,
  loading: false,
  error: null,
};

// ==================== Slice ====================
const receiptSlice = createSlice({
  name: 'receipt',
  initialState,
  reducers: {
    setStudentFeesReceipts: (state, action) => {
      state.studentFeesReceipts = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearReceipt: (state) => {
      state.studentFeesReceipts = null;
      state.error = null;
    },
  },
});

// ==================== Actions ====================
export const {
  setStudentFeesReceipts,
  setLoading,
  setError,
  clearReceipt,
} = receiptSlice.actions;

// ==================== Admin API Call ====================
export const adminGetStudentFeeReceiptsApiCall = async (token: any, id: any) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student-fees/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null };
  }
};

// ==================== Export ====================
export default receiptSlice.reducer;