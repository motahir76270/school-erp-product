// store/slices/permissionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/permissions` || 'http://localhost:5000/api';

// ==================== Types ====================

// User Permission Types
export interface UserPermission {
  id: string;
  userId: string;
  attendance: boolean;
  subject: boolean;
  classes: boolean;
  exam: boolean;
  fee: boolean;
  users: boolean;
  students: boolean;
  teachers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPermission {
  id: string;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage: string | null;
  isActive: boolean;
  userPermission: UserPermission | null;
  createdAt: string;
  updatedAt: string;
}

// Teacher Permission Types
export interface TeacherPermission {
  id: string;
  userId: string;
  teacherId: string;
  attendance: boolean;
  subject: boolean;
  classes: boolean;
  exam: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherWithPermission {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  profileImage: string | null;
  isActive: boolean;
  teacherPermission: TeacherPermission | null;
  createdAt: string;
  updatedAt: string;
}

// Pagination Types
export interface PermissionPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserPermissionResponse {
  users: UserWithPermission[];
  pagination: PermissionPagination;
}

export interface TeacherPermissionResponse {
  teachers: TeacherWithPermission[];
  pagination: PermissionPagination;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Permission Keys
export type UserPermissionKey = 'attendance' | 'subject' | 'classes' | 'exam' | 'fee' | 'users' | 'students' | 'teachers';
export type TeacherPermissionKey = 'attendance' | 'subject' | 'classes' | 'exam';

// ==================== Initial State ====================

interface PermissionState {
  // User Permissions
  userPermissions: UserWithPermission[];
  currentUserPermission: UserPermission | null;
  
  // Teacher Permissions
  teacherPermissions: TeacherWithPermission[];
  currentTeacherPermission: TeacherPermission | null;
  
