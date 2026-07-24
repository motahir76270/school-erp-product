// store/slices/attendanceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// ==================== TYPES ====================

interface AttendanceLog {
  id: string;
  attendanceId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
  markedAt: string;
  student?: {
    id: string;
    name: string;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  sectionId: string | null;
  markedBy: string;
  markingMethod: 'manual' | 'qrcode';
  createdAt: string;
  logs: AttendanceLog[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
}

interface AttendanceState {
  records: AttendanceRecord[];
  currentAttendance: AttendanceRecord | null;
  studentAttendance: AttendanceLog[];
  attendanceSummary: any[];
  todayAttendance: AttendanceLog[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
  };
}

// ==================== INITIAL STATE ====================

const initialState: AttendanceState = {
  records: [],
  currentAttendance: null,
  studentAttendance: [],
  attendanceSummary: [],
  todayAttendance: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  stats: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
};

// ==================== SLICE ====================

const attendanceSlice = createSlice({
  name: 'studentAttendance',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setAttendanceRecords: (state, action: PayloadAction<AttendanceRecord[]>) => {
      state.records = action.payload;
    },
    setCurrentAttendance: (state, action: PayloadAction<AttendanceRecord | null>) => {
      state.currentAttendance = action.payload;
    },
    setStudentAttendance: (state, action: PayloadAction<AttendanceLog[]>) => {
      state.studentAttendance = action.payload;
    },
    setAttendanceSummary: (state, action: PayloadAction<any[]>) => {
      state.attendanceSummary = action.payload;
    },
    setTodayAttendance: (state, action: PayloadAction<AttendanceLog[]>) => {
      state.todayAttendance = action.payload;
    },
    setAttendanceStats: (state, action: PayloadAction<{ present: number; absent: number; late: number; leave: number; total: number }>) => {
      state.stats = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number; total: number; totalPages: number }>) => {
      state.pagination = action.payload;
    },
    addTodayAttendance: (state, action: PayloadAction<AttendanceLog>) => {
      state.todayAttendance.push(action.payload);
    },
    updateAttendanceLog: (state, action: PayloadAction<AttendanceLog>) => {
      const index = state.todayAttendance.findIndex(log => log.id === action.payload.id);
      if (index !== -1) {
        state.todayAttendance[index] = action.payload;
      }
    },
    resetAttendanceState: () => initialState,
  },
});

// ==================== ACTIONS ====================

export const {
  setLoading,
  setSubmitting,
  setError,
  clearError,
  setAttendanceRecords,
  setCurrentAttendance,
  setStudentAttendance,
  setAttendanceSummary,
  setTodayAttendance,
  setAttendanceStats,
  setPagination,
  addTodayAttendance,
  updateAttendanceLog,
  resetAttendanceState,
} = attendanceSlice.actions;

// ==================== API CALLS ====================

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/attendance` ;


// Helper function for headers
const getHeaders = (token?: string) => ({
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

// Helper function to handle errors
const handleApiError = (error: any): never => {
  const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
  throw { success: false, message: errorMessage };
};

// ==================== ATTENDANCE API CALLS ====================

// Mark Attendance (Manual)
export const markAttendanceApiCall = async (
  token: string,
  payload: {
    date: string;
    classId: string;
    sectionId?: string;
    markingMethod?: 'manual' | 'qrcode';
    students: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'late' | 'leave';
      remarks?: string;
    }>;
  }
) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/student/mark`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Mark Attendance via QR Code
export const markAttendanceViaQRApiCall = async (
  token: string,
  payload: {
    studentId: string;
    date: string;
    classId: string;
    sectionId?: string;
  }
) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/student/mark-qr`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Mark Attendance via QR Face
export const markAttendanceViaFaceApiCall = async (
  token: string,
  faceDescriptor:any
) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/student/mark-face`,
      {faceDescriptor},
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get Attendance by Date
export const getAttendanceByDateApiCall = async (
  token: string,
  params: {
    date: string;
    classId: string;
    sectionId?: string;
  }
) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/student/date`,
      {
        ...getHeaders(token),
        params,
      }
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get Student Attendance
export const getStudentAttendanceApiCall = async (
  token: string,
  studentId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/student/attendance/${studentId}`,
      {
        ...getHeaders(token),
        params,
      }
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get Attendance Summary
export const getAttendanceSummaryApiCall = async (
  token: string,
  params: {
    classId: string;
    sectionId?: string;
    startDate: string;
    endDate: string;
  }
) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/student/summary`,
      {
        ...getHeaders(token),
        params,
      }
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Update Attendance Status
export const updateAttendanceStatusApiCall = async (
  token: string,
  logId: string,
  payload: {
    status: 'present' | 'absent' | 'late' | 'leave';
    remarks?: string;
  }
) => {
  try {
    const { data } = await axios.put(
      `${API_BASE_URL}/student/log/${logId}`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Delete Attendance Record
export const deleteAttendanceApiCall = async (
  token: string,
  attendanceId: string
) => {
  try {
    const { data } = await axios.delete(
      `${API_BASE_URL}/student/${attendanceId}`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get Today's Attendance for a Class
export const getTodayAttendanceApiCall = async (
  token: string,
  params: {
    classId: string;
    sectionId?: string;
  }
) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await axios.get(
      `${API_BASE_URL}/student/date`,
      {
        ...getHeaders(token),
        params: {
          date: today,
          ...params,
        },
      }
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// ==================== EXPORT ====================

export default attendanceSlice.reducer;