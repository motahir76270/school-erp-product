// store/slices/teacherAttendanceSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// ==================== INITIAL STATE ====================

const initialState = {
  records: [],
  currentAttendance: null,
  teacherAttendance: [],
  attendanceSummary: [],
  todayAttendance: null,
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
  statistics: null,
  summary: null,
};

// ==================== SLICE ====================

const teacherAttendanceSlice = createSlice({
  name: 'teacherAttendance',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTeacherAttendanceRecords: (state, action) => {
      state.records = action.payload;
    },
    setCurrentTeacherAttendance: (state, action) => {
      state.currentAttendance = action.payload;
    },
    setTeacherAttendance: (state, action) => {
      state.teacherAttendance = action.payload;
    },
    setTeacherAttendanceSummary: (state, action) => {
      state.attendanceSummary = action.payload;
    },
    setTodayTeacherAttendance: (state, action) => {
      state.todayAttendance = action.payload;
    },
    setTeacherAttendanceStats: (state, action) => {
      state.stats = action.payload;
    },
    setTeacherAttendancePagination: (state, action) => {
      state.pagination = action.payload;
    },
    setTeacherStatistics: (state, action) => {
      state.statistics = action.payload;
    },
    setTeacherSummary: (state, action) => {
      state.summary = action.payload;
    },
    addTodayTeacherAttendance: (state, action) => {
      if (state.todayAttendance) {
        state.todayAttendance.logs.push(action.payload);
        state.todayAttendance.totalMarked = state.todayAttendance.logs.length;
        state.todayAttendance.totalUnmarked = state.todayAttendance.totalTeachers - state.todayAttendance.totalMarked;
      }
    },
    updateTeacherAttendanceLog: (state, action) => {
      if (state.todayAttendance) {
        const index = state.todayAttendance.logs.findIndex(log => log.id === action.payload.id);
        if (index !== -1) {
          state.todayAttendance.logs[index] = action.payload;
        }
      }
    },
    resetTeacherAttendanceState: () => initialState,
  },
});

// ==================== ACTIONS ====================

export const {
  setLoading,
  setSubmitting,
  setError,
  clearError,
  setTeacherAttendanceRecords,
  setCurrentTeacherAttendance,
  setTeacherAttendance,
  setTeacherAttendanceSummary,
  setTodayTeacherAttendance,
  setTeacherAttendanceStats,
  setTeacherAttendancePagination,
  setTeacherStatistics,
  setTeacherSummary,
  addTodayTeacherAttendance,
  updateTeacherAttendanceLog,
  resetTeacherAttendanceState,
} = teacherAttendanceSlice.actions;

// ==================== API CALLS ====================

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/attendance`;

// Helper function for headers
const getHeaders = (token: any) => ({
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

// Helper function to handle errors
const handleApiError = (error: any) => {
  const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
  throw { success: false, message: errorMessage };
};

// ==================== TEACHER ATTENDANCE API CALLS ====================

// Mark Teacher Attendance (Manual)
export const markTeacherAttendanceApiCall = async (token: any, payload: any) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/teacher/mark`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Mark Teacher Attendance via QR Code
export const markTeacherAttendanceViaQRApiCall = async (token: any, payload: any) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/teacher/mark-qr`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Mark Teacher Attendance via QR Code
export const markTeacherAttendanceViaFAceScanApiCall = async (token: any, faceDescriptor: any) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/teacher/mark-face`,
      {faceDescriptor},
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get Teacher Attendance by Date
export const getTeacherAttendanceByDateApiCall = async (token: any, params: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/teacher/date`,
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

// Get Teacher Attendance by Teacher ID
export const getTeacherAttendanceByTeacherApiCall = async (token: any, teacherId: any, params: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/teacher/${teacherId}`,
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

// Get Teacher Attendance Summary
export const getTeacherAttendanceSummaryApiCall = async (token: any, params: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/teacher/summary`,
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

// Get Teacher Attendance Statistics
export const getTeacherAttendanceStatisticsApiCall = async (token: any, params: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/teacher/statistics`,
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

// Update Teacher Attendance Status
export const updateTeacherAttendanceStatusApiCall = async (token: any, logId: any, payload: any) => {
  try {
    const { data } = await axios.put(
      `${API_BASE_URL}/teacher/log/${logId}`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Delete Teacher Attendance Record
export const deleteTeacherAttendanceApiCall = async (token: any, attendanceId: any) => {
  try {
    const { data } = await axios.delete(
      `${API_BASE_URL}/teacher/${attendanceId}`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get Today's Teacher Attendance
export const getTodayTeacherAttendanceApiCall = async (token: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/teacher/today`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get All Teachers List (for dropdown/selection)
export const getAllTeachersApiCall = async (token: any) => {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/teachers`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Bulk Update Teacher Attendance
export const bulkUpdateTeacherAttendanceApiCall = async (token: any, payload: any) => {
  try {
    const { data } = await axios.put(
      `${API_BASE_URL}/teacher/bulk-update`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get Teacher Attendance Report
export const getTeacherAttendanceReportApiCall = async (token: any, params: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/teacher/report`,
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

// Export Teacher Attendance Report (Excel/PDF)
export const exportTeacherAttendanceReportApiCall = async (token: any, params: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/teacher/export`,
      {
        ...getHeaders(token),
        params,
        responseType: 'blob',
      }
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// ==================== EXPORT ====================

export default teacherAttendanceSlice.reducer;