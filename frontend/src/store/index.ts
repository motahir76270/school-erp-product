import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import studentReducer from './slices/studentSlice';
import teacherReducer from './slices/teacherSlice';
import classReducer from './slices/classSlice';
import attendanceReducer from './slices/attendanceSlice';
import feeReducer from './slices/feeSlice';
import noticeReducer from './slices/noticeSlice';
import examReducer from './slices/examSlice';
import mcqReducer from './slices/mcqSlice';
import settingsReducer from './slices/settingsSlice';
import libraryReducer from './slices/librarySlice';
import uiReducer from './slices/uiSlice';
import subjectsReducer from './slices/subjectsSlice'
import postReducer from './slices/postSlice'
import receiptReducer from './slices/reciptSlice'
import gatewayReducer from './slices/gatewaySlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user:userReducer,
    posts: postReducer,
    student: studentReducer,
    teacher: teacherReducer,
    class: classReducer,
    attendance: attendanceReducer,
    fee: feeReducer,
    receipt: receiptReducer,
    notice: noticeReducer,
    exam: examReducer,
    mcq: mcqReducer,
    settings: settingsReducer,
    library: libraryReducer,
    ui: uiReducer,
    subjects:subjectsReducer,
    gateway:gatewayReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