  // Common
  loading: boolean;
  error: string | null;
  pagination: PermissionPagination;
}

const initialState: PermissionState = {
  userPermissions: [],
  currentUserPermission: null,
  teacherPermissions: [],
  currentTeacherPermission: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

// ==================== Slice ====================

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    // ========== User Permissions ==========
    setUserPermissions: (state, action: PayloadAction<UserPermissionResponse>) => {
      state.userPermissions = action.payload.users || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    setCurrentUserPermission: (state, action: PayloadAction<UserPermission | null>) => {
      state.currentUserPermission = action.payload;
    },
    addUserPermission: (state, action: PayloadAction<UserPermission>) => {
      // Find the user and update their permission
      const index = state.userPermissions.findIndex(u => u.id === action.payload.userId);
      if (index !== -1) {
        state.userPermissions[index].userPermission = action.payload;
      }
    },
    updateUserPermissionInList: (state, action: PayloadAction<UserPermission>) => {
      const index = state.userPermissions.findIndex(u => u.id === action.payload.userId);
      if (index !== -1) {
        state.userPermissions[index].userPermission = action.payload;
      }
      if (state.currentUserPermission?.id === action.payload.id) {
        state.currentUserPermission = action.payload;
      }
    },
    updateUserPermissionStatus: (state, action: PayloadAction<{ userId: string; permission: UserPermissionKey; value: boolean }>) => {
      const { userId, permission, value } = action.payload;
      const index = state.userPermissions.findIndex(u => u.id === userId);
      if (index !== -1 && state.userPermissions[index].userPermission) {
        state.userPermissions[index].userPermission![permission] = value;
      }
      if (state.currentUserPermission?.userId === userId) {
        state.currentUserPermission[permission] = value;
      }
    },
    removeUserPermission: (state, action: PayloadAction<string>) => {
      state.userPermissions = state.userPermissions.filter(u => u.id !== action.payload);
      if (state.currentUserPermission?.id === action.payload) {
        state.currentUserPermission = null;
      }
    },

    // ========== Teacher Permissions ==========
    setTeacherPermissions: (state, action: PayloadAction<TeacherPermissionResponse>) => {
      state.teacherPermissions = action.payload.teachers || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    setCurrentTeacherPermission: (state, action: PayloadAction<TeacherPermission | null>) => {
      state.currentTeacherPermission = action.payload;
    },
    addTeacherPermission: (state, action: PayloadAction<TeacherPermission>) => {
      const index = state.teacherPermissions.findIndex(t => t.id === action.payload.teacherId);
      if (index !== -1) {
        state.teacherPermissions[index].teacherPermission = action.payload;
      }
    },
    updateTeacherPermissionInList: (state, action: PayloadAction<TeacherPermission>) => {
      const index = state.teacherPermissions.findIndex(t => t.id === action.payload.teacherId);
      if (index !== -1) {
        state.teacherPermissions[index].teacherPermission = action.payload;
      }
      if (state.currentTeacherPermission?.id === action.payload.id) {
        state.currentTeacherPermission = action.payload;
      }
    },
    updateTeacherPermissionStatus: (state, action: PayloadAction<{ teacherId: string; permission: TeacherPermissionKey; value: boolean }>) => {
      const { teacherId, permission, value } = action.payload;
      const index = state.teacherPermissions.findIndex(t => t.id === teacherId);
      if (index !== -1 && state.teacherPermissions[index].teacherPermission) {
        state.teacherPermissions[index].teacherPermission![permission] = value;
      }
      if (state.currentTeacherPermission?.teacherId === teacherId) {
        state.currentTeacherPermission[permission] = value;
      }
    },
    removeTeacherPermission: (state, action: PayloadAction<string>) => {
      state.teacherPermissions = state.teacherPermissions.filter(t => t.id !== action.payload);
      if (state.currentTeacherPermission?.id === action.payload) {
        state.currentTeacherPermission = null;
      }
    },

    // ========== Common ==========
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (state, action: PayloadAction<PermissionPagination>) => {
      state.pagination = action.payload;
    },
    clearPermissions: (state) => {
      state.userPermissions = [];
      state.teacherPermissions = [];
      state.currentUserPermission = null;
      state.currentTeacherPermission = null;
      state.error = null;
      state.pagination = initialState.pagination;
    },
  },
});

// ==================== Actions ====================
export const {
  // User Permissions
  setUserPermissions,
  setCurrentUserPermission,
  addUserPermission,
  updateUserPermissionInList,
  updateUserPermissionStatus,
  removeUserPermission,

  // Teacher Permissions
  setTeacherPermissions,
  setCurrentTeacherPermission,
  addTeacherPermission,
  updateTeacherPermissionInList,
  updateTeacherPermissionStatus,
  removeTeacherPermission,

  // Common
  setLoading,
  setError,
  setPagination,
  clearPermissions,
} = permissionSlice.actions;

// ==================== API Calls ====================

// ========== USER PERMISSION API CALLS ==========

// Get All User Permissions
export const getAllUserPermissionsApiCall = async (
  token: string,
  params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ApiResponse<UserPermissionResponse>> => {
  try {
    const response = await axios.get<ApiResponse<UserPermissionResponse>>(
      `${API_BASE_URL}/user`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to fetch user permissions',
      data: { users: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10, hasNextPage: false, hasPrevPage: false } },
    };
  }
};

// Get User Permission by ID
export const getUserPermissionByIdApiCall = async (
  token: string,
  id: string
): Promise<ApiResponse<UserPermission>> => {
  try {
    const response = await axios.get<ApiResponse<UserPermission>>(
      `${API_BASE_URL}/user/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to fetch user permission',
      data: null as any,
    };
  }
};

// Create User Permission
export const createUserPermissionApiCall = async (
  token: string,
  data: {
    userId: string;
    attendance?: boolean;
    subject?: boolean;
    classes?: boolean;
    exam?: boolean;
    fee?: boolean;
    users?: boolean;
    students?: boolean;
    teachers?: boolean;
  }
): Promise<ApiResponse<UserPermission>> => {
  try {
    const response = await axios.post<ApiResponse<UserPermission>>(
      `${API_BASE_URL}/user`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to create user permission',
      data: null as any,
    };
  }
};

// Update User Permission
export const updateUserPermissionApiCall = async (
  token: string,
  id: string,
  data: {
    attendance?: boolean;
    subject?: boolean;
    classes?: boolean;
    exam?: boolean;
    fee?: boolean;
    users?: boolean;
    students?: boolean;
    teachers?: boolean;
  }
): Promise<ApiResponse<UserPermission>> => {
  try {
    const response = await axios.put<ApiResponse<UserPermission>>(
      `${API_BASE_URL}/user/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to update user permission',
      data: null as any,
    };
  }
};

// Update User Permission Status (Single Permission)
export const updateUserPermissionStatusApiCall = async (
  token: string,
  id: string,
  data: {
    permission: UserPermissionKey;
    value: boolean;
  }
): Promise<ApiResponse<UserPermission>> => {
  try {
    const response = await axios.patch<ApiResponse<UserPermission>>(
      `${API_BASE_URL}/user/${id}/status`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to update user permission status',
      data: null as any,
    };
  }
};

// Delete User Permission
export const deleteUserPermissionApiCall = async (
  token: string,
  id: string
): Promise<ApiResponse<null>> => {
  try {
    const response = await axios.delete<ApiResponse<null>>(
      `${API_BASE_URL}/user/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to delete user permission',
      data: null,
    };
  }
};

// Bulk Create User Permissions
export const bulkCreateUserPermissionsApiCall = async (
  token: string,
  data: {
    permissions: Array<{
      userId: string;
      attendance?: boolean;
      subject?: boolean;
      classes?: boolean;
      exam?: boolean;
      fee?: boolean;
      users?: boolean;
      students?: boolean;
      teachers?: boolean;
    }>;
  }
): Promise<ApiResponse<{
  created: UserPermission[];
  errors: any[];
  total: number;
  successCount: number;
  errorCount: number;
}>> => {
  try {
    const response = await axios.post<ApiResponse<any>>(
      `${API_BASE_URL}/user/bulk`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to create user permissions',
      data: null as any,
    };
  }
};

// ========== TEACHER PERMISSION API CALLS ==========

// Get All Teacher Permissions
export const getAllTeacherPermissionsApiCall = async (
  token: string,
  params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ApiResponse<TeacherPermissionResponse>> => {
  try {
    const response = await axios.get<ApiResponse<TeacherPermissionResponse>>(
      `${API_BASE_URL}/teacher`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to fetch teacher permissions',
      data: { teachers: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10, hasNextPage: false, hasPrevPage: false } },
    };
  }
};

// Get Teacher Permission by ID
export const getTeacherPermissionByIdApiCall = async (
  token: string,
  id: string
): Promise<ApiResponse<TeacherPermission>> => {
  try {
    const response = await axios.get<ApiResponse<TeacherPermission>>(
      `${API_BASE_URL}/teacher/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to fetch teacher permission',
      data: null as any,
    };
  }
};

// Create Teacher Permission
export const createTeacherPermissionApiCall = async (
  token: string,
  data: {
    userId: string;
    teacherId: string;
    attendance?: boolean;
    subject?: boolean;
    classes?: boolean;
    exam?: boolean;
  }
): Promise<ApiResponse<TeacherPermission>> => {
  try {
    const response = await axios.post<ApiResponse<TeacherPermission>>(
      `${API_BASE_URL}/teacher`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to create teacher permission',
      data: null as any,
    };
  }
};

// Update Teacher Permission
export const updateTeacherPermissionApiCall = async (
  token: string,
  id: string,
  data: {
    attendance?: boolean;
    subject?: boolean;
    classes?: boolean;
    exam?: boolean;
  }
): Promise<ApiResponse<TeacherPermission>> => {
  try {
    const response = await axios.put<ApiResponse<TeacherPermission>>(
      `${API_BASE_URL}/teacher/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to update teacher permission',
      data: null as any,
    };
  }
};

// Update Teacher Permission Status (Single Permission)
export const updateTeacherPermissionStatusApiCall = async (
  token: string,
  id: string,
  data: {
    permission: TeacherPermissionKey;
    value: boolean;
  }
): Promise<ApiResponse<TeacherPermission>> => {
  try {
    const response = await axios.patch<ApiResponse<TeacherPermission>>(
      `${API_BASE_URL}/teacher/${id}/status`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to update teacher permission status',
      data: null as any,
    };
  }
};

// Delete Teacher Permission
export const deleteTeacherPermissionApiCall = async (
  token: string,
  id: string
): Promise<ApiResponse<null>> => {
  try {
    const response = await axios.delete<ApiResponse<null>>(
      `${API_BASE_URL}/teacher/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to delete teacher permission',
      data: null,
    };
  }
};

// Bulk Create Teacher Permissions
export const bulkCreateTeacherPermissionsApiCall = async (
  token: string,
  data: {
    permissions: Array<{
      userId: string;
      teacherId: string;
      attendance?: boolean;
      subject?: boolean;
      classes?: boolean;
      exam?: boolean;
    }>;
  }
): Promise<ApiResponse<{
  created: TeacherPermission[];
  errors: any[];
  total: number;
  successCount: number;
  errorCount: number;
}>> => {
  try {
    const response = await axios.post<ApiResponse<any>>(
      `${API_BASE_URL}/teacher/bulk`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.response?.data || {
      success: false,
      message: error.message || 'Failed to create teacher permissions',
      data: null as any,
    };
  }
};

// ==================== Export ====================
export default permissionSlice.reducer;