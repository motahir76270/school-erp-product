// app/dashboard/admin/settings/teacher-permission/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllTeacherPermissionsApiCall,
  createTeacherPermissionApiCall,
  updateTeacherPermissionStatusApiCall,
  deleteTeacherPermissionApiCall,
  bulkCreateTeacherPermissionsApiCall,
  setTeacherPermissions,
  setLoading,
  setError,
} from '@/store/slices/permissionSlice';
import { getAllTeachersApiCall, setTeachers } from '@/store/slices/teacherSlice';
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
  GraduationCap,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Teacher {
  id: string;
  userId: string | null;
  username: string;
  email: string;
  password: string;
  role: 'teacher';
  name: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  employeeId: string;
  qualification: string | null;
  experience: string | null;
  specialization: string | null;
  joiningDate: string;
  salary: string | null;
  qrCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

interface TeacherPermission {
  id: string;
  userId: string;
  teacherId: string;
  attendance: boolean;
  subject: boolean;
  classes: boolean;
  exam: boolean;
  fee: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeacherWithPermission {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  profileImage: string | null;
  isActive: boolean;
  qualification: string | null;
  experience: string | null;
  specialization: string | null;
  permission: TeacherPermission[] | null;  // ✅ Changed from teacherPermission to permission (array)
  createdAt: string;
  updatedAt: string;
}

export default function TeacherPermissionPage() {
  const dispatch = useAppDispatch();
  const { teacherPermissions, loading: permissionLoading } = useAppSelector((state: any) => state.permission);
  const { teachers, loading: teacherLoading } = useAppSelector((state: any) => state.teacher);

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
  });
  const [bulkSelectedTeachers, setBulkSelectedTeachers] = useState<string[]>([]);
  const [bulkTeacherSearch, setBulkTeacherSearch] = useState('');
  
  // Create permission form
  const [createForm, setCreateForm] = useState({
    teacherId: '',
    attendance: false,
    subject: false,
    classes: false,
    exam: false,
    fee: false,
  });
  const [createTeacherSearch, setCreateTeacherSearch] = useState('');

  // Permission labels for display
  const permissionLabels: Record<string, string> = {
    attendance: 'Attendance',
    subject: 'Subject',
    classes: 'Classes',
    exam: 'Exam',
    fee: 'Fee',
  };

  const permissionKeys = ['attendance', 'subject', 'classes', 'exam', 'fee'];

  // Fetch Teachers for dropdown
  const fetchTeachers = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getAllTeachersApiCall(token, 1, '', '');
      if (data?.success === true) {
        let teachersData = [];
        if (data?.data?.teachers && Array.isArray(data.data.teachers)) {
          teachersData = data.data.teachers;
        } else if (data?.data && Array.isArray(data.data)) {
          teachersData = data.data;
        } else {
          teachersData = [];
        }
        dispatch(setTeachers(teachersData));
      }
    } catch (error: any) {
      console.error('Fetch teachers error:', error);
    }
  };

  // Fetch Teacher Permissions
  const fetchPermissions = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const response = await getAllTeacherPermissionsApiCall(token, {
        page: page,
        search: search || undefined,
        limit: 10,
      });

      console.log('Teacher Permissions API Response:', response);

      if (response?.success) {
        let teachersData: any[] = [];
        let paginationData = {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false,
        };

        // Extract teachers from response
        if (response.data?.teachers) {
          teachersData = response.data.teachers;
          paginationData = response.data.pagination || paginationData;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          teachersData = response.data.data;
        } else if (Array.isArray(response.data)) {
          teachersData = response.data;
        }

        // ✅ FIX: Format the data - the API returns "permission" array, not "teacherPermission"
        const formattedTeachers = teachersData.map((teacher: any) => {
          // The API returns "permission" as an array
          // We need to keep it as an array or take the first item
          let permission = null;
          
          if (teacher.permission && Array.isArray(teacher.permission) && teacher.permission.length > 0) {
            // Take the first permission from the array
            permission = teacher.permission[0];
          }
          
          return {
            ...teacher,
            // Keep both for compatibility
            permission: teacher.permission || null,
            teacherPermission: permission // For backward compatibility
          };
        });

        console.log('✅ Formatted Teachers:', formattedTeachers);

        dispatch(setTeacherPermissions({
          teachers: formattedTeachers,
          pagination: paginationData
        }));
      } else {
        toast.error(response?.message || 'Failed to fetch teacher permissions');
        dispatch(setError(response?.message || 'Failed to fetch teacher permissions'));
      }
    } catch (error: any) {
      console.error('Fetch teacher permissions error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch teacher permissions');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch teacher permissions'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const teachersWithPermissions: any[] = teacherPermissions || [];

  useEffect(() => {
    fetchPermissions();
    fetchTeachers();
  }, [page, search]);

  // Get user ID for a teacher (needed for create API)
  const getUserIdByTeacherId = (teacherId: string) => {
    const teacher = teachers?.find((t: any) => t.id === teacherId);
    return teacher?.userId || null;
  };

  // Handle toggle single permission - EXACTLY like User Permission page
  const handleTogglePermission = async (
    teacherId: string,
    permissionKey: string,
    currentValue: boolean
  ) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    const teacher = teachersWithPermissions.find((t: any) => t.id === teacherId);
    // ✅ FIX: Use teacherPermission (which we set from permission[0]) or permission array
    const existingPermission = teacher?.teacherPermission || null;
    
    console.log('🔍 Toggle Debug:', {
      teacherId,
      permissionKey,
      currentValue,
      hasPermission: !!existingPermission,
      permissionId: existingPermission?.id,
      teacher: teacher
    });
    
    setIsSubmitting(true);
    try {
      if (existingPermission) {
        // ✅ UPDATE: Call status update API with permission ID
        // This calls PATCH /permissions/teacher/status/${existingPermission.id}
        console.log('✅ UPDATING teacher permission with ID:', existingPermission.id);
        
        const data = await updateTeacherPermissionStatusApiCall(
          token, 
          existingPermission.id, // This is the PERMISSION ID
          {
            permission: permissionKey as any,
            value: !currentValue,
          }
        );

        console.log('📦 Update Response:', data);

        if (data?.success) {
          toast.success(data?.message || `Permission ${!currentValue ? 'enabled' : 'disabled'}`);
          await fetchPermissions();
        } else {
          toast.error(data?.message || 'Failed to update permission');
        }
      } else {
        // ✅ CREATE: Only when no permission exists
        console.log('🆕 CREATING new teacher permission for:', teacherId);
        
        const userId = getUserIdByTeacherId(teacherId);
        if (!userId) {
          toast.error('Teacher does not have a valid user ID');
          setIsSubmitting(false);
          return;
        }

        const newPermission: any = {
          userId: userId,
          teacherId: teacherId,
          attendance: false,
          subject: false,
          classes: false,
          exam: false,
          fee: false,
        };
        newPermission[permissionKey] = true;

        const data = await createTeacherPermissionApiCall(token, newPermission);
        console.log('📦 Create Response:', data);

        if (data?.success) {
          toast.success(data?.message || 'Permission created successfully');
          await fetchPermissions();
        } else {
          toast.error(data?.message || 'Failed to create permission');
        }
      }
    } catch (error: any) {
      console.error('❌ Toggle permission error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update permission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create permission
  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.teacherId) {
      toast.error('Please select a teacher');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    const userId = getUserIdByTeacherId(createForm.teacherId);
    if (!userId) {
      toast.error('Teacher does not have a valid user ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await createTeacherPermissionApiCall(token, {
        userId: userId,
        teacherId: createForm.teacherId,
        attendance: createForm.attendance,
        subject: createForm.subject,
        classes: createForm.classes,
        exam: createForm.exam,
        fee: createForm.fee,
      });

      if (data?.success) {
        toast.success(data?.message || 'Permission created successfully');
        setIsCreateModalOpen(false);
        setCreateForm({
          teacherId: '',
          attendance: false,
          subject: false,
          classes: false,
          exam: false,
          fee: false,
        });
        setCreateTeacherSearch('');
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
    if (bulkSelectedTeachers.length === 0) {
      toast.error('Please select at least one teacher');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    try {
      const permissions = bulkSelectedTeachers.map(teacherId => {
        const userId = getUserIdByTeacherId(teacherId);
        if (!userId) {
          throw new Error(`Teacher ${teacherId} does not have a valid user ID`);
        }
        return {
          userId: userId,
          teacherId: teacherId,
          attendance: bulkPermissions.attendance,
          subject: bulkPermissions.subject,
          classes: bulkPermissions.classes,
          exam: bulkPermissions.exam,
          fee: bulkPermissions.fee,
        };
      });

      const data = await bulkCreateTeacherPermissionsApiCall(token, { permissions });

      if (data?.success) {
        toast.success(data?.message || 'Permissions created successfully');
        setIsBulkModalOpen(false);
        setBulkSelectedTeachers([]);
        setBulkTeacherSearch('');
        setBulkPermissions({
          attendance: false,
          subject: false,
          classes: false,
          exam: false,
          fee: false,
        });
        await fetchPermissions();
      } else {
        toast.error(data?.message || 'Failed to create permissions');
      }
    } catch (error: any) {
      console.error('Bulk create error:', error);
      toast.error(error?.message || 'Failed to create permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete permission
  const handleDeletePermission = async (permissionId: string, teacherName: string) => {
    if (!confirm(`Are you sure you want to delete permissions for ${teacherName}?`)) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await deleteTeacherPermissionApiCall(token, permissionId);
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

  const getInitials = (name: string) => {
    return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T';
  };

  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;

  // Get permission count
  const getPermissionCount = (permission: TeacherPermission | null) => {
    if (!permission) return 0;
    return permissionKeys.filter(key => permission[key as keyof TeacherPermission] === true).length;
  };

  // Check if all permissions are enabled
  const areAllPermissionsEnabled = (permission: TeacherPermission | null) => {
    if (!permission) return false;
    return permissionKeys.every(key => permission[key as keyof TeacherPermission] === true);
  };

  // Check if any permission is enabled
  const hasAnyPermission = (permission: TeacherPermission | null) => {
    if (!permission) return false;
    return permissionKeys.some(key => permission[key as keyof TeacherPermission] === true);
  };

  const loading = permissionLoading || teacherLoading;

  // Handle toggle all permissions for bulk
  const handleToggleAllBulkPermissions = () => {
    const allEnabled = Object.values(bulkPermissions).every(v => v === true);
    const newState = Object.keys(bulkPermissions).reduce((acc, key) => {
      acc[key] = !allEnabled;
      return acc;
    }, {} as { [key: string]: boolean });
    setBulkPermissions(newState);
  };

  // Get filtered teachers for create dropdown with search
  const getFilteredTeachersForCreate = () => {
    if (!teachers) return [];
    
    if (createTeacherSearch) {
      const searchLower = createTeacherSearch.toLowerCase();
      return teachers.filter((teacher: any) => 
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower) ||
        teacher.employeeId?.toLowerCase().includes(searchLower) ||
        teacher.specialization?.toLowerCase().includes(searchLower)
      );
    }
    return teachers;
  };

  // Get filtered teachers for bulk dropdown with search
  const getFilteredTeachersForBulk = () => {
    if (!teachers) return [];
    
    // Filter out already selected teachers
    const availableTeachers = teachers.filter((teacher: any) => !bulkSelectedTeachers.includes(teacher.id));
    
    if (bulkTeacherSearch) {
      const searchLower = bulkTeacherSearch.toLowerCase();
      return availableTeachers.filter((teacher: any) => 
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower) ||
        teacher.employeeId?.toLowerCase().includes(searchLower) ||
        teacher.specialization?.toLowerCase().includes(searchLower)
      );
    }
    
    return availableTeachers;
  };

  // Handle add teacher to bulk selection
  const handleAddTeacherToBulk = (teacherId: string) => {
    if (!bulkSelectedTeachers.includes(teacherId)) {
      setBulkSelectedTeachers([...bulkSelectedTeachers, teacherId]);
      setBulkTeacherSearch('');
    }
  };

  // Handle remove teacher from bulk selection
  const handleRemoveTeacherFromBulk = (teacherId: string) => {
    setBulkSelectedTeachers(bulkSelectedTeachers.filter(id => id !== teacherId));
  };

  // Get teacher details by ID
  const getTeacherById = (teacherId: string) => {
    return teachers?.find((teacher: any) => teacher.id === teacherId);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Teacher Permissions" 
        description="Manage teacher permissions and access control"
      />

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            fetchPermissions();
            fetchTeachers();
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
          setBulkSelectedTeachers([]);
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
                <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
                <p className="text-2xl font-bold">{teachersWithPermissions.length}</p>
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
                  {teachersWithPermissions.filter((t: any) => t.teacherPermission && hasAnyPermission(t.teacherPermission)).length}
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
                <p className="text-sm font-medium text-muted-foreground">Active Teachers</p>
                <p className="text-2xl font-bold">
                  {teachersWithPermissions.filter((t: any) => t.isActive).length}
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
                placeholder="Search teachers by name, email, employee ID, or specialization..."
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
          <CardTitle>Teacher Permissions</CardTitle>
          <CardDescription>Manage permissions for each teacher</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell colSpan={permissionKeys.length + 5} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading permissions...
                    </TableCell>
                  </TableRow>
                ) : teachersWithPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={permissionKeys.length + 5} className="text-center py-8 text-muted-foreground">
                      No teachers found
                    </TableCell>
                  </TableRow>
                ) : (
                  teachersWithPermissions.map((teacher: any) => {
                    // ✅ FIX: Use teacherPermission (which we set from permission[0])
                    const permission = teacher.teacherPermission;
                    const hasPermission = !!permission && hasAnyPermission(permission);
                    
                    return (
                      <TableRow key={teacher.id}>
                        {/* Teacher Info */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={teacher.profileImage ? `${baseURl}/${teacher.profileImage}` : undefined} 
                                alt={teacher.name}
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(teacher.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {teacher.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {teacher.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Employee ID */}
                        <TableCell>
                          <Badge variant="outline">
                            {teacher.employeeId}
                          </Badge>
                        </TableCell>

                        {/* Specialization */}
                        <TableCell>
                          {teacher.specialization || 'N/A'}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={teacher.isActive ? 'default' : 'secondary'}>
                            {teacher.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>

                        {/* Permission Switches */}
                        {permissionKeys.map((perm) => (
                          <TableCell key={perm} className="text-center">
                            <Switch
                              checked={hasPermission ? permission[perm as keyof TeacherPermission] || false : false}
                              onCheckedChange={() => 
                                handleTogglePermission(
                                  teacher.id,
                                  perm,
                                  hasPermission ? permission[perm as keyof TeacherPermission] || false : false
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
                                          teacher.id,
                                          p,
                                          hasPermission ? permission[p as keyof TeacherPermission] || false : false
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
                                    handleDeletePermission(permission.id, teacher.name);
                                  } else {
                                    toast.info('No permissions to delete for this teacher');
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
            <DialogTitle>Create Teacher Permission</DialogTitle>
            <DialogDescription>
              Assign permissions to a specific teacher
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePermission} className="space-y-4">
            {/* Teacher Selection with Search */}
            <div className="space-y-2">
              <Label>Select Teacher <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search teachers by name, email, or employee ID..."
                  value={createTeacherSearch}
                  onChange={(e) => setCreateTeacherSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={createForm.teacherId}
                onValueChange={(value) => {
                  setCreateForm({ ...createForm, teacherId: value });
                  setCreateTeacherSearch('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getFilteredTeachersForCreate().length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      {createTeacherSearch ? 'No teachers found matching your search' : 'No teachers available'}
                    </div>
                  ) : (
                    getFilteredTeachersForCreate().map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={teacher.profileImage ? `${baseURl}/${teacher.profileImage}` : undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(teacher.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {teacher.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {teacher.email} • {teacher.employeeId}
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
                    teacherId: '',
                    attendance: false,
                    subject: false,
                    classes: false,
                    exam: false,
                    fee: false,
                  });
                  setCreateTeacherSearch('');
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting || !createForm.teacherId}
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
            <DialogTitle>Bulk Assign Teacher Permissions</DialogTitle>
            <DialogDescription>
              Select multiple teachers and assign permissions to all of them
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Teacher Selection with Search */}
            <div className="space-y-2">
              <Label>Select Teachers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search teachers by name, email, or employee ID..."
                  value={bulkTeacherSearch}
                  onChange={(e) => setBulkTeacherSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Selected Teachers Tags */}
              {bulkSelectedTeachers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                  {bulkSelectedTeachers.map((teacherId) => {
                    const teacher = getTeacherById(teacherId);
                    return teacher ? (
                      <div key={teacherId} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{teacher.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeacherFromBulk(teacherId)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* Teacher List */}
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {getFilteredTeachersForBulk().length === 0 ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">
                    {bulkTeacherSearch ? 'No teachers found matching your search' : 'No teachers available'}
                  </div>
                ) : (
                  getFilteredTeachersForBulk().map((teacher: any) => (
                    <div
                      key={teacher.id}
                      onClick={() => handleAddTeacherToBulk(teacher.id)}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={teacher.profileImage ? `${baseURl}/${teacher.profileImage}` : undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {teacher.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {teacher.email} • {teacher.employeeId}
                        </p>
                      </div>
                      <Badge variant="outline">{teacher.specialization || 'N/A'}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Teachers Count */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Selected Teachers: <span className="text-primary">{bulkSelectedTeachers.length}</span>
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
                  setBulkSelectedTeachers([]);
                  setBulkTeacherSearch('');
                  setBulkPermissions({
                    attendance: false,
                    subject: false,
                    classes: false,
                    exam: false,
                    fee: false,
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleBulkCreatePermissions}
                disabled={isSubmitting || bulkSelectedTeachers.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Assign to {bulkSelectedTeachers.length} Teacher{bulkSelectedTeachers.length > 1 ? 's' : ''}
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