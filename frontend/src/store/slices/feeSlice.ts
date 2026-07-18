// store/slices/feeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/fees` || 'http://localhost:5000/api';

// ==================== Types ====================

export interface FeeType {
  id: string;
  name: string;
  code: string;
  amount: string;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  dueDay: number;
  penaltyPerDay: string;
  applicableClasses: string[] | null;
  description: string | null;
  status: 'active' | 'inactive';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  feeTypeId: string;
  amount: string;
  dueDate: string;
  paidAmount: string;
  penaltyAmount: string;
  discount: string;
  scholarship: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  academicYear: string;
  month: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  feeType?: FeeType;
  student?: any;
  totalPaid?: number;
  remainingAmount?: number;
}

export interface FeePayment {
  id: string;
  studentFeeId: string;
  amount: string;
  paymentMode: 'cash' | 'card' | 'upi' | 'bank_transfer';
  transactionId: string | null;
  receiptNumber: string;
  paidBy: string;
  remarks: string | null;
  userId: string;
  createdAt: string;
  studentFee?: StudentFee;
  student?: any;
}

export interface FeePenalty {
  id: string;
  studentFeeId: string;
  amount: string;
  daysLate: number;
  penaltyPerDay: string;
  userId: string;
  createdAt: string;
  studentFee?: StudentFee;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FeeTypesResponse {
  feeTypes: FeeType[];
  pagination: Pagination;
}

export interface StudentFeesResponse {
  fees: StudentFee[];
  pagination: Pagination;
}

export interface PaymentsResponse {
  payments: FeePayment[];
  pagination: Pagination;
}

export interface PenaltiesResponse {
  penalties: FeePenalty[];
  pagination: Pagination;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== Initial State ====================

interface FeeState {
  feeTypes: FeeType[];
  studentFees: StudentFee[];
  studentFeesCount:any;
  payments: FeePayment[];
  penalties: FeePenalty[];
  currentFeeType: FeeType | null;
  currentStudentFee: StudentFee | null;
  currentPayment: FeePayment | null;
  currentPenalty: FeePenalty | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
}

const initialState: FeeState = {
  feeTypes: [],
  studentFees: [],
  studentFeesCount: [],
  payments: [],
  penalties: [],
  currentFeeType: null,
  currentStudentFee: null,
  currentPayment: null,
  currentPenalty: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// ==================== Slice ====================

const feeSlice = createSlice({
  name: 'fee',
  initialState,
  reducers: {
    // ========== Fee Types ==========
    setFeeTypes: (state, action) => {
      state.feeTypes = action.payload
    },
    setCurrentFeeType: (state, action: PayloadAction<FeeType | null>) => {
      state.currentFeeType = action.payload;
    },
    addFeeType: (state, action: PayloadAction<FeeType>) => {
      state.feeTypes = [action.payload, ...state.feeTypes];
    },
    updateFeeTypeInList: (state, action: PayloadAction<FeeType>) => {
      const index = state.feeTypes.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.feeTypes[index] = action.payload;
      }
      if (state.currentFeeType?.id === action.payload.id) {
        state.currentFeeType = action.payload;
      }
    },
    removeFeeTypeFromList: (state, action: PayloadAction<string>) => {
      state.feeTypes = state.feeTypes.filter(f => f.id !== action.payload);
      if (state.currentFeeType?.id === action.payload) {
        state.currentFeeType = null;
      }
    },

    // ========== Student Fees ==========
    setStudentFees: (state, action: PayloadAction<StudentFeesResponse>) => {
      state.studentFees = action.payload.fees || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    setStudentFeesCount: (state, action: PayloadAction<StudentFeesResponse>) => {
      state.studentFeesCount = action.payload ;
    },
    setCurrentStudentFee: (state, action: PayloadAction<StudentFee | null>) => {
      state.currentStudentFee = action.payload;
    },
    addStudentFee: (state, action: PayloadAction<StudentFee>) => {
      state.studentFees = [action.payload, ...state.studentFees];
    },
    updateStudentFeeInList: (state, action: PayloadAction<StudentFee>) => {
      const index = state.studentFees.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.studentFees[index] = action.payload;
      }
      if (state.currentStudentFee?.id === action.payload.id) {
        state.currentStudentFee = action.payload;
      }
    },
    removeStudentFeeFromList: (state, action: PayloadAction<string>) => {
      state.studentFees = state.studentFees.filter(f => f.id !== action.payload);
      if (state.currentStudentFee?.id === action.payload) {
        state.currentStudentFee = null;
      }
    },

    // ========== Payments ==========
    setPayments: (state, action: PayloadAction<PaymentsResponse>) => {
      state.payments = action.payload.payments || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    setCurrentPayment: (state, action: PayloadAction<FeePayment | null>) => {
      state.currentPayment = action.payload;
    },
    addPayment: (state, action: PayloadAction<FeePayment>) => {
      state.payments = [action.payload, ...state.payments];
    },
    updatePaymentInList: (state, action: PayloadAction<FeePayment>) => {
      const index = state.payments.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.payments[index] = action.payload;
      }
      if (state.currentPayment?.id === action.payload.id) {
        state.currentPayment = action.payload;
      }
    },
    removePaymentFromList: (state, action: PayloadAction<string>) => {
      state.payments = state.payments.filter(p => p.id !== action.payload);
      if (state.currentPayment?.id === action.payload) {
        state.currentPayment = null;
      }
    },

    // ========== Penalties ==========
    setPenalties: (state, action: PayloadAction<PenaltiesResponse>) => {
      state.penalties = action.payload.penalties || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    setCurrentPenalty: (state, action: PayloadAction<FeePenalty | null>) => {
      state.currentPenalty = action.payload;
    },
    addPenalty: (state, action: PayloadAction<FeePenalty>) => {
      state.penalties = [action.payload, ...state.penalties];
    },
    updatePenaltyInList: (state, action: PayloadAction<FeePenalty>) => {
      const index = state.penalties.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.penalties[index] = action.payload;
      }
      if (state.currentPenalty?.id === action.payload.id) {
        state.currentPenalty = action.payload;
      }
    },
    removePenaltyFromList: (state, action: PayloadAction<string>) => {
      state.penalties = state.penalties.filter(p => p.id !== action.payload);
      if (state.currentPenalty?.id === action.payload) {
        state.currentPenalty = null;
      }
    },

    // ========== Common ==========
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (state, action: PayloadAction<Pagination>) => {
      state.pagination = action.payload;
    },
    clearFees: (state) => {
      state.feeTypes = [];
      state.studentFees = [];
      state.payments = [];
      state.penalties = [];
      state.currentFeeType = null;
      state.currentStudentFee = null;
      state.currentPayment = null;
      state.currentPenalty = null;
      state.error = null;
      state.pagination = initialState.pagination;
    },
    clearCurrentItems: (state) => {
      state.currentFeeType = null;
      state.currentStudentFee = null;
      state.currentPayment = null;
      state.currentPenalty = null;
    },
  },
});

// ==================== Actions ====================
export const {
  // Fee Types
  setFeeTypes,
  setCurrentFeeType,
  addFeeType,
  updateFeeTypeInList,
  removeFeeTypeFromList,
  
  // Student Fees
  setStudentFees,
  setStudentFeesCount,
  setCurrentStudentFee,
  addStudentFee,
  updateStudentFeeInList,
  removeStudentFeeFromList,
  
  // Payments
  setPayments,
  setCurrentPayment,
  addPayment,
  updatePaymentInList,
  removePaymentFromList,
  
  // Penalties
  setPenalties,
  setCurrentPenalty,
  addPenalty,
  updatePenaltyInList,
  removePenaltyFromList,
  
  // Common
  setLoading,
  setError,
  setPagination,
  clearFees,
  clearCurrentItems,
} = feeSlice.actions;

// ==================== API Calls ====================

// ========== FEE TYPES ==========

export const createFeeTypeApiCall = async (token: string, data: Partial<FeeType>): Promise<ApiResponse<FeeType>> => {
  try {
    const response = await axios.post<ApiResponse<FeeType>>(`${API_BASE_URL}/fee-types`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getAllFeeTypesApiCall = async (token: string, params: Record<string, any> = {}): Promise<ApiResponse<FeeTypesResponse>> => {
  try {
    const response = await axios.get<ApiResponse<FeeTypesResponse>>(`${API_BASE_URL}/fee-types`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getFeeTypeByIdApiCall = async (token: string, id: string): Promise<ApiResponse<FeeType>> => {
  try {
    const response = await axios.get<ApiResponse<FeeType>>(`${API_BASE_URL}/fee-types/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const updateFeeTypeApiCall = async (token: string, id: string, data: Partial<FeeType>): Promise<ApiResponse<FeeType>> => {
  try {
    const response = await axios.put<ApiResponse<FeeType>>(`${API_BASE_URL}/fee-types/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const deleteFeeTypeApiCall = async (token: string, id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await axios.delete<ApiResponse<null>>(`${API_BASE_URL}/fee-types/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null };
  }
};

export const updateFeeTypeStatusApiCall = async (token: string, id: string, status: string): Promise<ApiResponse<{ status: string }>> => {
  try {
    const response = await axios.patch<ApiResponse<{ status: string }>>(
      `${API_BASE_URL}/fee-types/${id}/status`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

// ========== STUDENT FEES ==========

interface AssignFeeData {
  studentId: string;
  feeTypeId: string;
  amount?: string;
  dueDate: string;
  discount?: string;
  scholarship?: string;
  academicYear: string;
  month?: string;
}

export const assignFeeToStudentApiCall = async (token: string, data: AssignFeeData): Promise<ApiResponse<StudentFee>> => {
  try {
    const response = await axios.post<ApiResponse<StudentFee>>(`${API_BASE_URL}/student-fees`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const assignFeeTosectionApiCall = async (token: any, data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/student-fees/class/section`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getStudentFeesApiCall = async (
  token: string, 
  studentId: string, 
): Promise<ApiResponse<StudentFeesResponse>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student-fees/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getAllStudentFeesApiCall = async (
  token: string, 
): Promise<ApiResponse<StudentFeesResponse>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student-fees/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getStudentFeeByIdApiCall = async (token: string, id: string): Promise<ApiResponse<StudentFee>> => {
  try {
    const response = await axios.get<ApiResponse<StudentFee>>(`${API_BASE_URL}/student-fees/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

// ========== PAYMENTS ==========

interface PaymentData {
  studentFeeId: string;
  amount: string;
  paymentMode: 'cash' | 'card' | 'upi' | 'bank_transfer';
  transactionId?: string;
  remarks?: string;
}

export const makePaymentApiCall = async (token: string, data: PaymentData): Promise<ApiResponse<{ payment: FeePayment; studentFee: StudentFee; student: any }>> => {
  try {
    const response = await axios.post<ApiResponse<{ payment: FeePayment; studentFee: StudentFee; student: any }>>(
      `${API_BASE_URL}/payments`, 
      data, 
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getPaymentByIdApiCall = async (token: string, id: string): Promise<ApiResponse<FeePayment>> => {
  try {
    const response = await axios.get<ApiResponse<FeePayment>>(`${API_BASE_URL}/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getPaymentsByStudentFeeApiCall = async (token: string, studentFeeId: string): Promise<ApiResponse<FeePayment[]>> => {
  try {
    const response = await axios.get<ApiResponse<FeePayment[]>>(`${API_BASE_URL}/student-fees/${studentFeeId}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getAllPaymentsApiCall = async (token: string, params: Record<string, any> = {}): Promise<ApiResponse<PaymentsResponse>> => {
  try {
    const response = await axios.get<ApiResponse<PaymentsResponse>>(`${API_BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

// ========== PENALTIES ==========

interface ApplyPenaltyData {
  penaltyAmount: number;
  daysLate: number;
  penaltyPerDay: number;
}

interface BulkPenaltyData {
  academicYear: string;
}

export const calculatePenaltiesApiCall = async (token: string, studentFeeId: string): Promise<ApiResponse<{
  daysLate: number;
  penaltyPerDay: number;
  totalPenalty: number;
  dueDate: string;
  today: string;
}>> => {
  try {
    const response = await axios.post<ApiResponse<any>>(
      `${API_BASE_URL}/student-fees/${studentFeeId}/calculate-penalty`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const applyPenaltyApiCall = async (token: string, studentFeeId: string, data: ApplyPenaltyData): Promise<ApiResponse<{ penalty: FeePenalty; studentFee: StudentFee }>> => {
  try {
    const response = await axios.post<ApiResponse<{ penalty: FeePenalty; studentFee: StudentFee }>>(
      `${API_BASE_URL}/student-fees/${studentFeeId}/apply-penalty`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getPenaltiesByStudentFeeApiCall = async (token: string, studentFeeId: string): Promise<ApiResponse<FeePenalty[]>> => {
  try {
    const response = await axios.get<ApiResponse<FeePenalty[]>>(`${API_BASE_URL}/student-fees/${studentFeeId}/penalties`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getAllPenaltiesApiCall = async (token: string, params: Record<string, any> = {}): Promise<ApiResponse<PenaltiesResponse>> => {
  try {
    const response = await axios.get<ApiResponse<PenaltiesResponse>>(`${API_BASE_URL}/penalties`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const getPenaltyByIdApiCall = async (token: string, id: string): Promise<ApiResponse<FeePenalty>> => {
  try {
    const response = await axios.get<ApiResponse<FeePenalty>>(`${API_BASE_URL}/penalties/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};

export const waivePenaltyApiCall = async (token: string, id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await axios.delete<ApiResponse<null>>(`${API_BASE_URL}/penalties/${id}/waive`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null };
  }
};

export const bulkCalculatePenaltiesApiCall = async (token: string, data: BulkPenaltyData): Promise<ApiResponse<{
  totalProcessed: number;
  results: Array<{
    studentFeeId: string;
    daysLate: number;
    penaltyAmount: number;
    status: string;
  }>;
}>> => {
  try {
    const response = await axios.post<ApiResponse<any>>(
      `${API_BASE_URL}/penalties/bulk`, 
      data, 
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null as any };
  }
};


export const getAllStudentsApiCall = async (token: string, params: Record<string, any> = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message, data: null };
  }
};

export const getFeeByIdApiCall = async (token: string, id: string) => {
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
export default feeSlice.reducer;