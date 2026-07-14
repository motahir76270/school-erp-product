import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/fees';

interface Fee {
  id: number;
  name: string;
  feeType: string;
  classId?: number;
  amount: string;
  dueDate?: string;
  penaltyPerDay?: string;
  description?: string;
  academicYear: string;
  isActive: boolean;
}

interface FeePayment {
  id: number;
  studentId: number;
  feeId: number;
  amountPaid: string;
  penaltyAmount?: string;
  discount?: string;
  totalAmount: string;
  paymentMethod: string;
  transactionId?: string;
  receiptNumber: string;
  paymentDate: string;
  status: string;
}

interface FeeState {
  fees: Fee[];
  payments: FeePayment[];
  pendingFees: FeePayment[];
  isLoading: boolean;
  error: string | null;
  stats: {
    collected: number;
    pending: number;
    total: number;
  };
}

const initialState: FeeState = {
  fees: [],
  payments: [],
  pendingFees: [],
  isLoading: false,
  error: null,
  stats: { collected: 0, pending: 0, total: 0 },
};

export const fetchFees = createAsyncThunk(
  'fee/fetchFees',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch fees');
    }
  }
);

export const createFee = createAsyncThunk(
  'fee/createFee',
  async (feeData: Partial<Fee>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(API_URL, feeData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create fee');
    }
  }
);

export const fetchPayments = createAsyncThunk(
  'fee/fetchPayments',
  async (params: { studentId?: number; status?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch payments');
    }
  }
);

export const processPayment = createAsyncThunk(
  'fee/processPayment',
  async (data: Partial<FeePayment>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/pay`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to process payment');
    }
  }
);

export const fetchFeeStats = createAsyncThunk(
  'fee/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch fee stats');
    }
  }
);

const feeSlice = createSlice({
  name: 'fee',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fees = action.payload;
      })
      .addCase(fetchFees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createFee.fulfilled, (state, action) => {
        state.fees.push(action.payload);
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.payments = action.payload.data;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.payments.unshift(action.payload);
      })
      .addCase(fetchFeeStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError } = feeSlice.actions;
export default feeSlice.reducer;
