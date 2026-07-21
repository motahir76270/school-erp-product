// dashboard/admin/attendance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, QrCode, History, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getTodayAttendanceApiCall } from '@/src/store/slices/attandance/studanceAttendanceSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function AttendanceDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state:any) => state.auth);
  const { todayAttendance, stats, isLoading } = useAppSelector((state) => state.attendance);
  const [todayDate, setTodayDate] = useState(format(new Date(), 'dd MMMM yyyy'));

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      // Get today's attendance for the admin's class/section
      const data = await getTodayAttendanceApiCall(token, {
        classId: user?.classId || '',
        sectionId: user?.sectionId || '',
      });
      
      if (data?.success) {
        // Update state with today's attendance
        console.log('Today\'s attendance:', data.data);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch today\'s attendance');
    }
  };

  const statsCards = [
    {
      title: 'Total Students',
      value: stats.total || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Present',
      value: stats.present || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Absent',
      value: stats.absent || 0,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      title: 'Late',
      value: stats.late || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Manually mark student attendance',
      icon: Users,
      href: '/dashboard/admin/attendance/manual',
      color: 'bg-blue-500',
    },
    {
      title: 'QR Scan',
      description: 'Scan QR code to mark attendance',
      icon: QrCode,
      href: '/dashboard/admin/attendance/qr-scan',
      color: 'bg-purple-500',
    },
    {
      title: 'Attendance History',
      description: 'View past attendance records',
      icon: History,
      href: '/dashboard/admin/attendance/history',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendance Management" 
        description="Track and manage student attendance"
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-full ${stat.bg} p-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Attendance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance Overview</CardTitle>
          <CardDescription>
            Summary of attendance for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : todayAttendance.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Present</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.present || 0}/{stats.total || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${stats.total > 0 ? ((stats.present || 0) / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <Badge variant="default" className="text-lg px-4 py-2">
                  {stats.total > 0 
                    ? Math.round(((stats.present || 0) / stats.total) * 100) 
                    : 0}%
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.present || 0}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.absent || 0}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.late || 0}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance marked for today</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/dashboard/admin/attendance/manual')}
              >
                Mark Attendance Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(action.href)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg ${action.color} p-3 text-white`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}