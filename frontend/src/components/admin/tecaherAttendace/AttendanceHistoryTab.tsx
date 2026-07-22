// app/dashboard/attendance/teacher-attendance/components/AttendanceHistoryTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  MoreVertical,
  Loader2,
  UserCheck,
  UserX,
  Clock,
  UserMinus
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getTeacherAttendanceByTeacherApiCall,
  updateTeacherAttendanceStatusApiCall,
  deleteTeacherAttendanceApiCall,
  setLoading,
  setTeacherAttendance,
  setTeacherAttendancePagination,
} from '@/store/slices/attandance/teacherAttendanceSlice';

export const AttendanceHistoryTab = () => {
  const dispatch = useAppDispatch();
  const { teacherAttendance, pagination, loading } = useAppSelector((state: any) => state.teacherAttendance);
  const { teachers } = useAppSelector((state: any) => state.teacher);

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');

  const filteredTeachersForDropdown = teachers.filter((teacher: any) => {
    const search = teacherSearchTerm.toLowerCase();
    return (
      teacher.name?.toLowerCase().includes(search) ||
      teacher.employeeId?.toLowerCase().includes(search) ||
      teacher.email?.toLowerCase().includes(search)
    );
  });

  const fetchHistory = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    if (!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }

    dispatch(setLoading(true));
    try {
      const params: any = {
        limit: pagination.limit || 10,
        offset: (currentPage - 1) * (pagination.limit || 10)
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await getTeacherAttendanceByTeacherApiCall(token, selectedTeacher, params);

      if (data?.success === true) {
        dispatch(setTeacherAttendance(data.data.logs || []));
        if (data.data.pagination) {
          dispatch(setTeacherAttendancePagination(data.data.pagination));
        }
      } else {
        toast.error(data?.message || 'Failed to fetch attendance history');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch attendance history');
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (selectedTeacher) {
      fetchHistory();
    }
  }, [selectedTeacher, currentPage, startDate, endDate]);

  const filteredLogs = teacherAttendance.filter((log: any) => {
    const matchesSearch =
      log.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.teacherEmployeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      present: 'default',
      absent: 'destructive',
      late: 'warning',
      leave: 'secondary'
    };
    return variants[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <UserCheck className="h-4 w-4" />;
      case 'absent': return <UserX className="h-4 w-4" />;
      case 'late': return <Clock className="h-4 w-4" />;
      case 'leave': return <UserMinus className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = async (attendanceId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await deleteTeacherAttendanceApiCall(token, attendanceId);
      if (data?.success) {
        toast.success('Attendance record deleted successfully');
        fetchHistory();
      } else {
        toast.error(data?.message || 'Failed to delete record');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete record');
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleUpdateStatus = async (logId: string, status: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await updateTeacherAttendanceStatusApiCall(token, logId, { status });
      if (data?.success) {
        toast.success('Status updated successfully');
        fetchHistory();
      } else {
        toast.error(data?.message || 'Failed to update status');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label>Search Teacher</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email..."
              value={teacherSearchTerm}
              onChange={(e) => setTeacherSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1">
          <Label>Select Teacher</Label>
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger>
              <SelectValue placeholder={teacherSearchTerm ? "Select from filtered list" : "Select a teacher"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {filteredTeachersForDropdown.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground text-sm">
                  {teacherSearchTerm ? 'No teachers found matching your search' : 'No teachers available'}
                </div>
              ) : (
                filteredTeachersForDropdown.map((teacher: any) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    <div className="flex flex-col">
                      <span>{teacher.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {teacher.employeeId} • {teacher.email}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {teacherSearchTerm && filteredTeachersForDropdown.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Found {filteredTeachersForDropdown.length} teacher{filteredTeachersForDropdown.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={fetchHistory} disabled={loading || !selectedTeacher}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label>Search in History</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by teacher name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-[150px]">
          <Label>Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Marked At</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading attendance history...
                </TableCell>
              </TableRow>
            ) : !selectedTeacher ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Please search and select a teacher to view history
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No records match your filters'
                    : 'No attendance records found for this teacher'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.date ? format(new Date(log.date), 'dd MMM yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.teacherName || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{log.teacherEmployeeId || ''}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(log.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(log.status)}
                      {log.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.markedAt ? format(new Date(log.markedAt), 'hh:mm a') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.markingMethod || 'manual'}
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
                        <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(log.id, 'present')}
                          className="text-green-600"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Mark Present
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(log.id, 'absent')}
                          className="text-red-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Mark Absent
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(log.id, 'late')}
                          className="text-yellow-600"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Mark Late
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteId(log.id);
                            setIsDeleteConfirmOpen(true);
                          }}
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
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} • Showing {filteredLogs.length} records • Total: {pagination.total || 0}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={filteredLogs.length < pagination.limit}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Attendance Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              Complete information about this attendance record.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {selectedLog.date ? format(new Date(selectedLog.date), 'dd MMM yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadge(selectedLog.status)}>
                    {selectedLog.status?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marked At</p>
                  <p className="font-medium">
                    {selectedLog.markedAt ? format(new Date(selectedLog.markedAt), 'hh:mm a') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">{selectedLog.markingMethod || 'Manual'}</p>
                </div>
                {selectedLog.teacherName && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Teacher</p>
                    <p className="font-medium">{selectedLog.teacherName}</p>
                  </div>
                )}
                {selectedLog.teacherEmployeeId && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{selectedLog.teacherEmployeeId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleDelete(deleteId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};