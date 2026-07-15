// app/dashboard/teachers/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, User, RefreshCw, Edit2, MoreVertical, Plus, ChevronLeft, ChevronRight, QrCode, Eye, Key } from 'lucide-react';
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
  getAllTeachersApiCall,
  createTeacherApiCall,
  hardDeleteTeacherApiCall,
  updateTeacherStatusApiCall,
  updateTeacherApiCall,
  getTeacherByIdApiCall,
  resetTeacherPasswordApiCall,
  regenerateTeacherQRCodeApiCall,
  setTeachers,
  setLoading,
  setPagination,
} from '@/store/slices/teacherSlice';
import { toast } from 'react-toastify';
import Image from 'next/image';

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

export default function TeachersPage() {
  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;
  const dispatch = useAppDispatch();
  const { teachers, loading, pagination } = useAppSelector((state:any) => state.teacher);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Create teacher form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    employeeId: '',
    qualification: '',
    experience: '',
    specialization: '',
    joiningDate: '',
    salary: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit teacher states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    qualification: '',
    experience: '',
    specialization: '',
    salary: '',
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  // View teacher details
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);

  // Reset password
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordTeacherId, setResetPasswordTeacherId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // QR Code modal
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);

  const fetchTeachers = async (page: number = currentPage) => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const data = await getAllTeachersApiCall(token, page, search, statusFilter);
      console.log('API Response:', data);
      
      if (data?.success === true) {
        let teachersData = [];
        let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 };
        
        if (data?.data?.teachers && Array.isArray(data.data.teachers)) {
          teachersData = data.data.teachers;
          paginationData = {
            page: data.data.pagination?.page || 1,
            limit: data.data.pagination?.limit || 10,
            total: data.data.pagination?.total || 0,
            totalPages: data.data.pagination?.totalPages || 0,
          };
        } else if (data?.data && Array.isArray(data.data)) {
          teachersData = data.data;
        } else if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          teachersData = [data.data];
        }
        
        dispatch(setTeachers(teachersData));
        dispatch(setPagination(paginationData));
      } else {
        toast.error(data?.message || 'Failed to fetch teachers');
        dispatch(setTeachers([]));
      }
    } catch (error: any) {
      console.error('Fetch teachers error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch teachers');
      dispatch(setTeachers([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchTeachers(currentPage);
  }, [search, currentPage, statusFilter,dispatch]);

  const filteredTeachers = useMemo(() => {
    if (!teachers || !Array.isArray(teachers)) return [];
    
    const query = search.toLowerCase().trim();
    if (!query) return teachers;
    
    return teachers.filter((teacher: Teacher) => {
      const searchString = [
        teacher.name, 
        teacher.email, 
        teacher.employeeId,
        teacher.qualification || '',
        teacher.specialization || ''
      ]
        .join(' ')
        .toLowerCase();
      return searchString.includes(query);
    });
  }, [search, teachers]);

  // Create Teacher
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
      formData.append('email', form.email);
      if (form.password) formData.append('password', form.password);
      formData.append('name', form.name);
      if (form.username) formData.append('username', form.username);
      formData.append('employeeId', form.employeeId);
      if (form.qualification) formData.append('qualification', form.qualification);
      if (form.experience) formData.append('experience', form.experience);
      if (form.specialization) formData.append('specialization', form.specialization);
      formData.append('joiningDate', form.joiningDate);
      if (form.salary) formData.append('salary', form.salary);
      if (avatarFile) formData.append('profileImage', avatarFile);

      const data = await createTeacherApiCall(token, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Teacher created successfully');
        if (data?.data?.defaultUsername) {
          toast.info(`Username: ${data.data.defaultUsername}`);
        }
        if (data?.data?.defaultPassword) {
          toast.info(`Default Password: ${data.data.defaultPassword}`);
        }
        setForm({
          email: '',
          password: '',
          name: '',
          username: '',
          employeeId: '',
          qualification: '',
          experience: '',
          specialization: '',
          joiningDate: '',
          salary: '',
        });
        setAvatarFile(null);
        setIsCreateModalOpen(false);
        await fetchTeachers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to create teacher');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Teacher
  const handleDelete = async (teacherId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    if (!confirm('Are you sure you want to permanently delete this teacher?')) {
      return;
    }

    try {
      const data = await hardDeleteTeacherApiCall(token, teacherId);
      if (data?.success === true) {
        toast.success(data?.message || 'Teacher deleted successfully');
        await fetchTeachers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to delete teacher');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete teacher');
    }
  };

  // Update Teacher Status
  const handleStatusChange = async (teacherId: string, status: 'active' | 'inactive' | 'suspended') => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await updateTeacherStatusApiCall(token, teacherId, status);
      if (data?.success === true) {
        toast.success(data?.message || 'Teacher status updated successfully');
        await fetchTeachers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update teacher status');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update teacher status');
    }
  };

  // Open edit modal
  const handleEditClick = async (teacher: Teacher) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getTeacherByIdApiCall(token, teacher.id);
      if (data?.success === true) {
        const teacherData = data.data.teacher;
        setEditingTeacher(teacherData);
        setEditForm({
          name: teacherData.name,
          username: teacherData.username || '',
          qualification: teacherData.qualification || '',
          experience: teacherData.experience || '',
          specialization: teacherData.specialization || '',
          salary: teacherData.salary || '',
        });
        setCurrentAvatar(teacherData.profileImage);
        setEditAvatarFile(null);
        setIsEditModalOpen(true);
      } else {
        toast.error(data?.message || 'Failed to fetch teacher details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch teacher details');
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTeacher) return;
    
    setIsEditSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsEditSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', editForm.name);
      if (editForm.username) formData.append('username', editForm.username);
      if (editForm.qualification) formData.append('qualification', editForm.qualification);
      if (editForm.experience) formData.append('experience', editForm.experience);
      if (editForm.specialization) formData.append('specialization', editForm.specialization);
      if (editForm.salary) formData.append('salary', editForm.salary);
      if (editAvatarFile) formData.append('profileImage', editAvatarFile);

      const data = await updateTeacherApiCall(token, editingTeacher.id, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Teacher updated successfully');
        setIsEditModalOpen(false);
        setEditingTeacher(null);
        setEditAvatarFile(null);
        setCurrentAvatar(null);
        await fetchTeachers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update teacher');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update teacher');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // View Teacher
  const handleViewClick = async (teacher: Teacher) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getTeacherByIdApiCall(token, teacher.id);
      if (data?.success === true) {
        setViewingTeacher(data.data.teacher);
        setIsViewModalOpen(true);
      } else {
        toast.error(data?.message || 'Failed to fetch teacher details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch teacher details');
    }
  };

  // Reset Password
  const handleResetPassword = async (teacherId: string) => {
    setResetPasswordTeacherId(teacherId);
    setResetPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetPasswordTeacherId) return;
    
    setIsResettingPassword(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsResettingPassword(false);
        return;
      }

      const data = await resetTeacherPasswordApiCall(
        token, 
        resetPasswordTeacherId, 
        resetPassword || undefined
      );

      if (data?.success === true) {
        toast.success(data?.message || 'Password reset successfully');
        if (data?.data?.newPassword) {
          toast.info(`New password: ${data.data.newPassword}`);
        }
        setIsResetPasswordModalOpen(false);
        setResetPasswordTeacherId(null);
        setResetPassword('');
      } else {
        toast.error(data?.message || 'Failed to reset password');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // View QR Code
  const handleViewQR = async (teacher: Teacher) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getTeacherByIdApiCall(token, teacher.id);
      if (data?.success === true) {
        const teacherData = data.data.teacher;
        if (teacherData.qrCode) {
          const qrCodeUrl = `${baseURl}${teacherData.qrCode}`;
          setQrCodeData({
            qrCode: teacherData.qrCode,
            qrCodeUrl: qrCodeUrl,
          });
          setIsQRModalOpen(true);
        } else {
          toast.info('No QR code found for this teacher');
        }
      } else {
        toast.error(data?.message || 'Failed to fetch teacher details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch teacher details');
    }
  };

  // Regenerate QR Code
  const handleRegenerateQR = async (teacherId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsRegeneratingQR(true);
    try {
      const data = await regenerateTeacherQRCodeApiCall(token);
      if (data?.success === true) {
        toast.success(data?.message || 'QR code regenerated successfully');
        if (data?.data) {
          setQrCodeData(data.data);
        }
        await fetchTeachers(currentPage);
      } else {
        toast.error(data?.message || 'Failed to regenerate QR code');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to regenerate QR code');
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  // Reset create form modal
  const resetCreateForm = () => {
    setForm({
      email: '',
      password: '',
      name: '',
      username: '',
      employeeId: '',
      qualification: '',
      experience: '',
      specialization: '',
      joiningDate: '',
      salary: '',
    });
    setAvatarFile(null);
    setIsCreateModalOpen(false);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (teachers && teachers.length === pagination.limit) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Status badge colors
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" description="Manage teacher accounts and profiles." />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Teachers</CardTitle>
            <CardDescription>Manage all teacher accounts</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchTeachers(currentPage)} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search teachers by name, email, employee ID, or specialization"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading teachers...
                    </TableCell>
                  </TableRow>
                ) : !filteredTeachers || filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No teachers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher: Teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                            {teacher.profileImage ? (
                              <Image
                                src={`${baseURl}${teacher.profileImage}`}
                                alt={teacher.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.qualification || 'No qualification'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{teacher.employeeId}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.specialization || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(teacher.isActive)}
                          className="cursor-pointer"
                          onClick={() => {
                            const newStatus = teacher.isActive ? 'inactive' : 'active';
                            handleStatusChange(teacher.id, newStatus as 'active' | 'inactive');
                          }}
                        >
                          {teacher.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => handleViewClick(teacher)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(teacher)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(teacher.id)}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewQR(teacher)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              View QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const newStatus = teacher.isActive ? 'inactive' : 'active';
                                handleStatusChange(teacher.id, newStatus as 'active' | 'inactive');
                              }}
                              className="text-blue-600"
                            >
                              {teacher.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(teacher.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
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
          {!loading && teachers && teachers.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} • Showing {teachers.length} teachers • Total: {pagination.total}
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
                  disabled={teachers.length < pagination.limit}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Teacher Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Teacher</DialogTitle>
            <DialogDescription>
              Add a new teacher to the platform. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
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
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave empty for default (123456)"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Auto-generated if left empty"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID <span className="text-destructive">*</span></Label>
                <Input
                  id="employeeId"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date <span className="text-destructive">*</span></Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
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
                {isSubmitting ? 'Creating...' : 'Create Teacher'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update teacher information. Upload a new image to change the profile picture.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-qualification">Qualification</Label>
                <Input
                  id="edit-qualification"
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-experience">Experience (years)</Label>
                <Input
                  id="edit-experience"
                  value={editForm.experience}
                  onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={editForm.specialization}
                  onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salary</Label>
                <Input
                  id="edit-salary"
                  value={editForm.salary}
                  onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
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
                  setEditingTeacher(null);
                  setEditAvatarFile(null);
                  setCurrentAvatar(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isEditSubmitting}>
                {isEditSubmitting ? 'Updating...' : 'Update Teacher'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Teacher Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>
              Complete information about the teacher.
            </DialogDescription>
          </DialogHeader>
          {viewingTeacher && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted overflow-hidden">
                  {viewingTeacher.profileImage ? (
                    <Image
                      src={`${baseURl}${viewingTeacher.profileImage}`}
                      alt={viewingTeacher.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{viewingTeacher.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewingTeacher.email}</p>
                  <Badge variant={getStatusBadgeVariant(viewingTeacher.isActive)}>
                    {viewingTeacher.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{viewingTeacher.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{viewingTeacher.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualification</p>
                  <p className="font-medium">{viewingTeacher.qualification || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{viewingTeacher.experience || 'N/A'} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specialization</p>
                  <p className="font-medium">{viewingTeacher.specialization || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-medium">{viewingTeacher.salary || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-medium">{new Date(viewingTeacher.joiningDate).toLocaleDateString()}</p>
                </div>
                {viewingTeacher.qrCode && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">QR Code</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-1"
                      onClick={() => {
                        const qrCodeUrl = `${baseURl}${viewingTeacher.qrCode}`;
                        setQrCodeData({
                          qrCode: viewingTeacher.qrCode,
                          qrCodeUrl: qrCodeUrl,
                        });
                        setIsQRModalOpen(true);
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR Code
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reset Teacher Password</DialogTitle>
            <DialogDescription>
              Enter a new password or leave empty to use the default password (123456).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Leave empty for default (123456)"
                minLength={6}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsResetPasswordModalOpen(false);
                  setResetPasswordTeacherId(null);
                  setResetPassword('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isResettingPassword}>
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Teacher QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to access teacher information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeData && (
              <>
                <div className="relative w-48 h-48 bg-white rounded-lg overflow-hidden">
                  <Image
                    src={qrCodeData.qrCodeUrl}
                    alt="Teacher QR Code"
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (viewingTeacher) {
                      await handleRegenerateQR(viewingTeacher.id);
                    }
                  }}
                  disabled={isRegeneratingQR}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRegeneratingQR ? 'animate-spin' : ''}`} />
                  Regenerate QR Code 
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}