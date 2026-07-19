// store/slices/gatewaySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/gateway`;

// ==================== Types ====================

export interface PaymentGateway {
  id: string;
  userId: string;
  key: string;
  secretKey: string;
  name: string;
  callBackUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GatewayResponse {
  gateways: PaymentGateway[];
  pagination: GatewayPagination;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== Initial State ====================

interface GatewayState {
  gateways: PaymentGateway[];
  currentGateway: PaymentGateway | null;
  loading: boolean;
  error: string | null;
  pagination: GatewayPagination;
}

const initialState: GatewayState = {
  gateways: [],
  currentGateway: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

// ==================== Slice ====================

const gatewaySlice = createSlice({
  name: 'gateway',
  initialState,
  reducers: {
    // ========== Set Gateways ==========
    setGateways: (state, action: PayloadAction<GatewayResponse>) => {
      state.gateways = action.payload.gateways || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    
    // ========== Set Current Gateway ==========
    setCurrentGateway: (state, action: PayloadAction<PaymentGateway | null>) => {
      state.currentGateway = action.payload;
    },
    
    // ========== Add Gateway ==========
    addGateway: (state, action: PayloadAction<PaymentGateway>) => {
      state.gateways = [action.payload, ...state.gateways];
    },
    
    // ========== Update Gateway in List ==========
    updateGatewayInList: (state, action: PayloadAction<PaymentGateway>) => {
      const index = state.gateways.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.gateways[index] = action.payload;
      }
      if (state.currentGateway?.id === action.payload.id) {
        state.currentGateway = action.payload;
      }
    },
    
    // ========== Remove Gateway from List ==========
    removeGatewayFromList: (state, action: PayloadAction<string>) => {
      state.gateways = state.gateways.filter(g => g.id !== action.payload);
      if (state.currentGateway?.id === action.payload) {
        state.currentGateway = null;
      }
    },
    
    // ========== Update Gateway Status ==========
    updateGatewayStatus: (state, action: PayloadAction<{ id: string; isActive: boolean }>) => {
      const { id, isActive } = action.payload;
      const index = state.gateways.findIndex(g => g.id === id);
      if (index !== -1) {
        state.gateways[index].isActive = isActive;
      }
      if (state.currentGateway?.id === id) {
        state.currentGateway.isActive = isActive;
      }
    },
    
    // ========== Common Reducers ==========
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setPagination: (state, action: PayloadAction<GatewayPagination>) => {
      state.pagination = action.payload;
    },
    
    clearGateways: (state) => {
      state.gateways = [];
      state.currentGateway = null;
      state.error = null;
      state.pagination = initialState.pagination;
    },
    
    clearCurrentGateway: (state) => {
      state.currentGateway = null;
    },
  },
});

// ==================== Actions ====================
export const {
  setGateways,
  setCurrentGateway,
  addGateway,
  updateGatewayInList,
  removeGatewayFromList,
  updateGatewayStatus,
  setLoading,
  setError,
  setPagination,
  clearGateways,
  clearCurrentGateway,
} = gatewaySlice.actions;

// ==================== API Calls ====================

// ========== GET All Payment Gateways ==========
export const getAllGatewaysApiCall = async (
  token: string,
  params: {
    userId?: string;
    page?: number;
    search?: string;
    limit?: number;
  } = {}
): Promise<ApiResponse<GatewayResponse>> => {
  try {
    const response = await axios.get<ApiResponse<GatewayResponse>>(
      `${API_BASE_URL}/all`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to fetch payment gateways',
      data: { gateways: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10, hasNextPage: false, hasPrevPage: false } },
    };
  }
};

// ========== GET Payment Gateway by ID ==========
export const getGatewayByIdApiCall = async (
  token: string,
  id: string
): Promise<ApiResponse<PaymentGateway>> => {
  try {
    const response = await axios.get<ApiResponse<PaymentGateway>>(
      `${API_BASE_URL}/gateway/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to fetch payment gateway',
      data: null as any,
    };
  }
};

// ========== CREATE Payment Gateway ==========
export const createGatewayApiCall = async (
  token: string,
  data: {
    userId: string;
    key: string;
    secretKey: string;
    name: string;
    callBackUrl?: string;
    isActive?: boolean;
  }
): Promise<ApiResponse<PaymentGateway>> => {
  try {
    const response = await axios.post<ApiResponse<PaymentGateway>>(
      `${API_BASE_URL}/create`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to create payment gateway',
      data: null as any,
    };
  }
};

// ========== UPDATE Payment Gateway ==========
export const updateGatewayApiCall = async (
  token: string,
  data: {
    id: string;
    key?: string;
    secretKey?: string;
    name?: string;
    callBackUrl?: string;
    isActive?: boolean;
  }
): Promise<ApiResponse<PaymentGateway>> => {
  try {
    const response = await axios.put<ApiResponse<PaymentGateway>>(
      `${API_BASE_URL}/update`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to update payment gateway',
      data: null as any,
    };
  }
};

// ========== UPDATE Gateway Status ==========
export const updateGatewayStatusApiCall = async (
  token: string,
  data: {
    id: string;
    isActive: boolean;
  }
): Promise<ApiResponse<PaymentGateway>> => {
  try {
    const response = await axios.put<ApiResponse<PaymentGateway>>(
      `${API_BASE_URL}/update/status`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to update gateway status',
      data: null as any,
    };
  }
};

// ========== DELETE Payment Gateway ==========
export const deleteGatewayApiCall = async (
  token: string,
  id: string
): Promise<ApiResponse<null>> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/delete/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to delete payment gateway',
      data: null,
    };
  }
};

// ==================== Export ====================
export default gatewaySlice.reducer;