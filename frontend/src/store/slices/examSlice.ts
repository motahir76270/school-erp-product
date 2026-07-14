import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/exams';

interface Exam {
  id: number;
  name: string;
  examType: string;
  classId: number;
  startDate: string;
  endDate: string;
  totalMarks: number;
  passingMarks: number;
  academicYear: string;
  description?: string;
  isActive: boolean;
}

interface Marks {
  id: number;
  examSubjectId: number;
  studentId: number;
  subjectId: number;
  marksObtained: string;
  grade?: string;
  gradePoint?: string;
  remarks?: string;
}

interface ExamResult {
  id: number;
  examId: number;
  studentId: number;
  classId: number;
  totalMarks: string;
  obtainedMarks: string;
  percentage: string;
  grade: string;
  cgpa?: string;
  rank?: number;
  passed: boolean;
}

interface ExamState {
  exams: Exam[];
  marks: Marks[];
  results: ExamResult[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExamState = {
  exams: [],
  marks: [],
  results: [],
  isLoading: false,
  error: null,
};

export const fetchExams = createAsyncThunk(
  'exam/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch exams');
    }
  }
);

export const createExam = createAsyncThunk(
  'exam/createExam',
  async (examData: Partial<Exam>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(API_URL, examData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create exam');
    }
  }
);

export const fetchMarks = createAsyncThunk(
  'exam/fetchMarks',
  async (params: { examId: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/marks`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch marks');
    }
  }
);

export const submitMarks = createAsyncThunk(
  'exam/submitMarks',
  async (data: { marks: Partial<Marks>[] }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/marks`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to submit marks');
    }
  }
);

export const fetchResults = createAsyncThunk(
  'exam/fetchResults',
  async (params: { examId: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/results`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch results');
    }
  }
);

export const generateResults = createAsyncThunk(
  'exam/generateResults',
  async (examId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/${examId}/generate-results`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to generate results');
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.exams = action.payload;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.exams.push(action.payload);
      })
      .addCase(fetchMarks.fulfilled, (state, action) => {
        state.marks = action.payload;
      })
      .addCase(submitMarks.fulfilled, (state, action) => {
        state.marks = action.payload;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.results = action.payload;
      })
      .addCase(generateResults.fulfilled, (state, action) => {
        state.results = action.payload;
      });
  },
});

export const { clearError } = examSlice.actions;
export default examSlice.reducer;
