// src/routes/postRoutes.js
import express from "express";
import multer from "multer";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts,
} from "../../controllers/post/postController.service.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import upload from "../../config/uploadFile.js";

const postRouter = express.Router();


// ==================== POST ROUTES ====================
// Get all posts (public)
postRouter.get("/", authMiddleware, getAllPosts);

// Get user posts
postRouter.get("/user/:userId", authMiddleware, getUserPosts);

// Create post
postRouter.post("/", authMiddleware, upload.single("post"), createPost);

// Get post by ID
postRouter.get("/post/:id", authMiddleware, getPostById);

// Update post
postRouter.put("/post/:id", authMiddleware, upload.single("post"), updatePost);

// Delete post
postRouter.delete("/post/:id", authMiddleware, deletePost);

// Like post
postRouter.post("/post/:id/like", authMiddleware, likePost);

// Unlike post
postRouter.delete("/post/:id/like", authMiddleware, unlikePost);

export default postRouter;