// dashboard/admin/attendance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Users, QrCode, History, Clock, CheckCircle, 
  XCircle, AlertCircle, UserCheck, ScanFace, Camera,
  Download, Filter, Search 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getTodayAttendanceApiCall } from '@/src/store/slices/attandance/studanceAttendanceSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ManualAttendancePage from './manual/page';
import QRScanAttendancePage from './qr-scan/page';
import AttendanceHistoryPage from './history/page';
import FaceScanAttendancePage from '@/src/components/admin/studentAttendance/FaceScanAttendance';



// Main Dashboard Component
export default function AttendanceDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state:any) => state.auth);
  const { todayAttendance, stats, isLoading } = useAppSelector((state) => state.studentAttendance);
  const [todayDate] = useState(format(new Date(), 'dd MMMM yyyy'));

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
      const data = await getTodayAttendanceApiCall(token, {
        classId: user?.classId || '',
        sectionId: user?.sectionId || '',
      });
      
      if (data?.success) {
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

  return (
    <div className="space-y-6">

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

      {/* Tabs Section */}
      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Scan
          </TabsTrigger>
          <TabsTrigger value="face" className="flex items-center gap-2">
            <ScanFace className="h-4 w-4" />
            Face Scan
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <ManualAttendancePage />
        </TabsContent>

        <TabsContent value="qr">
          <QRScanAttendancePage />
        </TabsContent>

        <TabsContent value="face">
          <FaceScanAttendancePage />
        </TabsContent>

        <TabsContent value="history">
          <AttendanceHistoryPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}