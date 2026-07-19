// app/dashboard/students/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, User, RefreshCw, Edit2, MoreVertical, Plus, ChevronLeft, ChevronRight, QrCode, Eye, Key, School, Users, Filter } from 'lucide-react';
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
  getAllStudentsApiCall,
  getStudentsByClassAndSectionApiCall,
  createStudentApiCall,
  hardDeleteStudentApiCall,
  updateStudentStatusApiCall,
  updateStudentApiCall,
  getStudentByIdApiCall,
  resetStudentPasswordApiCall,
  regenerateStudentQRCodeApiCall,
  setStudents,
  setLoading,
  setPagination,
} from '@/store/slices/studentSlice';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { getAllClassWithSections } from '@/src/store/slices/classSlice';

interface Student {
  id: string;
  userId: string | null;
  username: string;
  email: string;
  password: string;
  role: 'student';
  name: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  rollNumber: string;
  admissionNumber: string | null;
  classId: string;
  sectionId: string | null;
  dateOfBirth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  bloodGroup: string | null;
  religion: string | null;
  caste: string | null;
  nationality: string | null;
  aadharNumber: string | null;
  admissionDate: string;
  qrCode: string | null;
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

interface ClassData {
  id: string;
  name: string;
  userId: string;
  sections: Array<{
    id: string;
    name: string;
    classId: string;
    userId: string;
    capacity: number;
  }>;
}

export default function StudentsPage() {
  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;
  const dispatch = useAppDispatch();
  const { students, loading, pagination } = useAppSelector((state) => state.student);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Class and section filter states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableSections, setAvailableSections] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'class'>('all');

