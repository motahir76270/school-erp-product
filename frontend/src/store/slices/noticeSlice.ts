import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/notices';

interface Notice {
  id: number;
  title: string;
  content: string;
  target: 'students' | 'teachers' | 'everyone' | 'specific_class';
  targetClassId?: number;
  attachmentUrl?: string;
  publishDate: string;
  expiryDate?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdBy: number;
  isActive: boolean;
}

interface Holiday {
  id: number;
  name: string;
  description?: string;
  holidayType: 'national' | 'festival' | 'school' | 'other';
  startDate: string;
  endDate: string;
  isRecurring: boolean;
}

interface NoticeState {
  notices: Notice[];
  holidays: Holiday[];
  isLoading: boolean;
  error: string | null;
}

const initialState: NoticeState = {
  notices: [],
  holidays: [],
  isLoading: false,
  error: null,
};

export const fetchNotices = createAsyncThunk(
  'notice/fetchNotices',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch notices');
    }
  }
);

export const createNotice = createAsyncThunk(
  'notice/createNotice',
  async (noticeData: Partial<Notice>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(API_URL, noticeData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create notice');
    }
  }
);

export const fetchHolidays = createAsyncThunk(
  'notice/fetchHolidays',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/holidays', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch holidays');
    }
  }
);

export const createHoliday = createAsyncThunk(
  'notice/createHoliday',
  async (holidayData: Partial<Holiday>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('/api/holidays', holidayData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to create holiday');
    }
  }
);

const noticeSlice = createSlice({
  name: 'notice',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotices.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notices = action.payload;
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createNotice.fulfilled, (state, action) => {
        state.notices.unshift(action.payload);
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.holidays = action.payload;
      })
      .addCase(createHoliday.fulfilled, (state, action) => {
        state.holidays.push(action.payload);
      });
  },
});

export const { clearError } = noticeSlice.actions;
export default noticeSlice.reducer;
