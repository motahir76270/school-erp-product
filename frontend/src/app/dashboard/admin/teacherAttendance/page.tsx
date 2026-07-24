// app/dashboard/attendance/teacher-attendance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import {
  UserCheck,
  QrCode,
  History,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react';
import {
  markTeacherAttendanceApiCall,
  markTeacherAttendanceViaQRApiCall,
  getTodayTeacherAttendanceApiCall,
  getTeacherAttendanceByTeacherApiCall,
  updateTeacherAttendanceStatusApiCall,
  deleteTeacherAttendanceApiCall,
  setLoading,
  setTodayTeacherAttendance,
  setTeacherAttendance,
  setTeacherAttendancePagination,
} from '@/store/slices/attandance/teacherAttendanceSlice';
import { getAllTeachersApiCall, setTeachers, setPagination } from '@/store/slices/teacherSlice';
import { ManualAttendanceTab } from '@/src/components/admin/tecaherAttendace/ManualAttendanceTab';
import { QRScanAttendanceTab } from '@/src/components/admin/tecaherAttendace/QRScanAttendanceTab';
import { AttendanceHistoryTab } from '@/src/components/admin/tecaherAttendace/AttendanceHistoryTab';
import FaceScanAttendanceTab from '@/src/components/admin/tecaherAttendace/faceScanAttendanceTab';



// ==================== MAIN PAGE ====================

export default function TeacherAttendancePage() {
  const dispatch = useAppDispatch();
  const { teachers, loading: teachersLoading } = useAppSelector((state: any) => state.teacher);
  const { isLoading: attendanceLoading, todayAttendance } = useAppSelector((state: any) => state.teacherAttendance);
  const [activeTab, setActiveTab] = useState('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch teachers with pagination, search, filter
  const fetchTeachers = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      dispatch(setLoading(true));
      const data = await getAllTeachersApiCall(token, currentPage, searchTerm, statusFilter);
      if (data?.success === true) {
        dispatch(setTeachers(data.data.teachers || []));
        if (data.data.pagination) {
          dispatch(setPagination(data.data.pagination));
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch teachers');
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const data = await getTodayTeacherAttendanceApiCall(token);
      if (data?.success === true) {
        dispatch(setTodayTeacherAttendance(data.data));
      }
    } catch (error: any) {
      console.error('Failed to fetch today attendance:', error);
    }
  };

  const handleManualAttendance = async (payload: any) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const data = await markTeacherAttendanceApiCall(token, payload);
      if (data?.success === true) {
        toast.success(data?.message || 'Attendance marked successfully');
        fetchTodayAttendance();
        return { success: true };
      } else {
        toast.error(data?.message || 'Failed to mark attendance');
        return { success: false };
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark attendance');
      return { success: false };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleQRAttendance = async (payload: any) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return { success: false };
    }

    dispatch(setLoading(true));
    try {
      const data = await markTeacherAttendanceViaQRApiCall(token, payload);
      if (data?.success === true) {
        toast.success(data?.message || 'Attendance marked via QR successfully');
        return data;
      } else {
        toast.error(data?.message || 'Failed to mark attendance via QR');
        return { success: false, message: data?.message };
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark attendance via QR');
      return { success: false, message: error?.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getAttendanceStats = () => {
    if (!todayAttendance) return null;
    const stats = {
      total: todayAttendance.totalTeachers || 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      unmarked: todayAttendance.totalUnmarked || 0
    };

    if (todayAttendance.logs) {
      todayAttendance.logs.forEach((log: any) => {
        if (log.status === 'present') stats.present++;
        else if (log.status === 'absent') stats.absent++;
        else if (log.status === 'late') stats.late++;
        else if (log.status === 'leave') stats.leave++;
      });
    }

    return stats;
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Attendance"
        description="Manage teacher attendance through manual marking, QR scanning, and view history."
      />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchTodayAttendance()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

      {/* Today's Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Teachers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Leave</p>
                <p className="text-2xl font-bold text-blue-600">{stats.leave}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Unmarked</p>
                <p className="text-2xl font-bold text-gray-600">{stats.unmarked}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
          <CardDescription>
            Mark attendance manually, scan QR codes, or view attendance history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 md-grid-cols-2 sm-grid-cols-1">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Manual Attendance
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="face" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Face Scan
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-6">
              <ManualAttendanceTab
                teachers={teachers || []}
                loading={attendanceLoading || teachersLoading}
                onSubmit={handleManualAttendance}
              />
            </TabsContent>

            <TabsContent value="qr" className="mt-6">
              <QRScanAttendanceTab
                teachers={teachers || []}
                loading={attendanceLoading}
                onQRSubmit={handleQRAttendance}
              />
            </TabsContent>

            <TabsContent value="face" className="mt-6">
              <FaceScanAttendanceTab/>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <AttendanceHistoryTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}