  // Create student form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    rollNumber: '',
    admissionNumber: '',
    classId: '',
    sectionId: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    bloodGroup: '',
    religion: '',
    caste: '',
    nationality: '',
    aadharNumber: '',
    admissionDate: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit student states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    rollNumber: '',
    admissionNumber: '',
    classId: '',
    sectionId: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    bloodGroup: '',
    religion: '',
    caste: '',
    nationality: '',
    aadharNumber: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  // View student details
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Reset password
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordStudentId, setResetPasswordStudentId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // QR Code modal
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeStudentId, setQrCodeStudentId] = useState<string | null>(null);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);

  // Fetch classes
  const fetchClasses = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsLoadingClasses(true);
    try {
      const data = await getAllClassWithSections(token);
      if (data?.success === true && data?.data) {
        setClasses(data.data);
      } else {
        toast.error(data?.message || 'Failed to fetch classes');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Handle class change for filter
  const handleClassFilterChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId('');
    
    const selectedClass = classes.find(c => c.id === classId);
    setAvailableSections(selectedClass?.sections || []);
    
    if (classId) {
      setFilterType('class');
    } else {
      setFilterType('all');
    }
  };

  const fetchStudents = async (page: number = currentPage) => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    dispatch(setLoading(true));
    try {
      let data;
      
      // Use class filter if selected
      if (filterType === 'class' && selectedClassId) {
        data = await getStudentsByClassAndSectionApiCall(
          token,
          selectedClassId,
          selectedSectionId
        );
      } else {
        data = await getAllStudentsApiCall(token, page, search, statusFilter);
      }
      
      console.log('API Response:', data);
      
      if (data?.success === true) {
        let studentsData = [];
        let paginationData = { page: 1, limit: 10, total: 0 };
        
        if (data?.data?.students && Array.isArray(data.data.students)) {
          studentsData = data.data.students;
          paginationData = {
            page: data.data.pagination?.page || 1,
            limit: data.data.pagination?.limit || 10,
            total: data.data.pagination?.total || 0,
          };
        } else if (data?.data && Array.isArray(data.data)) {
          studentsData = data.data;
          paginationData = {
            page: data.pagination?.page || 1,
            limit: data.pagination?.limit || 10,
            total: data.pagination?.total || 0,
          };
        } else if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          studentsData = [data.data];
        }
        
        dispatch(setStudents(studentsData));
        dispatch(setPagination(paginationData));
      } else {
        toast.error(data?.message || 'Failed to fetch students');
        dispatch(setStudents([]));
      }
    } catch (error: any) {
      console.error('Fetch students error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch students');
      dispatch(setStudents([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle class selection for create/edit forms
  const handleClassChange = (classId: string, formType: 'create' | 'edit') => {
    const selectedClass = classes.find(c => c.id === classId);
    const sections = selectedClass?.sections || [];
    
    if (formType === 'create') {
      setForm({ ...form, classId, sectionId: '' });
      setAvailableSections(sections);
    } else {
      setEditForm({ ...editForm, classId, sectionId: '' });
      setAvailableSections(sections);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents(currentPage);
  }, [search, currentPage, statusFilter, selectedClassId, selectedSectionId, filterType]);

  const filteredStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    
    const query = search.toLowerCase().trim();
    if (!query) return students;
    
    return students.filter((student: Student) => {
      const searchString = [
        student.name, 
        student.email, 
        student.rollNumber,
        student.phone || '',
        student.admissionNumber || ''
      ]
        .join(' ')
        .toLowerCase();
      return searchString.includes(query);
    });
  }, [search, students]);

  // Create Student
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
      if (form.phone) formData.append('phone', form.phone);
      if (form.address) formData.append('address', form.address);
      formData.append('rollNumber', form.rollNumber);
      if (form.admissionNumber) formData.append('admissionNumber', form.admissionNumber);
      formData.append('classId', form.classId);
      if (form.sectionId) formData.append('sectionId', form.sectionId);
      if (form.dateOfBirth) formData.append('dateOfBirth', form.dateOfBirth);
      if (form.gender) formData.append('gender', form.gender);
      if (form.bloodGroup) formData.append('bloodGroup', form.bloodGroup);
      if (form.religion) formData.append('religion', form.religion);
      if (form.caste) formData.append('caste', form.caste);
      if (form.nationality) formData.append('nationality', form.nationality);
      if (form.aadharNumber) formData.append('aadharNumber', form.aadharNumber);
      formData.append('admissionDate', form.admissionDate);
      if (avatarFile) formData.append('profileImage', avatarFile);

      const data = await createStudentApiCall(token, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Student created successfully');
        setForm({
          email: '',
          password: '',
          name: '',
          phone: '',
          address: '',
          rollNumber: '',
          admissionNumber: '',
          classId: '',
          sectionId: '',
          dateOfBirth: '',
          gender: '',
          bloodGroup: '',
          religion: '',
          caste: '',
          nationality: '',
          aadharNumber: '',
          admissionDate: '',
        });
        setAvatarFile(null);
        setAvailableSections([]);
        setIsCreateModalOpen(false);
        await fetchStudents(currentPage);
      } else {
        toast.error(data?.message || 'Failed to create student');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Student
  const handleDelete = async (studentId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    if (!confirm('Are you sure you want to permanently delete this student?')) {
      return;
    }

    try {
      const data = await hardDeleteStudentApiCall(token, studentId);
      if (data?.success === true) {
        toast.success(data?.message || 'Student deleted successfully');
        await fetchStudents(currentPage);
      } else {
        toast.error(data?.message || 'Failed to delete student');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete student');
    }
  };

  // Update Student Status
  const handleStatusChange = async (studentId: string, status: 'active' | 'inactive' | 'suspended') => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await updateStudentStatusApiCall(token, studentId, status);
      if (data?.success === true) {
        toast.success(data?.message || 'Student status updated successfully');
        await fetchStudents(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update student status');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update student status');
    }
  };

  // Open edit modal
  const handleEditClick = async (student: Student) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getStudentByIdApiCall(token, student.id);
      if (data?.success === true) {
        const studentData = data.data.student;
        setEditingStudent(studentData);
        setEditForm({
          name: studentData.name,
          phone: studentData.phone || '',
          address: studentData.address || '',
          rollNumber: studentData.rollNumber,
          admissionNumber: studentData.admissionNumber || '',
          classId: studentData.classId,
          sectionId: studentData.sectionId || '',
          dateOfBirth: studentData.dateOfBirth || '',
          gender: studentData.gender || '',
          bloodGroup: studentData.bloodGroup || '',
          religion: studentData.religion || '',
          caste: studentData.caste || '',
          nationality: studentData.nationality || '',
          aadharNumber: studentData.aadharNumber || '',
          status: studentData.status,
        });
        
        // Set available sections based on the student's class
        const selectedClass = classes.find(c => c.id === studentData.classId);
        setAvailableSections(selectedClass?.sections || []);
        
        setCurrentAvatar(studentData.profileImage);
        setEditAvatarFile(null);
        setIsEditModalOpen(true);
      } else {
        toast.error(data?.message || 'Failed to fetch student details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch student details');
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingStudent) return;
    
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
      if (editForm.phone) formData.append('phone', editForm.phone);
      if (editForm.address) formData.append('address', editForm.address);
      formData.append('rollNumber', editForm.rollNumber);
      if (editForm.admissionNumber) formData.append('admissionNumber', editForm.admissionNumber);
      formData.append('classId', editForm.classId);
      if (editForm.sectionId) formData.append('sectionId', editForm.sectionId);
      if (editForm.dateOfBirth) formData.append('dateOfBirth', editForm.dateOfBirth);
      if (editForm.gender) formData.append('gender', editForm.gender);
      if (editForm.bloodGroup) formData.append('bloodGroup', editForm.bloodGroup);
      if (editForm.religion) formData.append('religion', editForm.religion);
      if (editForm.caste) formData.append('caste', editForm.caste);
      if (editForm.nationality) formData.append('nationality', editForm.nationality);
      if (editForm.aadharNumber) formData.append('aadharNumber', editForm.aadharNumber);
      formData.append('status', editForm.status);
      if (editAvatarFile) formData.append('profileImage', editAvatarFile);

      const data = await updateStudentApiCall(token, editingStudent.id, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Student updated successfully');
        setIsEditModalOpen(false);
        setEditingStudent(null);
        setEditAvatarFile(null);
        setCurrentAvatar(null);
        setAvailableSections([]);
        await fetchStudents(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update student');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update student');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // View Student
  const handleViewClick = async (student: Student) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getStudentByIdApiCall(token, student.id);
      if (data?.success === true) {
        setViewingStudent(data.data.student);
        setIsViewModalOpen(true);
      } else {
        toast.error(data?.message || 'Failed to fetch student details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch student details');
    }
  };

  // Reset Password
  const handleResetPassword = async (studentId: string) => {
    setResetPasswordStudentId(studentId);
    setResetPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetPasswordStudentId) return;
    
    setIsResettingPassword(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsResettingPassword(false);
        return;
      }

      const data = await resetStudentPasswordApiCall(
        token, 
        resetPasswordStudentId, 
        resetPassword || undefined
      );

      if (data?.success === true) {
        toast.success(data?.message || 'Password reset successfully');
        if (data?.data?.newPassword) {
          toast.info(`New password: ${data.data.newPassword}`);
        }
        setIsResetPasswordModalOpen(false);
        setResetPasswordStudentId(null);
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
  const handleViewQR = async (student: Student) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getStudentByIdApiCall(token, student.id);
      if (data?.success === true) {
        const studentData = data.data.student;
        if (studentData.qrCode) {
          const qrCodeUrl = `${baseURl}${studentData.qrCode}`;
          setQrCodeUrl(qrCodeUrl);
          setQrCodeStudentId(studentData.id);
          setIsQRModalOpen(true);
        } else {
          toast.info('No QR code found for this student');
        }
      } else {
        toast.error(data?.message || 'Failed to fetch student details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch student details');
    }
  };

  // Regenerate QR Code
  const handleRegenerateQR = async () => {
    if (!qrCodeStudentId) return;
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsRegeneratingQR(true);
    try {
      const data = await regenerateStudentQRCodeApiCall(token);
      if (data?.success === true) {
        toast.success(data?.message || 'QR code regenerated successfully');
        if (data?.data?.qrCode) {
          setQrCodeUrl(`${baseURl}${data.data.qrCode}`);
        }
        await fetchStudents(currentPage);
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
      phone: '',
      address: '',
      rollNumber: '',
      admissionNumber: '',
      classId: '',
      sectionId: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      religion: '',
      caste: '',
      nationality: '',
      aadharNumber: '',
      admissionDate: '',
    });
    setAvatarFile(null);
    setAvailableSections([]);
    setIsCreateModalOpen(false);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (students && students.length === pagination.limit) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Status badge colors
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get class name by ID
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || classId;
  };

  // Get section name by ID
  const getSectionName = (sectionId: string | null) => {
    if (!sectionId) return 'N/A';
    for (const cls of classes) {
      const section = cls.sections.find(s => s.id === sectionId);
      if (section) return section.name;
    }
    return sectionId;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Manage student accounts and profiles." />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Students</CardTitle>
            <CardDescription>Manage all student accounts</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchStudents(currentPage)} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters - Class and Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="classFilter">Class</Label>
              <Select
                value={selectedClassId}
                onValueChange={handleClassFilterChange}
              >
                <SelectTrigger disabled={isLoadingClasses}>
                  <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "All Classes"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        {cls.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sectionFilter">Section</Label>
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                disabled={!selectedClassId || availableSections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedClassId ? "Select class first" : 
                    availableSections.length === 0 ? "No sections available" : 
                    "All Sections"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {availableSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {section.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
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
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search students by name, email, or roll number"
              className="pl-9"
            />
          </div>
          
          {/* Students count */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-sm">
              {filteredStudents.length} Students
            </Badge>
            {selectedClassId && (
              <div className="text-sm text-muted-foreground">
                <Filter className="inline h-4 w-4 mr-1" />
                Filtering by: {getClassName(selectedClassId)} {selectedSectionId && `- ${getSectionName(selectedSectionId)}`}
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : !filteredStudents || filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                            {student.profileImage ? (
                              <Image
                                src={`${baseURl}/${student.profileImage}`}
                                alt={student.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            {student.phone && (
                              <p className="text-xs text-muted-foreground">{student.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{getClassName(student.classId)}</TableCell>
                      <TableCell>{getSectionName(student.sectionId)}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(student.status)}
                          className="cursor-pointer"
                          onClick={() => {
                            const nextStatus: Record<string, 'active' | 'inactive' | 'suspended'> = {
                              active: 'inactive',
                              inactive: 'active',
                              suspended: 'active',
                            };
                            handleStatusChange(student.id, nextStatus[student.status] || 'active');
                          }}
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
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
                            <DropdownMenuItem onClick={() => handleViewClick(student)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(student)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(student.id)}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewQR(student)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              View QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const nextStatus: Record<string, 'active' | 'inactive' | 'suspended'> = {
                                  active: 'inactive',
                                  inactive: 'active',
                                  suspended: 'active',
                                };
                                handleStatusChange(student.id, nextStatus[student.status] || 'active');
                              }}
                              className="text-blue-600"
                            >
                              {student.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(student.id)}
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

          {/* Pagination - Only show for 'all' filter type */}
          {filterType === 'all' && !loading && students && students.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} • Showing {students.length} students • Total: {pagination.total}
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
                  disabled={students.length < pagination.limit}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rest of the modals remain the same */}
      {/* Create Student Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Student</DialogTitle>
            <DialogDescription>
              Add a new student to the platform. All fields marked with * are required.
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number <span className="text-destructive">*</span></Label>
                <Input
                  id="rollNumber"
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  value={form.admissionNumber}
                  onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
                />
              </div>
            </div>
            
            {/* Class and Section Dropdowns */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="classId">Class <span className="text-destructive">*</span></Label>
                <Select
                  value={form.classId}
                  onValueChange={(value) => handleClassChange(value, 'create')}
                  required
                >
                  <SelectTrigger disabled={isLoadingClasses}>
                    <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sectionId">Section</Label>
                <Select
                  value={form.sectionId}
                  onValueChange={(value) => setForm({ ...form, sectionId: value })}
                  disabled={!form.classId || availableSections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !form.classId ? "Select class first" : 
                      availableSections.length === 0 ? "No sections available" : 
                      "Select section"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value: 'male' | 'female' | 'other') =>
                    setForm({ ...form, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input
                  id="bloodGroup"
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input
                  id="religion"
                  value={form.religion}
                  onChange={(e) => setForm({ ...form, religion: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="caste">Caste</Label>
                <Input
                  id="caste"
                  value={form.caste}
                  onChange={(e) => setForm({ ...form, caste: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aadharNumber">Aadhar Number</Label>
                <Input
                  id="aadharNumber"
                  value={form.aadharNumber}
                  onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date <span className="text-destructive">*</span></Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={form.admissionDate}
                  onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
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
                {isSubmitting ? 'Creating...' : 'Create Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information. Upload a new image to change the profile picture.
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
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-rollNumber">Roll Number <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-rollNumber"
                  value={editForm.rollNumber}
                  onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-admissionNumber">Admission Number</Label>
                <Input
                  id="edit-admissionNumber"
                  value={editForm.admissionNumber}
                  onChange={(e) => setEditForm({ ...editForm, admissionNumber: e.target.value })}
                />
              </div>
            </div>
            
            {/* Edit Class and Section Dropdowns */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-classId">Class <span className="text-destructive">*</span></Label>
                <Select
                  value={editForm.classId}
                  onValueChange={(value) => handleClassChange(value, 'edit')}
                  required
                >
                  <SelectTrigger disabled={isLoadingClasses}>
                    <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sectionId">Section</Label>
                <Select
                  value={editForm.sectionId}
                  onValueChange={(value) => setEditForm({ ...editForm, sectionId: value })}
                  disabled={!editForm.classId || availableSections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !editForm.classId ? "Select class first" : 
                      availableSections.length === 0 ? "No sections available" : 
                      "Select section"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                <Input
                  id="edit-dateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(value: 'male' | 'female' | 'other') =>
                    setEditForm({ ...editForm, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-bloodGroup">Blood Group</Label>
                <Input
                  id="edit-bloodGroup"
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-religion">Religion</Label>
                <Input
                  id="edit-religion"
                  value={editForm.religion}
                  onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-caste">Caste</Label>
                <Input
                  id="edit-caste"
                  value={editForm.caste}
                  onChange={(e) => setEditForm({ ...editForm, caste: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nationality">Nationality</Label>
                <Input
                  id="edit-nationality"
                  value={editForm.nationality}
                  onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-aadharNumber">Aadhar Number</Label>
                <Input
                  id="edit-aadharNumber"
                  value={editForm.aadharNumber}
                  onChange={(e) => setEditForm({ ...editForm, aadharNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
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
                    src={`${baseURl}/${currentAvatar}`}
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
                  setEditingStudent(null);
                  setEditAvatarFile(null);
                  setCurrentAvatar(null);
                  setAvailableSections([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isEditSubmitting}>
                {isEditSubmitting ? 'Updating...' : 'Update Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Student Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete information about the student.
            </DialogDescription>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted overflow-hidden">
                  {viewingStudent.profileImage ? (
                    <Image
                      src={`${baseURl}${viewingStudent.profileImage}`}
                      alt={viewingStudent.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{viewingStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewingStudent.email}</p>
                  <Badge variant={getStatusBadgeVariant(viewingStudent.status)}>
                    {viewingStudent.status.charAt(0).toUpperCase() + viewingStudent.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{viewingStudent.rollNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-medium">{viewingStudent.admissionNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewingStudent.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{viewingStudent.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{viewingStudent.dateOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{viewingStudent.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{getClassName(viewingStudent.classId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{getSectionName(viewingStudent.sectionId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{viewingStudent.address || 'N/A'}</p>
                </div>
                {viewingStudent.qrCode && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">QR Code</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-1"
                      onClick={() => handleViewQR(viewingStudent)}
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
            <DialogTitle>Reset Student Password</DialogTitle>
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
                  setResetPasswordStudentId(null);
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
            <DialogTitle>Student QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to access student information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeUrl && (
              <>
                <div className="relative w-48 h-48 bg-white rounded-lg overflow-hidden">
                  <Image
                    src={qrCodeUrl}
                    alt="Student QR Code"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateQR}
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