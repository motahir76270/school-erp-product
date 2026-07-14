import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toasts: Toast[];
  isLoading: boolean;
  modalOpen: string | null;
  filters: Record<string, unknown>;
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  toasts: [],
  isLoading: false,
  modalOpen: null,
  filters: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addToast: (state, action: PayloadAction<Toast>) => {
      state.toasts.push(action.payload);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = null;
    },
    setFilter: (state, action: PayloadAction<{ key: string; value: unknown }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  addToast,
  removeToast,
  clearToasts,
  setLoading,
  openModal,
  closeModal,
  setFilter,
  clearFilters,
} = uiSlice.actions;
export default uiSlice.reducer;
