import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/settings';

interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
  description?: string;
  isPublic: boolean;
}

interface SettingsState {
  settings: Setting[];
  schoolInfo: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  gradingSystem: { min: number; max: number; grade: string; points: number }[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: [],
  schoolInfo: {
    name: 'School Management System',
  },
  gradingSystem: [
    { min: 90, max: 100, grade: 'A+', points: 4.0 },
    { min: 80, max: 89, grade: 'A', points: 4.0 },
    { min: 70, max: 79, grade: 'B+', points: 3.5 },
    { min: 60, max: 69, grade: 'B', points: 3.0 },
    { min: 50, max: 59, grade: 'C+', points: 2.5 },
    { min: 40, max: 49, grade: 'C', points: 2.0 },
    { min: 35, max: 39, grade: 'D', points: 1.0 },
    { min: 0, max: 34, grade: 'F', points: 0.0 },
  ],
  isLoading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch settings');
    }
  }
);

export const updateSetting = createAsyncThunk(
  'settings/updateSetting',
  async (data: { key: string; value: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/${data.key}`, { value: data.value }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to update setting');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSchoolInfo: (state, action) => {
      state.schoolInfo = { ...state.schoolInfo, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        const index = state.settings.findIndex(s => s.key === action.payload.key);
        if (index !== -1) {
          state.settings[index] = action.payload;
        }
      });
  },
});

export const { clearError, setSchoolInfo } = settingsSlice.actions;
export default settingsSlice.reducer;
