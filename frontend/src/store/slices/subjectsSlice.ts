// store/slices/subjectsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// ==================== TYPES ====================

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code: string;
  type: 'theory' | 'practical';
  maxMarks: number;
  passMarks: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  assignedClasses?: any[];
  totalClasses?: number;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string | null;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  subject?: Subject;
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

interface SubjectState {
  subjects: Subject[];
  currentSubject: Subject | null;
  classSubjects: ClassSubject[];
  sectionSubjects: ClassSubject[];
  classSubjectsMap: Record<string, ClassSubject[]>;
  sectionSubjectsMap: Record<string, ClassSubject[]>;
  subjectClassesMap: Record<string, any[]>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  classSubjectsPagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: SubjectState = {
  subjects: [],
  currentSubject: null,
  classSubjects: [],
  sectionSubjects: [],
  classSubjectsMap: {},
  sectionSubjectsMap: {},
  subjectClassesMap: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  classSubjectsPagination: {
    limit: 100,
    offset: 0,
    total: 0,
    hasMore: false,
  },
};

const subjectSlice = createSlice({
  name: 'subjects',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSubjects: (state, action: PayloadAction<Subject[]>) => {
      state.subjects = action.payload;
    },
    setCurrentSubject: (state, action: PayloadAction<Subject | null>) => {
      state.currentSubject = action.payload;
    },
    setClassSubjects: (state, action: PayloadAction<ClassSubject[]>) => {
      state.classSubjects = action.payload;
    },
    setSectionSubjects: (state, action: PayloadAction<ClassSubject[]>) => {
      state.sectionSubjects = action.payload;
    },
    setClassSubjectsMap: (state, action: PayloadAction<{ classId: string; subjects: ClassSubject[] }>) => {
      state.classSubjectsMap[action.payload.classId] = action.payload.subjects;
    },
    setSectionSubjectsMap: (state, action: PayloadAction<{ sectionId: string; subjects: ClassSubject[] }>) => {
      state.sectionSubjectsMap[action.payload.sectionId] = action.payload.subjects;
    },
    setSubjectClassesMap: (state, action: PayloadAction<{ subjectId: string; classes: any[] }>) => {
      state.subjectClassesMap[action.payload.subjectId] = action.payload.classes;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number; total: number; totalPages: number }>) => {
      state.pagination = action.payload;
    },
    setClassSubjectsPagination: (state, action: PayloadAction<{ limit: number; offset: number; total: number; hasMore: boolean }>) => {
      state.classSubjectsPagination = action.payload;
    },
    addSubject: (state, action: PayloadAction<Subject>) => {
      state.subjects.unshift(action.payload);
    },
    updateSubjectInState: (state, action: PayloadAction<Subject>) => {
      const index = state.subjects.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.subjects[index] = action.payload;
      }
      if (state.currentSubject?.id === action.payload.id) {
        state.currentSubject = action.payload;
      }
    },
    removeSubjectFromState: (state, action: PayloadAction<string>) => {
      state.subjects = state.subjects.filter(s => s.id !== action.payload);
      if (state.currentSubject?.id === action.payload) {
        state.currentSubject = null;
      }
    },
    addClassSubject: (state, action: PayloadAction<ClassSubject>) => {
      state.classSubjects.push(action.payload);
      const classId = action.payload.classId;
      if (state.classSubjectsMap[classId]) {
        state.classSubjectsMap[classId].push(action.payload);
      }
    },
    addSectionSubject: (state, action: PayloadAction<ClassSubject>) => {
      state.sectionSubjects.push(action.payload);
      const sectionId = action.payload.classId; // Using classId as sectionId for now
      if (state.sectionSubjectsMap[sectionId]) {
        state.sectionSubjectsMap[sectionId].push(action.payload);
      }
    },
    removeClassSubjectFromState: (state, action: PayloadAction<string>) => {
      state.classSubjects = state.classSubjects.filter(cs => cs.id !== action.payload);
      Object.keys(state.classSubjectsMap).forEach(key => {
        state.classSubjectsMap[key] = state.classSubjectsMap[key].filter(
          cs => cs.id !== action.payload
        );
      });
    },
    removeSectionSubjectFromState: (state, action: PayloadAction<string>) => {
      state.sectionSubjects = state.sectionSubjects.filter(cs => cs.id !== action.payload);
      Object.keys(state.sectionSubjectsMap).forEach(key => {
        state.sectionSubjectsMap[key] = state.sectionSubjectsMap[key].filter(
          cs => cs.id !== action.payload
        );
      });
    },
    clearCurrentSubject: (state) => {
      state.currentSubject = null;
    },
    clearSubjects: (state) => {
      state.subjects = [];
      state.classSubjects = [];
      state.sectionSubjects = [];
      state.classSubjectsMap = {};
      state.sectionSubjectsMap = {};
      state.subjectClassesMap = {};
    },
    resetSubjectState: () => initialState,
  },
});

