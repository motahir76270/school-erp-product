// store/slices/studentSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/students`;


// Initial State
const initialState = {
  students: [],
  currentStudent: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

// ==================== Slice ====================
const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setStudents: (state, action) => {
      state.students = action.payload;
    },
    setCurrentStudent: (state, action) => {
      state.currentStudent = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = action.payload;
    },
    clearStudents: (state) => {
      state.students = [];
    },
    clearCurrentStudent: (state) => {
      state.currentStudent = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    addStudent: (state, action) => {
      state.students = action.payload
    },
    updateStudentInList: (state:any, action) => {
      const index = state.students.findIndex((s:any) => s.id === action.payload.id);
      if (index !== -1) {
        state.students[index] = action.payload;
      }
    },
    removeStudentFromList: (state, action) => {
      state.students = state.students.filter((s:any) => s.id !== action.payload);
    },
  },
});

// ==================== Actions ====================
export const {
  setStudents,
  setCurrentStudent,
  setLoading,
  setError,
  setPagination,
  clearStudents,
  clearCurrentStudent,
  clearError,
  addStudent,
  updateStudentInList,
  removeStudentFromList,
} = studentSlice.actions;

// ==================== API Calls ====================

// Get All Students
export const getAllStudentsApiCall = async (
  token: string,
  page: number = 1,
  search: string = "",
  status?: string,
  classId?: string,
  sectionId?: string
) => {
  const { data } = await axios.get(`${API_URL}/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page,
      search,
      status,
      classId,
      sectionId,
    },
  });

  return data;
};

// Get Student by ID
export const getStudentByIdApiCall = async (token: string, studentId: string) => {
  const { data } = await axios.get(`${API_URL}/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Create Student
export const createStudentApiCall = async (token: string, studentData: FormData) => {
  const { data } = await axios.post(`${API_URL}/register`, studentData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Update Student
export const updateStudentApiCall = async (token: string, studentId: string, studentData: FormData) => {
  const { data } = await axios.put(`${API_URL}/${studentId}`, studentData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Update Student Profile (Self)
export const updateStudentProfileApiCall = async (token: string, studentData: FormData) => {
  const { data } = await axios.put(`${API_URL}/profile`, studentData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// add or update studnet faceDesctrotor or face regognige
export const addOrUpdateStudentFaceDescriptorApiCall = async (token: any, id:any, faceDescriptor:any) => {
  const { data } = await axios.put(`${API_URL}/face/${id}`, {faceDescriptor}, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return data;
};


// Delete Student (Soft Delete)
export const deleteStudentApiCall = async (token: string) => {
  const { data } = await axios.delete(`${API_URL}/delete`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Hard Delete Student (Admin)
export const hardDeleteStudentApiCall = async (token: string, studentId: string) => {
  const { data } = await axios.delete(`${API_URL}/hard-delete/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Update Student Status
export const updateStudentStatusApiCall = async (
  token: string,
  studentId: string,
  status: 'active' | 'inactive' | 'suspended'
) => {
  const { data } = await axios.patch(
    `${API_URL}/status/${studentId}`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Reset Student Password
export const resetStudentPasswordApiCall = async (
  token: string,
  studentId: string,
  newPassword?: string
) => {
  const { data } = await axios.post(
    `${API_URL}/reset-password/${studentId}`,
    { newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Change Student Password (Self)
export const changeStudentPasswordApiCall = async (
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

// Get Student Profile (Self)
export const getStudentProfileApiCall = async (token: string) => {
  const { data } = await axios.get(`${API_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get Student QR Code
export const getStudentQRCodeApiCall = async (token: string) => {
  const { data } = await axios.get(`${API_URL}/qr-code`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Regenerate Student QR Code
export const regenerateStudentQRCodeApiCall = async (token: string) => {
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

// Scan Student QR Code
export const scanStudentQRCodeApiCall = async (token: string, studentId: string) => {
  const { data } = await axios.get(`${API_URL}/qr-scan/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get Students by Class
export const getStudentsByClassApiCall = async (token: string, classId: string) => {
  const { data } = await axios.get(`${API_URL}/class/${classId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get Students by Section
export const getStudentsBySectionApiCall = async (token: string, sectionId: string) => {
  const { data } = await axios.get(`${API_URL}/section/${sectionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get Students by Class and Section
export const getStudentsByClassAndSectionApiCall = async (
  token: string,
  classId: string,
  sectionId: string
) => {
  const { data } = await axios.get(`${API_URL}/class/${classId}/section/${sectionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Bulk Import Students
export const bulkImportStudentsApiCall = async (token: string, students: any[]) => {
  const { data } = await axios.post(
    `${API_URL}/bulk-import`,
    { students },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

// Export Students
export const exportStudentsApiCall = async (
  token: string,
  format: 'json' | 'csv' = 'json'
) => {
  const { data } = await axios.get(`${API_URL}/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { format },
  });
  return data;
};

// Student Login
export const studentLoginApiCall = async (email: string, password: string) => {
  const { data } = await axios.post(`${API_URL}/login`, { email, password });
  return data;
};

// ==================== Export ====================
export default studentSlice.reducer;