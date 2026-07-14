import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/classes';

interface Class {
  id: number;
  name: string;
  numericValue: number;
  description?: string;
  classTeacherId?: number;
  isActive: boolean;
  sections?: Section[];
  classTeacher?: { id: number; user: { firstName: string; lastName: string } };
}

interface Section {
  id: number;
  name: string;
  classId: number;
  capacity: number;
  currentStrength: number;
  isActive: boolean;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  creditHours: number;
  isActive: boolean;
}

interface ClassState {
  classes: Class[];
  sections: Section[];
  subjects: Subject[];
  currentClass: Class | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClassState = {
  classes: [],
  sections: [],
  subjects: [],
  currentClass: null,
  isLoading: false,
  error: null,
};

export const fetchClasses = createAsyncThunk(
  'class/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch classes');
    }
  }
);

export const createClass = createAsyncThunk(
  'class/createClass',
  async (classData: Partial<Class>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(API_URL, classData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create class');
    }
  }
);

export const fetchSections = createAsyncThunk(
  'class/fetchSections',
  async (classId: number | undefined, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = classId ? `${API_URL}/sections?classId=${classId}` : `${API_URL}/sections`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch sections');
    }
  }
);

export const createSection = createAsyncThunk(
  'class/createSection',
  async (sectionData: Partial<Section>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/sections`, sectionData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create section');
    }
  }
);

export const fetchSubjects = createAsyncThunk(
  'class/fetchSubjects',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch subjects');
    }
  }
);

export const createSubject = createAsyncThunk(
  'class/createSubject',
  async (subjectData: Partial<Subject>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('/api/subjects', subjectData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create subject');
    }
  }
);

const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.classes.push(action.payload);
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.sections = action.payload;
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.sections.push(action.payload);
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
      })
      .addCase(createSubject.fulfilled, (state, action) => {
        state.subjects.push(action.payload);
      });
  },
});

export const { clearError } = classSlice.actions;
export default classSlice.reducer;
