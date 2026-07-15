// store/slices/classSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/classes`;

// Types
export interface Class {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity?: string | null;
  currentStrength?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassState {
  classes: Class[];
  sections: Section[];
  loading: boolean;
  error: string | null;
}

// Initial State
const initialState: ClassState = {
  classes: [],
  sections: [],
  loading: false,
  error: null,
};

// ==================== Slice ====================
const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    setClasses: (state, action: PayloadAction<Class[]>) => {
      state.classes = action.payload;
    },
    setSections: (state, action: PayloadAction<Section[]>) => {
      state.sections = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearClasses: (state) => {
      state.classes = [];
    },
    clearSections: (state) => {
      state.sections = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    addClass: (state, action: PayloadAction<Class>) => {
      state.classes.unshift(action.payload);
    },
    removeClassFromList: (state, action: PayloadAction<string>) => {
      state.classes = state.classes.filter((c) => c.id !== action.payload);
    },
    addSection: (state, action: PayloadAction<Section>) => {
      state.sections.push(action.payload);
    },
    removeSectionFromList: (state, action: PayloadAction<string>) => {
      state.sections = state.sections.filter((s) => s.id !== action.payload);
    },
  },
});

// ==================== Actions ====================
export const {
  setClasses,
  setSections,
  setLoading,
  setError,
  clearClasses,
  clearSections,
  clearError,
  addClass,
  removeClassFromList,
  addSection,
  removeSectionFromList,
} = classSlice.actions;

// ==================== API Calls ====================

// Get All Classes
export const getAllClassesApiCall = async (token: string) => {
  const { data } = await axios.get(`${API_URL}/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get All Sections (with optional classId filter)
export const getAllSectionsApiCall = async (token: string, classId?: string) => {
  const { data } = await axios.get(`${API_URL}/sections`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      classId: classId,
    },
  });
  return data;
};

// Create Class
export const createClassApiCall = async (token: string, classData: { name: string }) => {
  const { data } = await axios.post(`${API_URL}/`, classData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Delete Class
export const deleteClassApiCall = async (token: string, classId: string) => {
  const { data } = await axios.delete(`${API_URL}/${classId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Create Section
export const createSectionApiCall = async (token: string, sectionData: { name: string; classId: string; capacity?: string }) => {
  const { data } = await axios.post(`${API_URL}/sections`, sectionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Delete Section
export const deleteSectionApiCall = async (token: string, sectionId: string) => {
  const { data } = await axios.delete(`${API_URL}/sections/${sectionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// ==================== Export ====================
export default classSlice.reducer;