// src/controllers/postController.js
import { eq, desc, count, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import { posts, postLikes } from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";

// ==================== CREATE POST ====================
export const createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!title) {
      return errorResponse(res, "Title is required", 400);
    }

    const image = req.file;
    const imagePath = image ? image.path.replace(/\\/g, "/") : null;

    const postId = uuidv4();

    await db.insert(posts).values({
      id: postId,
      userId,
      title,
      description: description || null,
      image: imagePath,
      likes: 0,
    });

    const [newPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    // Get like count and user's like status
    const [likeCount] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    const [userLike] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )
      )
      .limit(1);

    const postData = {
      ...newPost,
      likeCount: likeCount?.count || 0,
      isLiked: !!userLike,
    };

    return successResponse(
      res,
      postData,
      "Post created successfully",
      201,
    );
  } catch (error) {
    console.error("Create post error:", error);
    return errorResponse(res, error.message || "Failed to create post", 500);
  }
};

// ==================== GET ALL POSTS ====================
export const getAllPosts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get all posts with pagination
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(posts);

    const total = totalResult?.total || 0;

    // Get like counts and user's like status for each post
    const postsWithDetails = await Promise.all(
      allPosts.map(async (post) => {
        const [likeCount] = await db
          .select({ count: count() })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));

        let isLiked = false;
        if (userId) {
          const [userLike] = await db
            .select()
            .from(postLikes)
            .where(
              and(
                eq(postLikes.postId, post.id),
                eq(postLikes.userId, userId)
              )
            )
            .limit(1);
          isLiked = !!userLike;
        }

        return {
          ...post,
          likeCount: likeCount?.count || 0,
          isLiked,
        };
      })
    );

    return successResponse(
      res,
      {
        posts: postsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Posts fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get all posts error:", error);
    return errorResponse(res, error.message || "Failed to get posts", 500);
  }
};

// ==================== GET POST BY ID ====================
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return errorResponse(res, "Post ID is required", 400);
    }

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!post) {
      return errorResponse(res, "Post not found", 404);
    }

    // Get like count
    const [likeCount] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, id));

    // Check if user liked the post
    let isLiked = false;
    if (userId) {
      const [userLike] = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, id),
            eq(postLikes.userId, userId)
          )
        )
        .limit(1);
      isLiked = !!userLike;
    }

    const postData = {
      ...post,
      likeCount: likeCount?.count || 0,
      isLiked,
    };

    return successResponse(
      res,
      postData,
      "Post fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get post error:", error);
    return errorResponse(res, error.message || "Failed to get post", 500);
  }
};

// ==================== UPDATE POST ====================
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { title, description } = req.body;
    const image = req.file;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Post ID is required", 400);
    }

    // Check if post exists and belongs to user
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existingPost) {
      return errorResponse(res, "Post not found", 404);
    }

    if (existingPost.userId !== userId) {
      return errorResponse(res, "You can only update your own posts", 403);
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image) {
      updateData.image = image.path.replace(/\\/g, "/");
    }
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, id));

    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    // Get like count and user's like status
    const [likeCount] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, id));

    const [userLike] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, id),
          eq(postLikes.userId, userId)
        )
      )
      .limit(1);

    const postData = {
      ...updatedPost,
      likeCount: likeCount?.count || 0,
      isLiked: !!userLike,
    };

    return successResponse(
      res,
      postData,
      "Post updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update post error:", error);
    return errorResponse(res, error.message || "Failed to update post", 500);
  }
};

// ==================== DELETE POST ====================
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Post ID is required", 400);
    }

    // Check if post exists and belongs to user
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existingPost) {
      return errorResponse(res, "Post not found", 404);
    }

    if (existingPost.userId !== userId) {
      return errorResponse(res, "You can only delete your own posts", 403);
    }

    // Delete post (likes will be cascade deleted)
    await db.delete(posts).where(eq(posts.id, id));

    return successResponse(
      res,
      null,
      "Post deleted successfully",
      200,
    );
  } catch (error) {
    console.error("Delete post error:", error);
    return errorResponse(res, error.message || "Failed to delete post", 500);
  }
};

// ==================== LIKE POST ====================
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Post ID is required", 400);
    }

    // Check if post exists
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!post) {
      return errorResponse(res, "Post not found", 404);
    }

    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, id),
          eq(postLikes.userId, userId)
        )
      )
      .limit(1);

    if (existingLike) {
      return errorResponse(res, "You already liked this post", 400);
    }

    // Create like
    const likeId = uuidv4();
    await db.insert(postLikes).values({
      id: likeId,
      postId: id,
      userId,
    });

    // Increment likes count on post
    await db
      .update(posts)
      .set({
        likes: sql`${posts.likes} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

    // Get updated like count
    const [likeCount] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, id));

    // Get updated post
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    return successResponse(
      res,
      {
        postId: id,
        likeCount: likeCount?.count || 0,
        isLiked: true,
        post: updatedPost,
      },
      "Post liked successfully",
      200,
    );
  } catch (error) {
    console.error("Like post error:", error);
    return errorResponse(res, error.message || "Failed to like post", 500);
  }
};

// ==================== UNLIKE POST ====================
export const unlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Post ID is required", 400);
    }

    // Check if post exists
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!post) {
      return errorResponse(res, "Post not found", 404);
    }

    // Check if like exists
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, id),
          eq(postLikes.userId, userId)
        )
      )
      .limit(1);

    if (!existingLike) {
      return errorResponse(res, "You haven't liked this post", 400);
    }

    // Delete like
    await db
      .delete(postLikes)
      .where(
        and(
          eq(postLikes.postId, id),
          eq(postLikes.userId, userId)
        )
      );

    // Decrement likes count on post
    await db
      .update(posts)
      .set({
        likes: sql`${posts.likes} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

    // Get updated like count
    const [likeCount] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, id));

    // Get updated post
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    return successResponse(
      res,
      {
        postId: id,
        likeCount: likeCount?.count || 0,
        isLiked: false,
        post: updatedPost,
      },
      "Post unliked successfully",
      200,
    );
  } catch (error) {
    console.error("Unlike post error:", error);
    return errorResponse(res, error.message || "Failed to unlike post", 500);
  }
};

// ==================== GET USER POSTS ====================
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    // Get user's posts
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(posts)
      .where(eq(posts.userId, userId));

    const total = totalResult?.total || 0;

    // Get like counts and user's like status for each post
    const postsWithDetails = await Promise.all(
      userPosts.map(async (post) => {
        const [likeCount] = await db
          .select({ count: count() })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));

        let isLiked = false;
        if (currentUserId) {
          const [userLike] = await db
            .select()
            .from(postLikes)
            .where(
              and(
                eq(postLikes.postId, post.id),
                eq(postLikes.userId, currentUserId)
              )
            )
            .limit(1);
          isLiked = !!userLike;
        }

        return {
          ...post,
          likeCount: likeCount?.count || 0,
          isLiked,
        };
      })
    );

    return successResponse(
      res,
      {
        posts: postsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "User posts fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get user posts error:", error);
    return errorResponse(res, error.message || "Failed to get user posts", 500);
  }
};