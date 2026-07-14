import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/teachers';

interface Teacher {
  id: number;
  userId: number;
  employeeId: string;
  qualification?: string;
  experience?: number;
  specialization?: string;
  salary?: string;
  joiningDate: string;
  qrCode?: string;
  isActive: boolean;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    profileImage?: string;
  };
}

interface TeacherState {
  teachers: Teacher[];
  currentTeacher: Teacher | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: TeacherState = {
  teachers: [],
  currentTeacher: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const fetchTeachers = createAsyncThunk(
  'teacher/fetchTeachers',
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: params.page || 1, limit: params.limit || 10, ...params },
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch teachers');
    }
  }
);

export const createTeacher = createAsyncThunk(
  'teacher/createTeacher',
  async (teacherData: Partial<Teacher>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(API_URL, teacherData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create teacher');
    }
  }
);

export const updateTeacher = createAsyncThunk(
  'teacher/updateTeacher',
  async ({ id, data }: { id: number; data: Partial<Teacher> }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to update teacher');
    }
  }
);

export const deleteTeacher = createAsyncThunk(
  'teacher/deleteTeacher',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to delete teacher');
    }
  }
);

export const generateTeacherQR = createAsyncThunk(
  'teacher/generateQR',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/${id}/qr`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to generate QR code');
    }
  }
);

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teachers = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.teachers.unshift(action.payload);
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        const index = state.teachers.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.teachers[index] = action.payload;
        }
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        state.teachers = state.teachers.filter((t) => t.id !== action.payload);
      })
      .addCase(generateTeacherQR.fulfilled, (state, action) => {
        if (state.currentTeacher && state.currentTeacher.id === action.payload.id) {
          state.currentTeacher.qrCode = action.payload.qrCode;
        }
      });
  },
});

export const { clearError } = teacherSlice.actions;
export default teacherSlice.reducer;
