import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/mcq';

interface McqTest {
  id: number;
  title: string;
  description?: string;
  classId: number;
  subjectId: number;
  teacherId: number;
  totalQuestions: number;
  totalMarks: number;
  duration: number;
  negativeMarking?: string;
  randomQuestions: boolean;
  startTime: string;
  endTime: string;
  passingMarks: number;
  status: 'draft' | 'published' | 'completed' | 'archived';
}

interface McqQuestion {
  id: number;
  testId: number;
  subjectId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  marks: number;
  explanation?: string;
  imageUrl?: string;
}

interface McqAnswer {
  id: number;
  testId: number;
  questionId: number;
  studentId: number;
  selectedAnswer?: string;
  isCorrect: boolean;
  marksObtained: string;
  timeTaken?: number;
}

interface McqResult {
  testId: number;
  studentId: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  totalMarks: number;
  obtainedMarks: number;
  rank?: number;
}

interface McqState {
  tests: McqTest[];
  currentTest: McqTest | null;
  questions: McqQuestion[];
  answers: McqAnswer[];
  result: McqResult | null;
  leaderboard: { studentId: number; obtainedMarks: number; rank: number }[];
  isLoading: boolean;
  error: string | null;
}

const initialState: McqState = {
  tests: [],
  currentTest: null,
  questions: [],
  answers: [],
  result: null,
  leaderboard: [],
  isLoading: false,
  error: null,
};

export const fetchMcqTests = createAsyncThunk(
  'mcq/fetchTests',
  async (params: { classId?: number; status?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch MCQ tests');
    }
  }
);

export const createMcqTest = createAsyncThunk(
  'mcq/createTest',
  async (testData: Partial<McqTest>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(API_URL, testData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create MCQ test');
    }
  }
);

export const fetchTestQuestions = createAsyncThunk(
  'mcq/fetchQuestions',
  async (testId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/${testId}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch questions');
    }
  }
);

export const submitMcqTest = createAsyncThunk(
  'mcq/submitTest',
  async (data: { testId: number; answers: { questionId: number; selectedAnswer: string; timeTaken: number }[] }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/${data.testId}/submit`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to submit test');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'mcq/fetchLeaderboard',
  async (testId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/${testId}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch leaderboard');
    }
  }
);

const mcqSlice = createSlice({
  name: 'mcq',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTest: (state, action) => {
      state.currentTest = action.payload;
    },
    setAnswer: (state, action) => {
      const index = state.answers.findIndex(a => a.questionId === action.payload.questionId);
      if (index !== -1) {
        state.answers[index] = action.payload;
      } else {
        state.answers.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMcqTests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMcqTests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tests = action.payload;
      })
      .addCase(fetchMcqTests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createMcqTest.fulfilled, (state, action) => {
        state.tests.push(action.payload);
      })
      .addCase(fetchTestQuestions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTestQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions = action.payload;
      })
      .addCase(submitMcqTest.fulfilled, (state, action) => {
        state.result = action.payload;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      });
  },
});

export const { clearError, setCurrentTest, setAnswer } = mcqSlice.actions;
export default mcqSlice.reducer;