export const {
  setLoading,
  setSubmitting,
  setError,
  clearError,
  setSubjects,
  setCurrentSubject,
  setClassSubjects,
  setSectionSubjects,
  setClassSubjectsMap,
  setSectionSubjectsMap,
  setSubjectClassesMap,
  setPagination,
  setClassSubjectsPagination,
  addSubject,
  updateSubjectInState,
  removeSubjectFromState,
  addClassSubject,
  addSectionSubject,
  removeClassSubjectFromState,
  removeSectionSubjectFromState,
  clearCurrentSubject,
  clearSubjects,
  resetSubjectState,
} = subjectSlice.actions;

// ==================== API CALLS ====================

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/subjects` || '';

const getHeaders = (token?: string) => ({
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

const handleApiError = (error: any): never => {
  const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
  throw { success: false, message: errorMessage };
};

// Subject CRUD
export const createSubjectApiCall = async (token: string, payload: any) => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}`, payload, getHeaders(token));
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const getSubjectsApiCall = async (token: string, params?: any) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}`, {
      ...getHeaders(token),
      params,
    });
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const getSubjectByIdApiCall = async (token: string, id: string) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/${id}`, getHeaders(token));
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const updateSubjectApiCall = async (token: string, id: string, payload: any) => {
  try {
    const { data } = await axios.put(`${API_BASE_URL}/${id}`, payload, getHeaders(token));
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const deleteSubjectApiCall = async (token: string, id: string) => {
  try {
    const { data } = await axios.delete(`${API_BASE_URL}/${id}`, getHeaders(token));
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const hardDeleteSubjectApiCall = async (token: string, id: string) => {
  try {
    const { data } = await axios.delete(`${API_BASE_URL}/hard/${id}`, getHeaders(token));
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const updateSubjectStatusApiCall = async (token: string, id: string, status: 'active' | 'inactive') => {
  try {
    const { data } = await axios.patch(
      `${API_BASE_URL}/status/${id}`,
      { status },
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Class Subject Assignments
export const assignSubjectToClassApiCall = async (token: string, payload: {
  classId: string;
  subjectId: string;
  teacherId?: string;
}) => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/assign`, payload, getHeaders(token));
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const bulkAssignSubjectsToClassApiCall = async (token: string, payload: {
  classId: string;
  subjects: Array<{ subjectId: string; teacherId?: string }>;
}) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/assign/bulk/class`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const bulkAssignSubjectsToSectionApiCall = async (token: string, payload: {
  sectionId: string;
  subjects: Array<{ subjectId: string; teacherId?: string }>;
}) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/assign/bulk/section`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const getSubjectsByClassApiCall = async (token: string, classId: string) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/class/${classId}`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const getSubjectsBySectionApiCall = async (token: string, sectionId: string) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/section/${sectionId}`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const getClassesBySubjectApiCall = async (token: string, subjectId: string) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/subject/${subjectId}/classes`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const getAllClassSubjectsApiCall = async (token: string, params?: any) => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/assignments`,
      {
        ...getHeaders(token),
        params,
      }
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const updateClassSubjectApiCall = async (token: string, id: string, payload: {
  teacherId?: string;
}) => {
  try {
    const { data } = await axios.put(
      `${API_BASE_URL}/assign/${id}`,
      payload,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const removeSubjectFromClassApiCall = async (token: string, assignmentId: string) => {
  try {
    const { data } = await axios.delete(
      `${API_BASE_URL}/assign/${assignmentId}`,
      getHeaders(token)
    );
    return data;
  } catch (error: any) {
    return handleApiError(error);
  }
};



export default subjectSlice.reducer;