import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/attendance';

interface AttendanceRecord {
  id: number;
  studentId: number;
  classId: number;
  sectionId: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  markedByTeacherId: number;
  markedMethod: 'manual' | 'qr';
  remarks?: string;
  checkInTime?: string;
  checkOutTime?: string;
  student?: {
    id: number;
    rollNumber: string;
    user: { firstName: string; lastName: string };
  };
}

interface AttendanceState {
  records: AttendanceRecord[];
  teacherAttendance: AttendanceRecord[];
  todayAttendance: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  stats: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
  };
}

const initialState: AttendanceState = {
  records: [],
  teacherAttendance: [],
  todayAttendance: [],
  isLoading: false,
  error: null,
  stats: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
};

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async (params: { classId: number; sectionId: number; date: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch attendance');
    }
  }
);

export const markAttendance = createAsyncThunk(
  'attendance/markAttendance',
  async (data: { classId: number; sectionId: number; attendance: { studentId: number; status: string; remarks?: string }[] }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/mark`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to mark attendance');
    }
  }
);

export const markQRAttendance = createAsyncThunk(
  'attendance/markQRAttendance',
  async (data: { qrCode: string; teacherId: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/qr`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to mark QR attendance');
    }
  }
);

export const fetchTeacherAttendance = createAsyncThunk(
  'attendance/fetchTeacherAttendance',
  async (params: { date?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch teacher attendance');
    }
  }
);

export const markTeacherAttendance = createAsyncThunk(
  'attendance/markTeacherAttendance',
  async (data: { teacherId: number; status: string; qrCode?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/teachers/mark`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to mark teacher attendance');
    }
  }
);

export const fetchAttendanceStats = createAsyncThunk(
  'attendance/fetchStats',
  async (params: { classId?: number; date?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch attendance stats');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.data;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.todayAttendance = action.payload;
      })
      .addCase(markQRAttendance.fulfilled, (state, action) => {
        state.todayAttendance.push(action.payload);
      })
      .addCase(fetchTeacherAttendance.fulfilled, (state, action) => {
        state.teacherAttendance = action.payload.data;
      })
      .addCase(markTeacherAttendance.fulfilled, (state, action) => {
        state.teacherAttendance.push(action.payload);
      })
      .addCase(fetchAttendanceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
