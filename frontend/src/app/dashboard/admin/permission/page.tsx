// app/dashboard/admin/settings/permission/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllUserPermissionsApiCall,
  createUserPermissionApiCall,
  updateUserPermissionStatusApiCall,
  deleteUserPermissionApiCall,
  bulkCreateUserPermissionsApiCall,
  setUserPermissions,
  setLoading,
  setError,
  updateUserPermissionStatus,
  removeUserPermission,
  addUserPermission,
} from '@/store/slices/permissionSlice';
import { getAllUsersApiCall, setUsers } from '@/store/slices/userSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import { 
  Shield, 
  Users, 
  UserCog, 
  Search,
  CheckCircle,
  MoreVertical,
  RefreshCw,
  Loader2,
  Save,
  UserPlus,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  id: string;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage: string | null;
  isActive: boolean;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserPermission {
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

interface UserWithPermission extends User {
  userPermission: UserPermission | null;
}

export default function PermissionPage() {
  const dispatch = useAppDispatch();
  const { userPermissions, loading: permissionLoading } = useAppSelector((state: any) => state.permission);
  const { users, loading: userLoading } = useAppSelector((state: any) => state.user);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkPermissions, setBulkPermissions] = useState<{
    [key: string]: boolean;
  }>({
    attendance: false,
    subject: false,
    classes: false,
    exam: false,
    fee: false,
    users: false,
    students: false,
    teachers: false,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Create permission form
  const [createForm, setCreateForm] = useState({
    userId: '',
    attendance: false,
    subject: false,
    classes: false,
    exam: false,
    fee: false,
    users: false,
    students: false,
    teachers: false,
  });

  // Permission labels for display
  const permissionLabels: Record<string, string> = {
    attendance: 'Attendance',
    subject: 'Subject',
    classes: 'Classes',
    exam: 'Exam',
    fee: 'Fee',
    users: 'Users',
    students: 'Students',
    teachers: 'Teachers',
  };

  // Fetch Users for dropdown
  const fetchUsers = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getAllUsersApiCall(token, 1, '');
      if (data?.success === true) {
        let usersData = [];
        if (data?.data?.data && Array.isArray(data.data.data)) {
          usersData = data.data.data;
        } else if (data?.data && Array.isArray(data.data)) {
          usersData = data.data;
        } else {
          usersData = [];
        }
        dispatch(setUsers(usersData));
      }
    } catch (error: any) {
      console.error('Fetch users error:', error);
    }
  };

  // Fetch User Permissions - This API returns users with their permissions
  const fetchPermissions = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const data = await getAllUserPermissionsApiCall(token, {
        page: page,
        search: search || undefined,
        limit: 10,
      });

      console.log('Permissions API Response:', data);

      if (data?.success) {
        // The API returns users with their permissions
        dispatch(setUserPermissions(data.data));
      } else {
        toast.error(data?.message || 'Failed to fetch permissions');
        dispatch(setError(data?.message || 'Failed to fetch permissions'));
      }
    } catch (error: any) {
      console.error('Fetch permissions error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch permissions');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch permissions'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Get users with permissions from the API response
  const usersWithPermissions: UserWithPermission[] = userPermissions?.users || [];

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, [page, search]);

  // Handle toggle single permission
  const handleTogglePermission = async (
    userId: string,
    permission: string,
    currentValue: boolean
  ) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    // Find existing permission for this user
    const user = usersWithPermissions.find((u: UserWithPermission) => u.id === userId);
    const existingPermission = user?.userPermission || null;

    setIsSubmitting(true);
    try {
      if (existingPermission) {
        // Update existing permission
        const data = await updateUserPermissionStatusApiCall(token, existingPermission.id, {
          permission: permission as any,
          value: !currentValue,
        });

        if (data?.success) {
          toast.success(data?.message || `Permission ${!currentValue ? 'enabled' : 'disabled'}`);
          await fetchPermissions();
        } else {
          toast.error(data?.message || 'Failed to update permission');
        }
      } else {
        // Create new permission for user
        const newPermission = {
          userId,
          attendance: permission === 'attendance' ? !currentValue : false,
          subject: permission === 'subject' ? !currentValue : false,
          classes: permission === 'classes' ? !currentValue : false,
          exam: permission === 'exam' ? !currentValue : false,
          fee: permission === 'fee' ? !currentValue : false,
          users: permission === 'users' ? !currentValue : false,
          students: permission === 'students' ? !currentValue : false,
          teachers: permission === 'teachers' ? !currentValue : false,
        };

        const data = await createUserPermissionApiCall(token, newPermission);
        if (data?.success) {
          toast.success(data?.message || 'Permission created successfully');
          await fetchPermissions();
        } else {
          toast.error(data?.message || 'Failed to create permission');
        }
      }
    } catch (error: any) {
      console.error('Toggle permission error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update permission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create permission
  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.userId) {
      toast.error('Please select a user');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await createUserPermissionApiCall(token, {
        userId: createForm.userId,
        attendance: createForm.attendance,
        subject: createForm.subject,
        classes: createForm.classes,
        exam: createForm.exam,
        fee: createForm.fee,
        users: createForm.users,
        students: createForm.students,
        teachers: createForm.teachers,
      });

      if (data?.success) {
        toast.success(data?.message || 'Permission created successfully');
        setIsCreateModalOpen(false);
        setCreateForm({
          userId: '',
          attendance: false,
          subject: false,
          classes: false,
          exam: false,
          fee: false,
          users: false,
          students: false,
          teachers: false,
        });
        await fetchPermissions();
      } else {
        toast.error(data?.message || 'Failed to create permission');
      }
    } catch (error: any) {
      console.error('Create permission error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create permission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk create permissions
  const handleBulkCreatePermissions = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    try {
      const permissions = selectedUsers.map(userId => ({
        userId,
        attendance: bulkPermissions.attendance,
        subject: bulkPermissions.subject,
        classes: bulkPermissions.classes,
        exam: bulkPermissions.exam,
        fee: bulkPermissions.fee,
        users: bulkPermissions.users,
        students: bulkPermissions.students,
        teachers: bulkPermissions.teachers,
      }));

      const data = await bulkCreateUserPermissionsApiCall(token, { permissions });

      if (data?.success) {
        toast.success(data?.message || 'Permissions created successfully');
        setIsBulkModalOpen(false);
        setSelectedUsers([]);
        setBulkPermissions({
          attendance: false,
          subject: false,
          classes: false,
          exam: false,
          fee: false,
          users: false,
          students: false,
          teachers: false,
        });
        await fetchPermissions();
      } else {
        toast.error(data?.message || 'Failed to create permissions');
      }
    } catch (error: any) {
      console.error('Bulk create error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete permission
  const handleDeletePermission = async (permissionId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete permissions for ${userName}?`)) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await deleteUserPermissionApiCall(token, permissionId);
      if (data?.success) {
        toast.success(data?.message || 'Permission deleted successfully');
        await fetchPermissions();
      } else {
        toast.error(data?.message || 'Failed to delete permission');
      }
    } catch (error: any) {
      console.error('Delete permission error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete permission');
    }
  };

  // Toggle user selection for bulk
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;

  // Get permission count
  const getPermissionCount = (permission: UserPermission | null) => {
    if (!permission) return 0;
    const keys = ['attendance', 'subject', 'classes', 'exam', 'fee', 'users', 'students', 'teachers'];
    return keys.filter(key => permission[key as keyof UserPermission] === true).length;
  };

  // Check if all permissions are enabled
  const areAllPermissionsEnabled = (permission: UserPermission | null) => {
    if (!permission) return false;
    const keys = ['attendance', 'subject', 'classes', 'exam', 'fee', 'users', 'students', 'teachers'];
    return keys.every(key => permission[key as keyof UserPermission] === true);
  };

  const loading = permissionLoading || userLoading;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Permissions" 
        description="Manage user permissions and access control"
      >
      </PageHeader>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              fetchPermissions();
              fetchUsers();
            }} 
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </Button>
          <Button size="sm" onClick={() => setIsBulkModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Bulk Assign
          </Button>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{usersWithPermissions.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Permissions</p>
                <p className="text-2xl font-bold">
                  {usersWithPermissions.filter(u => u.userPermission).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">
                  {usersWithPermissions.filter(u => u.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Permissions</p>
                <p className="text-2xl font-bold">
                  {usersWithPermissions.reduce((acc, u) => acc + getPermissionCount(u.userPermission), 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserCog className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>Manage permissions for each user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === usersWithPermissions.length && usersWithPermissions.length > 0}
                      onChange={() => {
                        if (selectedUsers.length === usersWithPermissions.length) {
                          setSelectedUsers([]);
                        } else {
                          setSelectedUsers(usersWithPermissions.map(u => u.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading permissions...
                    </TableCell>
                  </TableRow>
                ) : usersWithPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  usersWithPermissions.map((user) => {
                    const permission = user.userPermission;
                    const hasPermission = !!permission;
                    
                    return (
                      <TableRow key={user.id}>
                        {/* Checkbox */}
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>

                        {/* User Info */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={user.profileImage ? `${baseURl}/${user.profileImage}` : undefined} 
                                alt={`${user.firstName} ${user.lastName}`}
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.firstName, user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge variant="outline">
                            {user.role?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>

                        {/* Permission Switches */}
                        {['attendance', 'subject', 'classes', 'exam', 'fee', 'users', 'students', 'teachers'].map((perm) => (
                          <TableCell key={perm}>
                            <Switch
                              checked={hasPermission ? permission[perm as keyof UserPermission] || false : false}
                              onCheckedChange={() => 
                                handleTogglePermission(
                                  user.id,
                                  perm,
                                  hasPermission ? permission[perm as keyof UserPermission] || false : false
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </TableCell>
                        ))}

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {hasPermission && (
                                <>
                                  <DropdownMenuItem>
                                    <span className="text-xs text-muted-foreground">
                                      {getPermissionCount(permission)} of 8 permissions
                                    </span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const allEnabled = areAllPermissionsEnabled(permission);
                                      const keys = ['attendance', 'subject', 'classes', 'exam', 'fee', 'users', 'students', 'teachers'];
                                      keys.forEach((p) => {
                                        handleTogglePermission(
                                          user.id,
                                          p,
                                          hasPermission ? permission[p as keyof UserPermission] || false : false
                                        );
                                      });
                                    }}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {areAllPermissionsEnabled(permission) ? 'Disable All' : 'Enable All'}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (hasPermission) {
                                    handleDeletePermission(permission.id, `${user.firstName} ${user.lastName}`);
                                  } else {
                                    toast.info('No permissions to delete for this user');
                                  }
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Permissions
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Permission Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create User Permission</DialogTitle>
            <DialogDescription>
              Assign permissions to a specific user
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePermission} className="space-y-4">
            {/* User Selection */}
            <div className="space-y-2">
              <Label>Select User <span className="text-red-500">*</span></Label>
              <Select
                value={createForm.userId}
                onValueChange={(value) => setCreateForm({ ...createForm, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.profileImage ? `${baseURl}/${user.profileImage}` : undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-muted-foreground">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permission Toggles */}
            <div className="grid grid-cols-2 gap-4">
              {['attendance', 'subject', 'classes', 'exam', 'fee', 'users', 'students', 'teachers'].map((perm) => (
                <div key={perm} className="flex items-center justify-between p-2 border rounded-lg">
                  <Label className="capitalize">{permissionLabels[perm]}</Label>
                  <Switch
                    checked={createForm[perm as keyof typeof createForm] as boolean}
                    onCheckedChange={(checked) => 
                      setCreateForm({ ...createForm, [perm]: checked })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateForm({
                    userId: '',
                    attendance: false,
                    subject: false,
                    classes: false,
                    exam: false,
                    fee: false,
                    users: false,
                    students: false,
                    teachers: false,
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Permission
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Permissions Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Assign Permissions</DialogTitle>
            <DialogDescription>
              Select permissions to assign to selected users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Selected Users Count */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Selected Users: {selectedUsers.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedUsers.length === 0 ? 'Please select users from the table above' : 'Click to assign permissions to selected users'}
              </p>
            </div>

            {/* Permission Toggles */}
            <div className="grid grid-cols-2 gap-4">
              {['attendance', 'subject', 'classes', 'exam', 'fee', 'users', 'students', 'teachers'].map((perm) => (
                <div key={perm} className="flex items-center justify-between p-2 border rounded-lg">
                  <Label className="capitalize">{permissionLabels[perm]}</Label>
                  <Switch
                    checked={bulkPermissions[perm] || false}
                    onCheckedChange={(checked) => 
                      setBulkPermissions(prev => ({ ...prev, [perm]: checked }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* Quick Select All */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const allEnabled = Object.values(bulkPermissions).every(v => v === true);
                const newState = Object.keys(bulkPermissions).reduce((acc, key) => {
                  acc[key] = !allEnabled;
                  return acc;
                }, {} as { [key: string]: boolean });
                setBulkPermissions(newState);
              }}
            >
              {Object.values(bulkPermissions).every(v => v === true) ? 'Deselect All' : 'Select All'}
            </Button>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setSelectedUsers([]);
                  setBulkPermissions({
                    attendance: false,
                    subject: false,
                    classes: false,
                    exam: false,
                    fee: false,
                    users: false,
                    students: false,
                    teachers: false,
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleBulkCreatePermissions}
                disabled={isSubmitting || selectedUsers.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Assign Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}