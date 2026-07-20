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
  X,
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

interface UserWithPermission {
  id: string;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage: string | null;
  isActive: boolean;
  phone: string | null;
  address: string | null;
  userPermission: UserPermission | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
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
  
  // Bulk assign state
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
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<string[]>([]);
  const [bulkUserSearch, setBulkUserSearch] = useState('');
  
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
  const [createUserSearch, setCreateUserSearch] = useState('');

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

  const permissionKeys = ['attendance', 'subject', 'classes', 'exam', 'fee', 'users', 'students', 'teachers'];

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

  // Fetch User Permissions
  const fetchPermissions = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const response = await getAllUserPermissionsApiCall(token, {
        page: page,
        search: search || undefined,
        limit: 10,
      });

      if (response?.success) {
        let usersData: UserWithPermission[] = [];
        let paginationData = {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false,
        };

        if (response.data?.users) {
          usersData = response.data.users;
          paginationData = response.data.pagination || paginationData;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        } else if (Array.isArray(response.data)) {
          usersData = response.data;
        }

        const formattedUsers = usersData.map((user: any) => ({
          ...user,
          userPermission: user.userPermission && Array.isArray(user.userPermission) && user.userPermission.length > 0
            ? user.userPermission[0]
            : null
        }));

        dispatch(setUserPermissions({
          users: formattedUsers,
          pagination: paginationData
        }));
      } else {
        toast.error(response?.message || 'Failed to fetch permissions');
        dispatch(setError(response?.message || 'Failed to fetch permissions'));
      }
    } catch (error: any) {
      console.error('Fetch permissions error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch permissions');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch permissions'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const usersWithPermissions: UserWithPermission[] = userPermissions || [];

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, [page, search]);

  // Handle toggle single permission
  const handleTogglePermission = async (
    userId: string,
    permissionKey: string,
    currentValue: boolean
  ) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    const user = usersWithPermissions.find((u: any) => u.id === userId);
    const existingPermission = user?.userPermission || null;
    
    setIsSubmitting(true);
    try {
      if (existingPermission) {
        const data = await updateUserPermissionStatusApiCall(token, existingPermission.id, {
          permission: permissionKey as any,
          value: !currentValue,
        });

        if (data?.success) {
          toast.success(data?.message || `Permission ${!currentValue ? 'enabled' : 'disabled'}`);
          await fetchPermissions();
        } else {
          toast.error(data?.message || 'Failed to update permission');
        }
      } else {
        const newPermission: any = {
          userId,
          attendance: false,
          subject: false,
          classes: false,
          exam: false,
          fee: false,
          users: false,
          students: false,
          teachers: false,
        };
        newPermission[permissionKey] = true;

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
        setCreateUserSearch('');
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
    if (bulkSelectedUsers.length === 0) {
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
      const permissions = bulkSelectedUsers.map(userId => ({
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
        setBulkSelectedUsers([]);
        setBulkUserSearch('');
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;

  // Get permission count
  const getPermissionCount = (permission: UserPermission | null) => {
    if (!permission) return 0;
    return permissionKeys.filter(key => permission[key as keyof UserPermission] === true).length;
  };

  // Check if all permissions are enabled
  const areAllPermissionsEnabled = (permission: UserPermission | null) => {
    if (!permission) return false;
    return permissionKeys.every(key => permission[key as keyof UserPermission] === true);
  };

  // Check if any permission is enabled
  const hasAnyPermission = (permission: UserPermission | null) => {
    if (!permission) return false;
    return permissionKeys.some(key => permission[key as keyof UserPermission] === true);
  };

  const loading = permissionLoading || userLoading;

  // Handle toggle all permissions for bulk
  const handleToggleAllBulkPermissions = () => {
    const allEnabled = Object.values(bulkPermissions).every(v => v === true);
    const newState = Object.keys(bulkPermissions).reduce((acc, key) => {
      acc[key] = !allEnabled;
      return acc;
    }, {} as { [key: string]: boolean });
    setBulkPermissions(newState);
  };

  // Get filtered users for create dropdown with search
  const getFilteredUsersForCreate = () => {
    if (!users) return [];
    
    if (createUserSearch) {
      const searchLower = createUserSearch.toLowerCase();
      return users.filter((user: any) => 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      );
    }
    return users;
  };

  // Get filtered users for bulk dropdown with search
  const getFilteredUsersForBulk = () => {
    if (!users) return [];
    
    // Filter out already selected users
    const availableUsers = users.filter((user: any) => !bulkSelectedUsers.includes(user.id));
    
    if (bulkUserSearch) {
      const searchLower = bulkUserSearch.toLowerCase();
      return availableUsers.filter((user: any) => 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      );
    }
    
    return availableUsers;
  };

  // Handle add user to bulk selection
  const handleAddUserToBulk = (userId: string) => {
    if (!bulkSelectedUsers.includes(userId)) {
      setBulkSelectedUsers([...bulkSelectedUsers, userId]);
      setBulkUserSearch('');
    }
  };

  // Handle remove user from bulk selection
  const handleRemoveUserFromBulk = (userId: string) => {
    setBulkSelectedUsers(bulkSelectedUsers.filter(id => id !== userId));
  };

  // Get user details by ID
  const getUserById = (userId: string) => {
    return users?.find((user: any) => user.id === userId);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Permissions" 
        description="Manage user permissions and access control"
      />

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
        <Button size="sm" onClick={() => {
          setBulkSelectedUsers([]);
          setIsBulkModalOpen(true);
        }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Bulk Assign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
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
                  {usersWithPermissions.filter((u: any) => u.userPermission && hasAnyPermission(u.userPermission)).length}
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
                  {usersWithPermissions.filter((u: any) => u.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  {permissionKeys.map((perm) => (
                    <TableHead key={perm} className="text-center">
                      {permissionLabels[perm]}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={permissionKeys.length + 3} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading permissions...
                    </TableCell>
                  </TableRow>
                ) : usersWithPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={permissionKeys.length + 3} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  usersWithPermissions.map((user: any) => {
                    const permission = user.userPermission;
                    const hasPermission = !!permission && hasAnyPermission(permission);
                    
                    return (
                      <TableRow key={user.id}>
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
                        {permissionKeys.map((perm) => (
                          <TableCell key={perm} className="text-center">
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
                                      {getPermissionCount(permission)} of {permissionKeys.length} permissions
                                    </span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      permissionKeys.forEach((p) => {
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
            {/* User Selection with Search */}
            <div className="space-y-2">
              <Label>Select User <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={createUserSearch}
                  onChange={(e) => setCreateUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={createForm.userId}
                onValueChange={(value) => {
                  setCreateForm({ ...createForm, userId: value });
                  setCreateUserSearch('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getFilteredUsersForCreate().length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      {createUserSearch ? 'No users found matching your search' : 'No users available'}
                    </div>
                  ) : (
                    getFilteredUsersForCreate().map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImage ? `${baseURl}/${user.profileImage}` : undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Permission Toggles */}
            <div className="grid grid-cols-2 gap-4">
              {permissionKeys.map((perm) => (
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
                  setCreateUserSearch('');
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting || !createForm.userId}
              >
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Bulk Assign Permissions</DialogTitle>
            <DialogDescription>
              Select multiple users and assign permissions to all of them
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Selection with Search */}
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={bulkUserSearch}
                  onChange={(e) => setBulkUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Selected Users Tags */}
              {bulkSelectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                  {bulkSelectedUsers.map((userId) => {
                    const user = getUserById(userId);
                    return user ? (
                      <div key={userId} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.firstName} {user.lastName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUserFromBulk(userId)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* User List */}
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {getFilteredUsersForBulk().length === 0 ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">
                    {bulkUserSearch ? 'No users found matching your search' : 'No users available'}
                  </div>
                ) : (
                  getFilteredUsersForBulk().map((user: any) => (
                    <div
                      key={user.id}
                      onClick={() => handleAddUserToBulk(user.id)}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage ? `${baseURl}/${user.profileImage}` : undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <Badge variant="outline">{user.role?.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Users Count */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Selected Users: <span className="text-primary">{bulkSelectedUsers.length}</span>
              </p>
            </div>

            {/* Permission Toggles */}
            <div className="space-y-2">
              <Label>Permissions to Assign</Label>
              <div className="grid grid-cols-2 gap-4">
                {permissionKeys.map((perm) => (
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
                onClick={handleToggleAllBulkPermissions}
              >
                {Object.values(bulkPermissions).every(v => v === true) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkSelectedUsers([]);
                  setBulkUserSearch('');
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
                disabled={isSubmitting || bulkSelectedUsers.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Assign to {bulkSelectedUsers.length} User{bulkSelectedUsers.length > 1 ? 's' : ''}
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