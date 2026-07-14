// store/studentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/students`;

// Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  address?: string;
}

export interface Class {
  id: number;
  name: string;
  numericValue: number;
  description?: string;
}

export interface Section {
  id: number;
  name: string;
  capacity?: number;
  currentStrength?: number;
}

export interface Parent {
  id: number;
  studentId: number;
  fatherName: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  fatherEmail?: string;
  motherName: string;
  motherPhone?: string;
  motherOccupation?: string;
  motherEmail?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  address?: string;
}

export interface Student {
  id: number;
  userId: number;
  rollNumber: string;
  admissionNumber: string;
  classId: number;
  sectionId: number;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  qrCode?: string;
  qrCodeImage?: string;
  emergencyContact?: string;
  admissionDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  class?: Class;
  section?: Section;
  parent?: Parent;
  attendanceSummary?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  feeSummary?: {
    total: number;
    paid: number;
    pending: number;
  };
  marksSummary?: {
    totalSubjects: number;
    averageMarks: number;
    highest: number;
    lowest: number;
  };
  recentExams?: Array<{
    examId: number;
    examName: string;
    examType: string;
    startDate: string;
    endDate: string;
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    grade: string;
  }>;
  libraryBooks?: Array<{
    bookId: number;
    title: string;
    author: string;
    issueDate: string;
    dueDate: string;
    status: string;
  }>;
}

export interface StudentState {
  students: Student[];
  currentStudent: Student | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  qrGenerating: boolean;
  qrError: string | null;
  filters: {
    search: string;
    classId: number | null;
    sectionId: number | null;
    status: string;
  };
}

// Initial State
const initialState: StudentState = {
  students: [],
  currentStudent: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  qrGenerating: false,
  qrError: null,
  filters: {
    search: '',
    classId: null,
    sectionId: null,
    status: 'active',
  },
};

// ==================== Async Thunks ====================

// Fetch students with pagination and filters
export const fetchStudents = createAsyncThunk(
  'student/fetchStudents',
  async (params: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: number;
    sectionId?: number;
    status?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Access Token:', token); // Debugging line to check the access token  
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // API Response: { status: "SUCCESS", message: "...", data: Student[], pagination: {...} }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch students';
      return rejectWithValue(message);
    }
  }
);

// Fetch single student by ID
export const fetchStudent = createAsyncThunk(
  'student/fetchStudent',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Response: { status: "SUCCESS", message: "...", data: Student }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch student';
      return rejectWithValue(message);
    }
  }
);

