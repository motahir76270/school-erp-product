// app/dashboard/posts/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllPostsApiCall,
  createPostApiCall,
  updatePostApiCall,
  deletePostApiCall,
  setPosts,
  setLoading,
  setError,
  addPost,
  updatePostInList,
  removePostFromList,
} from '@/store/slices/postSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, RefreshCw, Eye, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';

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

// ==================== Zod Schema ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const postSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .nonempty('Title is required'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  post: z
    .any()
    .optional()
    .nullable()
    .refine(
      (file) => {
        if (!file || file.length === 0) return true;
        return file[0]?.size <= MAX_FILE_SIZE;
      },
      { message: 'Image size must be less than 5MB' }
    )
    .refine(
      (file) => {
        if (!file || file.length === 0) return true;
        return ACCEPTED_IMAGE_TYPES.includes(file[0]?.type);
      },
      { message: 'Only JPEG, PNG, GIF, and WEBP images are allowed' }
    ),
});

type PostFormData = z.infer<typeof postSchema>;

export default function SchoolPost() {
  const dispatch = useAppDispatch();
  const { posts, loading } = useAppSelector((state) => state.posts);
  
  // State
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  
  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // View Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  // ==================== React Hook Form ====================
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      description: '',
      post: null,
    },
  });

  // Watch post field for preview
  const postFile = watch('post');

  // Update image preview when file changes
  useEffect(() => {
    if (postFile && postFile.length > 0) {
      const file = postFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }, [postFile]);

  // Fetch Posts
  const fetchPosts = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const data = await getAllPostsApiCall(token);
      if (data?.success) {
        dispatch(setPosts({ posts: data.data.posts || [], pagination: data.data.pagination }));
      } else {
        toast.error(data?.message || 'Failed to fetch posts');
        dispatch(setError(data?.message || 'Failed to fetch posts'));
      }
    } catch (error: any) {
      console.error('Fetch posts error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch posts');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch posts'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ==================== Handle Create/Edit Post ====================
  const onSubmit = async (data: PostFormData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append('title', data.title);
      submitFormData.append('description', data.description || '');
      
      // Only append image if a new file is selected
      if (data.post && data.post.length > 0) {
        submitFormData.append('post', data.post[0]);
      }

      let response;
      if (isEditing && selectedPost) {
        response = await updatePostApiCall(token, selectedPost.id, submitFormData);
      } else {
        response = await createPostApiCall(token, submitFormData);
      }

      if (response?.success) {
        toast.success(response?.message || `Post ${isEditing ? 'updated' : 'created'} successfully`);
        if (isEditing && selectedPost) {
          dispatch(updatePostInList(response.data));
        } else {
          dispatch(addPost(response.data));
        }
        resetForm();
        setIsModalOpen(false);
        await fetchPosts();
      } else {
        toast.error(response?.message || `Failed to ${isEditing ? 'update' : 'create'} post`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error?.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} post`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Post
  const handleDelete = async () => {
    if (!postToDelete) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await deletePostApiCall(token, postToDelete);
      if (data?.success) {
        toast.success('Post deleted successfully');
        dispatch(removePostFromList(postToDelete));
        setIsDeleteDialogOpen(false);
        setPostToDelete(null);
        await fetchPosts();
      } else {
        toast.error(data?.message || 'Failed to delete post');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete post');
    }
  };

  // Handle Edit
  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setCurrentImage(post.image);
    reset({
      title: post.title,
      description: post.description || '',
      post: null,
    });
    setImagePreview(post.image ? `${process.env.NEXT_PUBLIC_BASE_URL}/${post.image}` : null);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Handle View
  const handleView = (post: Post) => {
    setViewingPost(post);
    setIsViewModalOpen(true);
  };

  // Reset Form
  const resetForm = () => {
    reset({
      title: '',
      description: '',
      post: null,
    });
    setImagePreview(null);
    setCurrentImage(null);
    setSelectedPost(null);
    setIsEditing(false);
  };

  // Handle Image Remove
  const handleRemoveImage = () => {
    setValue('post', null);
    setImagePreview(null);
    setCurrentImage(null);
  };

  // Filter Posts
  const filteredPosts = posts.filter((post: Post) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      post.title.toLowerCase().includes(query) ||
      (post.description && post.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="School Posts" 
        description="Manage school announcements and posts."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Posts</CardTitle>
            <CardDescription>Create, edit, and manage school posts</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPosts} 
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts by title or description..."
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead className="w-[80px]">Likes</TableHead>
                  <TableHead className="w-[120px]">Created At</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading posts...
                    </TableCell>
                  </TableRow>
                ) : filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {search ? 'No posts found matching your search' : 'No posts created yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post: Post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium truncate max-w-[180px]">
                        {post.title}
                      </TableCell>
                      <TableCell className="truncate max-w-[200px]">
                        {post.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        {post.image ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{post.likes || post.likeCount || 0}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(post)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(post)}
                            className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPostToDelete(post.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the post details below.' 
                : 'Fill in the details to create a new post.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter post title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Enter post description"
                rows={4}
                className={`flex w-full rounded-md border ${errors.description ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Image Field */}
            <div className="space-y-2">
              <Label htmlFor="post">Image</Label>
              <Input
                id="post"
                type="file"
                accept="image/*"
                {...register('post')}
                className={`cursor-pointer ${errors.post ? 'border-red-500' : ''}`}
              />
              {errors.post && (
                <p className="text-sm text-red-500">{errors.post.message as string}</p>
              )}
              
              {/* Image Preview */}
              {(imagePreview || currentImage) && (
                <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border bg-gray-50">
                  <Image
                    src={
                        `${process.env.NEXT_PUBLIC_BASE_URL_FILE}/${currentImage}`}
                    width={400}
                    height={300}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {currentImage && !imagePreview && (
                    <p className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                      Current Image
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              View complete post information
            </DialogDescription>
          </DialogHeader>
          {viewingPost && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Title</Label>
                <p className="text-lg font-semibold">{viewingPost.title}</p>
              </div>
              
              {viewingPost.description && (
                <div>
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                    {viewingPost.description}
                  </p>
                </div>
              )}

              {viewingPost.image && (
                <div>
                  <Label className="text-muted-foreground text-sm">Image</Label>
                  <div className="mt-2 relative w-full h-64 rounded-lg overflow-hidden border bg-gray-50">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_BASE_URL_FILE}/${viewingPost.image}`}
                      width={400}
                      height={300}
                      alt={viewingPost.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <Label className="text-muted-foreground text-sm">Likes</Label>
                  <p className="font-medium text-lg">{viewingPost.likes || viewingPost.likeCount || 0}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <Label className="text-muted-foreground text-sm">Created At</Label>
                  <p className="font-medium">
                    {new Date(viewingPost.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(viewingPost);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Post
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the post
              and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setPostToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}