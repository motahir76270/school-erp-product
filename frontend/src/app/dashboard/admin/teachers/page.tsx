'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, User, RefreshCw, Edit2, MoreVertical, Plus, ChevronLeft, ChevronRight, QrCode, Eye, Key, ScanFace } from 'lucide-react';
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
  getAllTeachersApiCall,
  hardDeleteTeacherApiCall,
  updateTeacherStatusApiCall,
  getTeacherByIdApiCall,
  regenerateTeacherQRCodeApiCall,
  setTeachers,
  setLoading,
  setPagination,
} from '@/store/slices/teacherSlice';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { EditTeacherModal } from '@/src/components/modal/teacher/EditTeacherModal';
import { CreateTeacherModal } from '@/src/components/modal/teacher/CreateTeacherModal';
import { ViewTeacherModal } from '@/src/components/modal/teacher/ViewTeacherModal';
import { FaceScanModal } from '@/src/components/modal/teacher/FaceScanModal';
import { ResetPasswordModal } from '@/src/components/modal/teacher/ResetPasswordModal';
import { QRCodeModal } from '@/src/components/modal/teacher/QRCodeModal';


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
  const { teachers, loading, pagination } = useAppSelector((state: any) => state.teacher);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFaceScanModalOpen, setIsFaceScanModalOpen] = useState(false);

  // Data states
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [resetPasswordTeacherId, setResetPasswordTeacherId] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const [selectedTeacherForFaceScan, setSelectedTeacherForFaceScan] = useState<Teacher | null>(null);

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
  }, [search, currentPage, statusFilter, dispatch]);

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
        setEditingTeacher(teacher);
        setIsEditModalOpen(true);
  };

  // View Teacher
  const handleViewClick = async (teacher: Teacher) => {
        setViewingTeacher(teacher);
        setIsViewModalOpen(true);
  };

  // Reset Password
  const handleResetPassword = (teacherId: string) => {
    setResetPasswordTeacherId(teacherId);
    setIsResetPasswordModalOpen(true);
  };

  // View QR Code - FIXED: No API call needed, use existing teacher data
  const handleViewQR = (teacher: Teacher) => {
    if (teacher.qrCode) {
      const qrCodeUrl = `${baseURl}${teacher.qrCode}`;
      setQrCodeData(qrCodeUrl);
      setIsQRModalOpen(true);
    } else {
      toast.info('No QR code found for this teacher');
    }
  };

  // Regenerate QR Code
  const handleRegenerateQR = async () => {
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
          setQrCodeData({
            qrCode: data.data.qrCode,
            qrCodeUrl: `${baseURl}${data.data.qrCode}`,
          });
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

  // Open Face Scan modal
  const handleFaceScanClick = (teacher: Teacher) => {
    setSelectedTeacherForFaceScan(teacher);
    setIsFaceScanModalOpen(true);
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
                                src={`${baseURl}/${teacher.profileImage}`}
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
                            <DropdownMenuItem onClick={() => handleFaceScanClick(teacher)}>
                              <ScanFace className="mr-2 h-4 w-4" />
                              Face Scan Attendance
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

      {/* Modals */}
      <CreateTeacherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchTeachers(currentPage)}
      />

      <EditTeacherModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTeacher(null);
        }}
        onSuccess={() => fetchTeachers(currentPage)}
        teacher={editingTeacher}
        baseUrl={baseURl}
      />

      <ViewTeacherModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingTeacher(null);
        }}
        teacher={viewingTeacher}
        baseUrl={baseURl}
        onViewQR={handleViewQR}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setResetPasswordTeacherId(null);
        }}
        teacherId={resetPasswordTeacherId}
        onSuccess={() => fetchTeachers(currentPage)}
      />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setQrCodeData(null);
        }}
        qrCodeData={qrCodeData}
        onRegenerate={handleRegenerateQR}
        isRegenerating={isRegeneratingQR}
      />

      <FaceScanModal
        isOpen={isFaceScanModalOpen}
        onClose={() => {
          setIsFaceScanModalOpen(false);
          setSelectedTeacherForFaceScan(null);
        }}
        teacherId={selectedTeacherForFaceScan?.id}
        teacherName={selectedTeacherForFaceScan?.name}
        onSuccess={(data: any) => {
          console.log('Attendance marked:', data);
          // Optionally refresh data or show additional notifications
        }}
      />
    </div>
  );
}