// dashboard/admin/attendance/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Calendar,
  Eye,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-toastify';
import { getAttendanceByDateApiCall, deleteAttendanceApiCall } from '@/store/slices/attendanceSlice';
import { getAllClassWithSections } from '@/store/slices/classSlice';
import { format as formatDateFn, parseISO } from 'date-fns';

interface Student {
  id: string;
  userId: string;
  username: string;
  email: string;
  name: string;
  password: string;
  role: string;
  rollNumber: string;
  admissionNumber: string;
  classId: string;
  sectionId: string | null;
  dateOfBirth: string;
  gender: string | null;
  profileImage: string | null;
  bloodGroup: string | null;
  religion: string | null;
  caste: string | null;
  nationality: string | null;
  aadharNumber: string | null;
  admissionDate: string;
  qrCode: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceLog {
  id: string;
  attendanceId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  markedAt: string;
  student: Student;
}

interface AttendanceData {
  id: string;
  date: string;
  classId: string;
  sectionId: string | null;
  markedBy: string;
  markingMethod: 'manual' | 'qrcode';
  createdAt: string;
}

interface AttendanceResponse {
  success: boolean;
  message: string;
  data: {
    attendance: AttendanceData;
    logs: AttendanceLog[];
    totalStudents: number;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  sectionId: string | null;
  markedBy: string;
  markingMethod: 'manual' | 'qrcode';
  createdAt: string;
  logs: AttendanceLog[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
}

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceHistory();
    }
  }, [selectedClass, selectedSection, startDate, endDate]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const data = await getAllClassWithSections(token);
      if (data?.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedClass) {
      setAttendanceRecords([]);
      setFilteredRecords([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const params: any = {
        classId: selectedClass,
      };
      
      if (selectedSection) params.sectionId = selectedSection;
      
      // If date range is selected, fetch multiple dates
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateList: string[] = [];
        const current = new Date(start);
        
        while (current <= end) {
          dateList.push(formatDateFn(current, 'yyyy-MM-dd'));
          current.setDate(current.getDate() + 1);
        }

        const records = await Promise.all(
          dateList.map(async (date) => {
            try {
              const response = await getAttendanceByDateApiCall(token, {
                ...params,
                date,
              });
              
              if (response?.success && response.data?.attendance) {
                const data = response.data;
                const logs = data.logs || [];
                const stats = calculateStats(logs);
                
                return {
                  id: data.attendance.id,
                  date: data.attendance.date,
                  classId: data.attendance.classId,
                  sectionId: data.attendance.sectionId,
                  markedBy: data.attendance.markedBy,
                  markingMethod: data.attendance.markingMethod,
                  createdAt: data.attendance.createdAt,
                  logs: logs,
                  stats: stats,
                };
              }
              return null;
            } catch {
              return null;
            }
          })
        );

        const validRecords = records.filter((r): r is AttendanceRecord => r !== null);
        setAttendanceRecords(validRecords);
        setFilteredRecords(validRecords);
      } else {
        // Fetch attendance for a specific date
        const dateToFetch = startDate || formatDateFn(new Date(), 'yyyy-MM-dd');
        const response = await getAttendanceByDateApiCall(token, {
          ...params,
          date: dateToFetch,
        });

        if (response?.success && response.data?.attendance) {
          const data = response.data;
          const logs = data.logs || [];
          const stats = calculateStats(logs);
          
          const record: AttendanceRecord = {
            id: data.attendance.id,
            date: data.attendance.date,
            classId: data.attendance.classId,
            sectionId: data.attendance.sectionId,
            markedBy: data.attendance.markedBy,
            markingMethod: data.attendance.markingMethod,
            createdAt: data.attendance.createdAt,
            logs: logs,
            stats: stats,
          };
          
          setAttendanceRecords([record]);
          setFilteredRecords([record]);
        } else {
          setAttendanceRecords([]);
          setFilteredRecords([]);
          toast.info('No attendance records found for this date');
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch attendance history');
      setAttendanceRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: AttendanceLog[]) => {
    const stats = {
      total: logs.length,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
    };
    
    logs.forEach(log => {
      switch (log.status) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'leave':
          stats.leave++;
          break;
      }
    });
    
    return stats;
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = attendanceRecords.filter(record =>
        record.logs.some(log => 
          log.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.student?.rollNumber?.includes(searchTerm) ||
          log.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(attendanceRecords);
    }
  }, [searchTerm, attendanceRecords]);

  const handleViewRecord = (record: AttendanceRecord) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const data = await deleteAttendanceApiCall(token, recordId);
      if (data?.success) {
        toast.success(data?.message || 'Attendance record deleted successfully');
        fetchAttendanceHistory();
      } else {
        toast.error(data?.message || 'Failed to delete attendance record');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete attendance record');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'leave':
        return <Badge className="bg-blue-500">Leave</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateFn(parseISO(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateFn(parseISO(dateString), 'hh:mm a');
    } catch {
      return dateString;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const getStatsSummary = (record: AttendanceRecord) => {
    const stats = record.stats || {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
    };
    const percentage = stats.total > 0 
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0;
    return { ...stats, percentage };
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendance History" 
        description="View and manage past attendance records"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value);
                  const classData = classes.find(c => c.id === value);
                  setSections(classData?.sections || []);
                  setSelectedSection('');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
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
              <Label>Section</Label>
              <Select
                value={selectedSection}
                onValueChange={(value) => {
                  setSelectedSection(value);
                  setCurrentPage(1);
                }}
                disabled={!sections.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sections.length ? "Select section" : "No sections"} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                  disabled={!selectedClass}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchTerm('');
                fetchAttendanceHistory();
              }}
              disabled={!selectedClass}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance Records
            {selectedClass && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredRecords.length} records found)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            View and manage attendance history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              Please select a class to view attendance history
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              No attendance records found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Attendance %</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((record) => {
                      const stats = getStatsSummary(record);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {formatDate(record.date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{stats.total}</TableCell>
                          <TableCell className="text-green-600">{stats.present}</TableCell>
                          <TableCell className="text-red-600">{stats.absent}</TableCell>
                          <TableCell className="text-yellow-600">{stats.late}</TableCell>
                          <TableCell>
                            <Badge variant={stats.percentage >= 75 ? 'default' : 'destructive'}>
                              {stats.percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.markingMethod === 'qrcode' ? 'QR' : 'Manual'}
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
                                <DropdownMenuItem onClick={() => handleViewRecord(record)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              Detailed attendance record for {viewingRecord ? formatDate(viewingRecord.date) : ''}
            </DialogDescription>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{viewingRecord.stats?.total || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-green-600">
                    {viewingRecord.stats?.present || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {viewingRecord.stats?.absent || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {viewingRecord.stats?.late || 0}
                  </p>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingRecord.logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {log.student?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>{log.student?.rollNumber || 'N/A'}</TableCell>
                        <TableCell>{log.student?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            {getStatusBadge(log.status)}
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(log.markedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}