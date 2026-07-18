// store/slices/postSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// ==================== Types ====================
interface Post {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  image: string | null;
  likes: number;
  likeCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PostsState {
  posts: Post[];
  currentPost: Post | any;
  userPosts: Post[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== Initial State ====================
const initialState: PostsState = {
  posts: [],
  currentPost: '',
  userPosts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// ==================== Slice ====================
const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload.posts || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    setUserPosts: (state, action) => {
      state.userPosts = action.payload.posts || [];
      state.pagination = action.payload.pagination || initialState.pagination;
    },
    addPost: (state, action) => {
      state.posts = [action.payload, ...state.posts];
    },
    updatePostInList: (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
      if (state.currentPost?.id === action.payload.id) {
        state.currentPost = action.payload;
      }
    },
    removePostFromList: (state, action) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
      state.userPosts = state.userPosts.filter(post => post.id !== action.payload);
      if (state.currentPost?.id === action.payload) {
        state.currentPost = null;
      }
    },
    updatePostLikes: (state, action) => {
      const { postId, likeCount, isLiked } = action.payload;
      
      // Update in posts list
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex].likeCount = likeCount;
        state.posts[postIndex].isLiked = isLiked;
        state.posts[postIndex].likes = likeCount;
      }
      
      // Update in userPosts list
      const userPostIndex = state.userPosts.findIndex(post => post.id === postId);
      if (userPostIndex !== -1) {
        state.userPosts[userPostIndex].likeCount = likeCount;
        state.userPosts[userPostIndex].isLiked = isLiked;
        state.userPosts[userPostIndex].likes = likeCount;
      }
      
      // Update current post
      if (state.currentPost?.id === postId) {
        state.currentPost.likeCount = likeCount;
        state.currentPost.isLiked = isLiked;
        state.currentPost.likes = likeCount;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.currentPost = null;
      state.userPosts = [];
      state.error = null;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
  },
});

// ==================== Actions ====================
export const {
  setPosts,
  setCurrentPost,
  setUserPosts,
  addPost,
  updatePostInList,
  removePostFromList,
  updatePostLikes,
  setLoading,
  setError,
  clearPosts,
  clearCurrentPost,
} = postSlice.actions;

// ==================== API Calls ====================

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/posts`;

// Create Post
export const createPostApiCall = async (token: string, formData: FormData) => {
  const { data } = await axios.post(`${API_BASE_URL}/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Get All Posts
export const getAllPostsApiCall = async (token: string, page: number = 1, limit: number = 10) => {
  const { data } = await axios.get(`${API_BASE_URL}/?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get Post By ID
export const getPostByIdApiCall = async (token: string, postId: string) => {
  const { data } = await axios.get(`${API_BASE_URL}/post/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Get User Posts
export const getUserPostsApiCall = async (token: string, userId: string, page: number = 1, limit: number = 10) => {
  const { data } = await axios.get(`${API_BASE_URL}/user/${userId}?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Update Post
export const updatePostApiCall = async (token: string, postId: string, formData: FormData) => {
  const { data } = await axios.put(`${API_BASE_URL}/post/${postId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Delete Post
export const deletePostApiCall = async (token: string, postId: string) => {
  const { data } = await axios.delete(`${API_BASE_URL}/post/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Like Post
export const likePostApiCall = async (token: string, postId: string) => {
  const { data } = await axios.post(`${API_BASE_URL}/post/${postId}/like`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Unlike Post
export const unlikePostApiCall = async (token: string, postId: string) => {
  const { data } = await axios.delete(`${API_BASE_URL}/post/${postId}/like`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// ==================== Export ====================
export default postSlice.reducer;