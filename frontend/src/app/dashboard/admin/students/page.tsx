// app/dashboard/students/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw, 
  MoreVertical, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  User,
  Eye,
  Edit2,
  Key,
  QrCode,
  Trash2,
  ScanFace,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  hardDeleteStudentApiCall,
  updateStudentStatusApiCall,
  getStudentByIdApiCall,
  setStudents,
  setLoading,
  setPagination,
} from '@/store/slices/studentSlice';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { getAllClassWithSections } from '@/src/store/slices/classSlice';
import CreateStudentModal from '@/src/components/modal/student/CreateStudentModal';
import EditStudentModal from '@/src/components/modal/student/EditStudentModal';
import ViewStudentModal from '@/src/components/modal/student/ViewStudentModal';
import ResetPasswordModal from '@/src/components/modal/student/ResetPasswordModal';
import QRCodeModal from '@/src/components/modal/student/QRCodeModal';
import FaceRecognitionModal from '@/src/components/modal/student/FaceRecognitionModal';



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
  hasFace?: boolean; // Optional field for face recognition status
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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordStudentId, setResetPasswordStudentId] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeStudentId, setQrCodeStudentId] = useState<string | null>(null);
  const [isFaceRecognitionModalOpen, setIsFaceRecognitionModalOpen] = useState(false);
  const [faceRecognitionStudentId, setFaceRecognitionStudentId] = useState<string | null>(null);
  const [faceRecognitionStudentName, setFaceRecognitionStudentName] = useState<string | undefined>();

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

  // Handle class filter change
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

  // Fetch students
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

  useEffect(() => {
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

  // Edit Student
  const handleEditClick = async (student: Student) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await getStudentByIdApiCall(token, student.id);
      if (data?.success === true) {
        setEditingStudent(data.data.student);
        setIsEditModalOpen(true);
      } else {
        toast.error(data?.message || 'Failed to fetch student details');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch student details');
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

  // Face Recognition
  const handleFaceRecognition = async (student: Student) => {
    setFaceRecognitionStudentId(student.id);
    setFaceRecognitionStudentName(student.name);
    setIsFaceRecognitionModalOpen(true);
  };

  // Reset Password
  const handleResetPassword = (studentId: string) => {
    setResetPasswordStudentId(studentId);
    setIsResetPasswordModalOpen(true);
  };

  // Helper functions
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || classId;
  };

  const getSectionName = (sectionId: string | null) => {
    if (!sectionId) return 'N/A';
    for (const cls of classes) {
      const section = cls.sections.find(s => s.id === sectionId);
      if (section) return section.name;
    }
    return sectionId;
  };

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
                      {cls.name}
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
                      {section.name}
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
                  <TableHead>Face</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : !filteredStudents || filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                      <TableCell>
                        {student.hasFace ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Enrolled
                          </Badge>
                        )}
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
                            <DropdownMenuItem onClick={() => handleFaceRecognition(student)}>
                              <ScanFace className="mr-2 h-4 w-4" />
                              Add Face
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

      {/* Create Student Modal */}
      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        classes={classes}
        isLoadingClasses={isLoadingClasses}
        onSuccess={() => fetchStudents(currentPage)}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        classes={classes}
        isLoadingClasses={isLoadingClasses}
        baseUrl={baseURl}
        onSuccess={() => fetchStudents(currentPage)}
      />

      {/* View Student Modal */}
      <ViewStudentModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingStudent(null);
        }}
        student={viewingStudent}
        baseUrl={baseURl}
        getClassName={getClassName}
        getSectionName={getSectionName}
        getStatusBadgeVariant={getStatusBadgeVariant}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setResetPasswordStudentId(null);
        }}
        studentId={resetPasswordStudentId}
        onSuccess={() => fetchStudents(currentPage)}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setQrCodeUrl(null);
          setQrCodeStudentId(null);
        }}
        qrCodeUrl={qrCodeUrl}
        studentId={qrCodeStudentId}
        onRegenerate={() => {
          fetchStudents(currentPage);
          if (qrCodeStudentId) {
            const token = localStorage.getItem('accessToken');
            if (token) {
              getStudentByIdApiCall(token, qrCodeStudentId).then((data) => {
                if (data?.success && data.data.student.qrCode) {
                  setQrCodeUrl(`${baseURl}${data.data.student.qrCode}`);
                }
              });
            }
          }
        }}
      />

      {/* Face Recognition Modal */}
      <FaceRecognitionModal
        isOpen={isFaceRecognitionModalOpen}
        onClose={() => {
          setIsFaceRecognitionModalOpen(false);
          setFaceRecognitionStudentId(null);
          setFaceRecognitionStudentName(undefined);
        }}
        studentId={faceRecognitionStudentId}
        studentName={faceRecognitionStudentName}
        baseUrl={baseURl}
        onSuccess={() => fetchStudents(currentPage)}
      />
    </div>
  );
}