'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, User, RefreshCw, Edit2, MoreVertical, LogIn, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllUsersApiCall,
  createUserApiCall,
  deleteUserApiCall,
  updateUserRoleApiCall,
  updateUserApiCall,
  getUserByIdApiCall,
  toggleUserStatusApiCall,
  setUsers,
  setLoading,
} from '@/store/slices/userSlice';
import { setUser, setToken, setAuthenticated } from '@/store/slices/authSlice';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  userId: string | null;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'student';
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  resetPasswordToken: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export default function UsersPage() {
  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { users, loading } = useAppSelector((state) => state.user);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
  });
  
  // Create user form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin' as 'super_admin' | 'admin' | 'teacher' | 'student',
    phone: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'admin' as 'super_admin' | 'admin' | 'teacher' | 'student',
    phone: '',
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  const fetchUsers = async (page: number = currentPage) => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const data = await getAllUsersApiCall(token, page, search);
      console.log('API Response:', data); // Debug log
      
      if (data?.success === true) {
        let usersData = [];
        let paginationData = { page: 1, limit: 10 };
        
        // Handle the response structure: data.data.data is the users array
        if (data?.data?.data && Array.isArray(data.data.data)) {
          usersData = data.data.data;
          paginationData = {
            page: data.data.page || 1,
            limit: data.data.limit || 10,
          };
        } else if (data?.data && Array.isArray(data.data)) {
          usersData = data.data;
        } else if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          usersData = [data.data];
        } else {
          usersData = [];
        }
        
        console.log('Processed users:', usersData); // Debug log
        dispatch(setUsers(usersData));
        setPagination(paginationData);
      } else {
        toast.error(data?.message || 'Failed to fetch users');
        dispatch(setUsers([]));
      }
    } catch (error: any) {
      console.error('Fetch users error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch users');
      dispatch(setUsers([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [search, currentPage]);

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    
    const query = search.toLowerCase().trim();
    if (!query) return users;
    
    return users.filter((user: User) => {
      const searchString = [
        user.firstName, 
        user.lastName, 
        user.email, 
        user.role,
        user.phone || ''
      ]
        .join(' ')
        .toLowerCase();
      return searchString.includes(query);
    });
  }, [search, users]);

  // Create User
  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('role', form.role);
      if (form.phone) formData.append('phone', form.phone);
      if (avatarFile) formData.append('profileImage', avatarFile);

      const data = await createUserApiCall(token, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'User created successfully');
        setForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'admin',
          phone: '',
        });
        setAvatarFile(null);
        setIsCreateModalOpen(false);
        await fetchUsers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to create user');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User
  const handleDelete = async (userId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const data = await deleteUserApiCall(token, userId);
      if (data?.success === true) {
        toast.success(data?.message || 'User deleted successfully');
        await fetchUsers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    }
  };

  // Update User Role
  const handleRoleChange = async (userId: string, newRole: 'super_admin' | 'admin' | 'teacher' | 'student') => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await updateUserRoleApiCall(token, { userId, role: newRole });
      if (data?.success === true) {
        toast.success(data?.message || 'User role updated successfully');
        await fetchUsers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update user role');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update user role');
    }
  };

  // Toggle User Status
  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await toggleUserStatusApiCall(token, userId, isActive);
      if (data?.success === true) {
        toast.success(data?.message || `User ${isActive ? 'activated' : 'deactivated'} successfully`);
        await fetchUsers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update user status');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update user status');
    }
  };

  // Open edit modal with user data
  const handleEditClick = async (user: User) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getUserByIdApiCall(token, user.id);
      if (data?.success === true) {
        const userData = data.data.user;
        setEditingUser(userData);
        setEditForm({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          phone: userData.phone || '',
        });
        setCurrentAvatar(userData.profileImage);
        setEditAvatarFile(null);
        setIsEditModalOpen(true);
      } else {
        toast.error(data?.message || 'Failed to fetch user details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch user details');
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    
    setIsEditSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsEditSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('firstName', editForm.firstName);
      formData.append('lastName', editForm.lastName);
      formData.append('email', editForm.email);
      formData.append('role', editForm.role);
      if (editForm.phone) formData.append('phone', editForm.phone);
      if (editAvatarFile) formData.append('profileImage', editAvatarFile);

      const data = await updateUserApiCall(token, editingUser.id, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'User updated successfully');
        setIsEditModalOpen(false);
        setEditingUser(null);
        setEditAvatarFile(null);
        setCurrentAvatar(null);
        await fetchUsers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update user');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Login as User
const handleLoginAsUser = async (user: User) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    toast.error("No authentication token found");
    return;
  }

  try {
    const data = await getUserByIdApiCall(token, user.id);

    if (data?.success) {
      // Save the impersonation token
      localStorage.setItem("accessToken", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      dispatch(setUser(data.data.user));
      dispatch(setToken(data.data.token));
      dispatch(setAuthenticated(true));

      toast.success(
        `Logged in as ${data.data.user.firstName} ${data.data.user.lastName}`
      );

      const role = data.data.user.role;

      const dashboardRoutes: Record<string, string> = {
        super_admin: "/dashboard/admin",
        admin: "/dashboard/admin",
        teacher: "/dashboard/teacher",
        student: "/dashboard/student",
      };

      const route = dashboardRoutes[role];

      if (route) {
        window.open(route, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Invalid user role");
      }
    } else {
      toast.error(data?.message || "Failed to login as user");
    }
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to login as user"
    );
  }
};

  // Reset create form modal
  const resetCreateForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'admin',
      phone: '',
    });
    setAvatarFile(null);
    setIsCreateModalOpen(false);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (users && users.length === pagination.limit) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage admin, student, teacher, and other platform users." />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage all platform users</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchUsers(currentPage)} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              placeholder="Search users by name, email, or role"
              className="pl-9"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : !filteredUsers || filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                            {user.profileImage ? (
                              <Image
                                src={`${baseURl}/${user.profileImage}`}
                                alt={`${user.firstName} ${user.lastName}`}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: 'super_admin' | 'admin' | 'teacher' | 'student') =>
                            handleRoleChange(user.id, value)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>  
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.isActive ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(user.id, !user.isActive)}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleLoginAsUser(user)}>
                              <LogIn className="mr-2 h-4 w-4" />
                              Login as User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user.id, !user.isActive)}
                              className="text-blue-600"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && users && users.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} • Showing {users.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={users.length < pagination.limit}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                <Select
                  value={form.role}
                  onValueChange={(value: 'super_admin' | 'admin') =>
                    setForm({ ...form, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile image</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
              {avatarFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {avatarFile.name}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={resetCreateForm}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Upload a new image to change the profile picture.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First name <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last name <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role <span className="text-destructive">*</span></Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: 'super_admin' | 'admin' | 'teacher' | 'student') =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
             
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-avatar">Profile image</Label>
              <Input
                id="edit-avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)}
              />
              {currentAvatar && !editAvatarFile && (
                <div className="flex items-center gap-2">
                  <Image
                    src={`${baseURl}${currentAvatar}`}
                    alt="Current profile"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <p className="text-sm text-muted-foreground">
                    Current: {currentAvatar.split('/').pop()}
                  </p>
                </div>
              )}
              {editAvatarFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {editAvatarFile.name}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                  setEditAvatarFile(null);
                  setCurrentAvatar(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isEditSubmitting}>
                {isEditSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}