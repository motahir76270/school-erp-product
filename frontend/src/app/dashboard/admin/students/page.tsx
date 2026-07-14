'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  User,
  QrCode,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppDispatch, RootState } from '@/store';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { deleteStudent, fetchStudents, clearError } from '@/src/store/slices/studentSlice';

export default function StudentsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { students, isLoading, error, pagination } = useSelector(
    (state: RootState) => state.student
  );
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch students on mount and when search/pagination changes
  useEffect(() => {
    dispatch(fetchStudents({
      search: debouncedSearch || undefined,
      page: pagination.page,
      limit: pagination.limit,
    }));
  }, [dispatch, debouncedSearch, pagination.page]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    const result = await dispatch(deleteStudent(id));
    if (deleteStudent.fulfilled.match(result)) {
      toast.success(`${name} deleted successfully`);
      // Refresh the list
      dispatch(fetchStudents({
        search: debouncedSearch || undefined,
        page: pagination.page,
        limit: pagination.limit,
      }));
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(fetchStudents({
        search: debouncedSearch || undefined,
        page: newPage,
        limit: pagination.limit,
      }));
    }
  };

  const handleViewQR = (student: any) => {
    setSelectedStudent(student);
    setShowQRDialog(true);
  };

  const downloadQR = (qrCodeImage: string, studentName: string) => {
    if (!qrCodeImage) return;
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `QR-${studentName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Students" 
        description="Manage student records, profiles, and QR codes"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>
                {pagination.total} students found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px] sm:w-[300px]"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => dispatch(fetchStudents({
                  search: debouncedSearch || undefined,
                  page: 1,
                  limit: pagination.limit,
                }))}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Link href="/dashboard/admin/students/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading students...</p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No students found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? 'Try adjusting your search' : 'Get started by adding a new student'}
              </p>
              {!search && (
                <Link href="/dashboard/admin/students/create">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Admission</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                              {student.user?.profileImage ? (
                                <Image
                                  src={student.user.profileImage}
                                  alt={`${student.user.firstName} ${student.user.lastName}`}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground m-2.5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {student.user?.firstName} {student.user?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {student.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
                        <TableCell>
                          {student.class?.name || `Class ${student.classId}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.isActive ? 'default' : 'secondary'}>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/admin/students/view/${student.id}`}>
                              <Button variant="ghost" size="icon" title="View Profile">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/admin/students/edit/${student.id}`}>
                              <Button variant="ghost" size="icon" title="Edit Student">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View QR Code"
                              onClick={() => handleViewQR(student)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Student"
                              onClick={() => handleDelete(
                                student.id,
                                `${student.user?.firstName} ${student.user?.lastName}`
                              )}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} students
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            className="w-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
            <DialogDescription>
              {selectedStudent?.user?.firstName} {selectedStudent?.user?.lastName} - {selectedStudent?.rollNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {selectedStudent?.qrCodeImage ? (
              <>
                <Image
                  src={selectedStudent.qrCodeImage}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="border rounded-lg p-2"
                />
                <div className="text-sm text-muted-foreground text-center">
                  <p>Roll Number: <span className="font-medium">{selectedStudent.rollNumber}</span></p>
                  <p>Admission: <span className="font-medium">{selectedStudent.admissionNumber}</span></p>
                  <p>Student ID: <span className="font-medium">#{selectedStudent.id}</span></p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={() => downloadQR(
                      selectedStudent.qrCodeImage,
                      `${selectedStudent.user?.firstName}-${selectedStudent.user?.lastName}`
                    )}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowQRDialog(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">No QR code available</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setShowQRDialog(false);
                    // Navigate to regenerate or show message
                    toast.info('Please regenerate QR code from the student profile');
                  }}
                >
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}