// Create student
export const createStudent = createAsyncThunk(
  'student/createStudent',
  async (studentData: {
    userId?: number;
    rollNumber: string;
    admissionNumber: string;
    classId: number;
    sectionId: number;
    dateOfBirth: string;
    gender: string;
    bloodGroup?: string;
    emergencyContact?: string;
    admissionDate: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password?: string;
      profileImage?: string;
    };
    parent?: {
      fatherName?: string;
      motherName?: string;
      fatherPhone?: string;
      motherPhone?: string;
      fatherOccupation?: string;
      motherOccupation?: string;
      address?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.post(API_URL, studentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Response: { status: "SUCCESS", message: "...", data: Student }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create student';
      return rejectWithValue(message);
    }
  }
);

// Update student
export const updateStudent = createAsyncThunk(
  'student/updateStudent',
  async ({
    id,
    data,
  }: {
    id: number;
    data: {
      rollNumber?: string;
      classId?: number;
      sectionId?: number;
      dateOfBirth?: string;
      gender?: string;
      bloodGroup?: string;
      emergencyContact?: string;
      isActive?: boolean;
      user?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        profileImage?: string;
        password?: string;
      };
      parent?: {
        fatherName?: string;
        motherName?: string;
        fatherPhone?: string;
        motherPhone?: string;
        fatherOccupation?: string;
        motherOccupation?: string;
        address?: string;
      };
    };
  }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.put(`${API_URL}/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Response: { status: "SUCCESS", message: "...", data: Student }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update student';
      return rejectWithValue(message);
    }
  }
);

// Delete student
export const deleteStudent = createAsyncThunk(
  'student/deleteStudent',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Response: { status: "SUCCESS", message: "Student deleted successfully" }
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete student';
      return rejectWithValue(message);
    }
  }
);

// Generate QR code for student
export const generateStudentQR = createAsyncThunk(
  'student/generateQR',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.post(`${API_URL}/${id}/qrcode`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Response: { status: "SUCCESS", message: "...", data: { qrCode: string } }
      return { id, ...response.data.data };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to generate QR code';
      return rejectWithValue(message);
    }
  }
);

// Get student attendance
export const fetchStudentAttendance = createAsyncThunk(
  'student/fetchAttendance',
  async ({ id, startDate, endDate }: { id: number; startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/${id}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
      });

      // API Response: { status: "SUCCESS", message: "...", data: Attendance[] }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch attendance';
      return rejectWithValue(message);
    }
  }
);

// Get student fees
export const fetchStudentFees = createAsyncThunk(
  'student/fetchFees',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/${id}/fees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Response: { status: "SUCCESS", message: "...", data: FeePayment[] }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch fees';
      return rejectWithValue(message);
    }
  }
);

// Get student marks
export const fetchStudentMarks = createAsyncThunk(
  'student/fetchMarks',
  async ({ id, examId }: { id: number; examId?: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/${id}/marks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { examId },
      });

      // API Response: { status: "SUCCESS", message: "...", data: Mark[] }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch marks';
      return rejectWithValue(message);
    }
  }
);

// Get student dashboard
export const fetchStudentDashboard = createAsyncThunk(
  'student/fetchDashboard',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/${id}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API Response: { status: "SUCCESS", message: "...", data: DashboardData }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch dashboard';
      return rejectWithValue(message);
    }
  }
);

// Bulk import students
export const bulkImportStudents = createAsyncThunk(
  'student/bulkImport',
  async (students: any[], { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.post(`${API_URL}/bulk-import`, { students }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to import students';
      return rejectWithValue(message);
    }
  }
);

// Export students
export const exportStudents = createAsyncThunk(
  'student/export',
  async ({ format = 'json' }: { format?: 'json' | 'csv' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { format },
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to export students';
      return rejectWithValue(message);
    }
  }
);

// ==================== Slice ====================

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.qrError = null;
    },
    clearCurrentStudent: (state) => {
      state.currentStudent = null;
    },
    clearQrError: (state) => {
      state.qrError = null;
    },
    setCurrentStudent: (state, action: PayloadAction<Student>) => {
      state.currentStudent = action.payload;
    },
    updateStudentInList: (state, action: PayloadAction<Student>) => {
      const index = state.students.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.students[index] = action.payload;
      }
    },
    removeStudentFromList: (state, action: PayloadAction<number>) => {
      state.students = state.students.filter((s) => s.id !== action.payload);
    },
    setFilters: (state, action: PayloadAction<Partial<StudentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action: PayloadAction<Partial<StudentState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== Fetch Students ==========
      .addCase(fetchStudents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        };
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch students';
      })

      // ========== Fetch Single Student ==========
      .addCase(fetchStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentStudent = action.payload;
      })
      .addCase(fetchStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch student';
      })

      // ========== Create Student ==========
      .addCase(createStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students.unshift(action.payload);
        state.currentStudent = action.payload;
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create student';
      })

      // ========== Update Student ==========
      .addCase(updateStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.students.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
        if (state.currentStudent?.id === action.payload.id) {
          state.currentStudent = action.payload;
        }
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update student';
      })

      // ========== Delete Student ==========
      .addCase(deleteStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students = state.students.filter((s) => s.id !== action.payload);
        if (state.currentStudent?.id === action.payload) {
          state.currentStudent = null;
        }
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete student';
      })

      // ========== Generate QR Code ==========
      .addCase(generateStudentQR.pending, (state) => {
        state.qrGenerating = true;
        state.qrError = null;
      })
      .addCase(generateStudentQR.fulfilled, (state, action) => {
        state.qrGenerating = false;
        const { id, qrCode, qrCodeImage } = action.payload;
        
        // Update in students list
        const index = state.students.findIndex((s) => s.id === id);
        if (index !== -1) {
          state.students[index].qrCode = qrCode;
          state.students[index].qrCodeImage = qrCodeImage;
        }
        
        // Update current student
        if (state.currentStudent?.id === id) {
          state.currentStudent.qrCode = qrCode;
          state.currentStudent.qrCodeImage = qrCodeImage;
        }
      })
      .addCase(generateStudentQR.rejected, (state, action) => {
        state.qrGenerating = false;
        state.qrError = action.payload as string || 'Failed to generate QR code';
      })

      // ========== Fetch Student Attendance ==========
      .addCase(fetchStudentAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentAttendance.fulfilled, (state) => {
        state.isLoading = false;
        // Store attendance data in a separate state or use as needed
      })
      .addCase(fetchStudentAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch attendance';
      })

      // ========== Fetch Student Fees ==========
      .addCase(fetchStudentFees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentFees.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchStudentFees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch fees';
      })

      // ========== Fetch Student Marks ==========
      .addCase(fetchStudentMarks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentMarks.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchStudentMarks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch marks';
      })

      // ========== Fetch Student Dashboard ==========
      .addCase(fetchStudentDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update current student with dashboard data
        if (state.currentStudent) {
          state.currentStudent = {
            ...state.currentStudent,
            ...action.payload.student,
            attendanceSummary: action.payload.attendanceSummary,
            feeSummary: action.payload.feeSummary,
            recentExams: action.payload.recentExams,
            libraryBooks: action.payload.libraryBooks,
          };
        }
      })
      .addCase(fetchStudentDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch dashboard';
      });
  },
});

// ==================== Actions ====================
export const {
  clearError,
  clearCurrentStudent,
  clearQrError,
  setCurrentStudent,
  updateStudentInList,
  removeStudentFromList,
  setFilters,
  resetFilters,
  setPagination,
} = studentSlice.actions;

// ==================== Selectors ====================
export const selectAllStudents = (state: { student: StudentState }) => state.student.students;
export const selectCurrentStudent = (state: { student: StudentState }) => state.student.currentStudent;
export const selectStudentLoading = (state: { student: StudentState }) => state.student.isLoading;
export const selectStudentError = (state: { student: StudentState }) => state.student.error;
export const selectStudentPagination = (state: { student: StudentState }) => state.student.pagination;
export const selectStudentFilters = (state: { student: StudentState }) => state.student.filters;
export const selectQRGenerating = (state: { student: StudentState }) => state.student.qrGenerating;
export const selectQRError = (state: { student: StudentState }) => state.student.qrError;

export default studentSlice.reducer;