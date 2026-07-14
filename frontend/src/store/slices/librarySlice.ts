import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/library';

interface LibraryBook {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  category?: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation?: string;
  description?: string;
  coverImage?: string;
  price?: string;
  isActive: boolean;
}

interface BookIssue {
  id: number;
  bookId: number;
  studentId: number;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount?: string;
  finePaid: boolean;
  status: 'issued' | 'returned' | 'overdue' | 'lost';
  book?: LibraryBook;
}

interface LibraryState {
  books: LibraryBook[];
  issues: BookIssue[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LibraryState = {
  books: [],
  issues: [],
  isLoading: false,
  error: null,
};

export const fetchBooks = createAsyncThunk(
  'library/fetchBooks',
  async (params: { search?: string; category?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch books');
    }
  }
);

export const addBook = createAsyncThunk(
  'library/addBook',
  async (bookData: Partial<LibraryBook>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(API_URL, bookData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to add book');
    }
  }
);

export const issueBook = createAsyncThunk(
  'library/issueBook',
  async (data: { bookId: number; studentId: number; dueDate: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/issue`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to issue book');
    }
  }
);

export const returnBook = createAsyncThunk(
  'library/returnBook',
  async (issueId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/return/${issueId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to return book');
    }
  }
);

export const fetchIssues = createAsyncThunk(
  'library/fetchIssues',
  async (params: { studentId?: number; status?: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/issues`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || 'Failed to fetch issues');
    }
  }
);

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addBook.fulfilled, (state, action) => {
        state.books.push(action.payload);
      })
      .addCase(issueBook.fulfilled, (state, action) => {
        state.issues.push(action.payload);
      })
      .addCase(returnBook.fulfilled, (state, action) => {
        const index = state.issues.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.issues[index] = action.payload;
        }
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.issues = action.payload;
      });
  },
});

export const { clearError } = librarySlice.actions;
export default librarySlice.reducer;
