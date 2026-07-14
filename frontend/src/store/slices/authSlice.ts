// store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';


const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/auth`;

// ==================== Slice ====================

const authSlice = createSlice({
  name: 'auth',
  initialState:{
    user: null,
    token: null,
    isAuthenticated: false
  },
  reducers: {
    setUser:(state,action)=> {
      state.user = action.payload;
    }
}
});

// ==================== Actions ====================
export const { 
  setUser
} = authSlice.actions;


// ==================== Export ====================
export default authSlice.reducer;