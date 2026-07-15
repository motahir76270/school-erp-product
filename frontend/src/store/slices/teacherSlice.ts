// store/slices/teacherSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/teachers`;

// Types
export interface Teacher {
  id: string;
  userId: string | null;
  username: string;
  email: string;
  password: string;
  role: 'teacher';
  name: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  employeeId: string;
  qualification: string | null;
  experience: string | null;
  specialization: string | null;
  joiningDate: string;
  salary: string | null;
  qrCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface CreateTeacherData {
  email: string;
  password?: string;
  name: string;
  username?: string;
  employeeId: string;
  qualification?: string;
  experience?: string;
  specialization?: string;
  joiningDate: string;
  salary?: string;
}

export interface UpdateTeacherData {
  name?: string;
  username?: string;
  profileImage?: string;
  qualification?: string;
  experience?: string;
  specialization?: string;
  salary?: string;
  isActive?: boolean;
}

export interface TeacherState {
  teachers: Teacher[];
  currentTeacher: Teacher | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  qrGenerating: boolean;
  qrError: string | null;
}

// Initial State
const initialState: TeacherState = {
  teachers: [],
  currentTeacher: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  qrGenerating: false,
  qrError: null,
};

// ==================== Slice ====================
const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    setTeachers: (state, action: PayloadAction<Teacher[]>) => {
      state.teachers = action.payload;
    },
    setCurrentTeacher: (state, action: PayloadAction<Teacher | null>) => {
      state.currentTeacher = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number; total: number; totalPages: number }>) => {
      state.pagination = action.payload;
    },
    setQRGenerating: (state, action: PayloadAction<boolean>) => {
      state.qrGenerating = action.payload;
    },
    setQRError: (state, action: PayloadAction<string | null>) => {
      state.qrError = action.payload;
    },
    clearTeachers: (state) => {
      state.teachers = [];
    },
    clearCurrentTeacher: (state) => {
      state.currentTeacher = null;
    },
    clearError: (state) => {
      state.error = null;
      state.qrError = null;
    },
    addTeacher: (state, action: PayloadAction<Teacher>) => {
      state.teachers.unshift(action.payload);
    },
    updateTeacherInList: (state, action: PayloadAction<Teacher>) => {
      const index = state.teachers.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.teachers[index] = action.payload;
      }
    },
    removeTeacherFromList: (state, action: PayloadAction<string>) => {
      state.teachers = state.teachers.filter((t) => t.id !== action.payload);
    },
  },
});

// ==================== Actions ====================
export const {
  setTeachers,
  setCurrentTeacher,
  setLoading,
  setError,
  setPagination,
  setQRGenerating,
  setQRError,
  clearTeachers,
  clearCurrentTeacher,
  clearError,
  addTeacher,
  updateTeacherInList,
  removeTeacherFromList,
} = teacherSlice.actions;

// ==================== API Calls ====================

// Get All Teachers
export const getAllTeachersApiCall = async (
  token: string,
  page: number = 1,
  search: string = "",
  status?: string
) => {
  const { data } = await axios.get(`${API_URL}/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page
    },
  });

  console.log('====================================');
  console.log("sakjfdajdfk");
  console.log('====================================');

  return data;
};

// Get Teacher by ID
export const getTeacherByIdApiCall = async (token: string, teacherId: string) => {
  const { data } = await axios.get(`${API_URL}/${teacherId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Create Teacher
export const createTeacherApiCall = async (token: string, teacherData: FormData) => {
  const { data } = await axios.post(`${API_URL}/register`, teacherData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Update Teacher (Admin)
export const updateTeacherApiCall = async (token: string, teacherId: string, teacherData: FormData) => {
  const { data } = await axios.put(`${API_URL}/${teacherId}`, teacherData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Update Teacher Profile (Self)
export const updateTeacherProfileApiCall = async (token: string, teacherData: FormData) => {
  const { data } = await axios.put(`${API_URL}/profile`, teacherData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Delete Teacher (Soft Delete - Self)
export const deleteTeacherApiCall = async (token: string) => {
  const { data } = await axios.delete(`${API_URL}/delete`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Hard Delete Teacher (Admin)
export const hardDeleteTeacherApiCall = async (token: string, teacherId: string) => {
  const { data } = await axios.delete(`${API_URL}/hard-delete/${teacherId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Update Teacher Status
export const updateTeacherStatusApiCall = async (
  token: string,
  teacherId: string,
  status: 'active' | 'inactive' | 'suspended'
) => {
  const { data } = await axios.patch(
    `${API_URL}/status/${teacherId}`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Reset Teacher Password (Admin)
export const resetTeacherPasswordApiCall = async (
  token: string,
  teacherId: string,
  newPassword?: string
) => {
  const { data } = await axios.post(
    `${API_URL}/reset-password/${teacherId}`,
    { newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Change Teacher Password (Self)
export const changeTeacherPasswordApiCall = async (
  token: string,
  currentPassword: string,
  newPassword: string
) => {
  const { data } = await axios.post(
    `${API_URL}/change-password`,
    { currentPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Get Teacher Profile (Self)
export const getTeacherProfileApiCall = async (token: string) => {
  const { data } = await axios.get(`${API_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get Teacher QR Code
export const getTeacherQRCodeApiCall = async (token: string) => {
  const { data } = await axios.get(`${API_URL}/qr-code`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Regenerate Teacher QR Code
export const regenerateTeacherQRCodeApiCall = async (token: string) => {
  const { data } = await axios.post(
    `${API_URL}/qr-code/regenerate`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Teacher Login
export const teacherLoginApiCall = async (email: string, password: string) => {
  const { data } = await axios.post(`${API_URL}/login`, { email, password });
  return data;
};

// ==================== Export ====================
export default teacherSlice.reducer;