// dashboard/admin/fee/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllFeeTypesApiCall,
  getAllStudentFeesApiCall,
  getAllPaymentsApiCall,
  getAllPenaltiesApiCall,
  setFeeTypes,
  setStudentFees,
  setPayments,
  setPenalties,
  setLoading,
  setError,
  setStudentFeesCount,
} from '@/store/slices/feeSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Calendar,
  Plus,
  Eye,
  ArrowRight,
  Download,
  FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  totalFees: number;
  collectedFees: number;
  pendingFees: number;
  overdueFees: number;
  totalStudents: number;
  totalPayments: number;
  totalPenalties: number;
  collectionRate: number;
}

export default function FeeDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { feeTypes, studentFeesCount, payments, penalties, loading } = useAppSelector((state) => state.fee);
    console.log(studentFeesCount);
    
  const [stats, setStats] = useState<DashboardStats>({
    totalFees: 0,
    collectedFees: 0,
    pendingFees: 0,
    overdueFees: 0,
    totalStudents: 0,
    totalPayments: 0,
    totalPenalties: 0,
    collectionRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [feeTypeData, setFeeTypeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      // Fetch all data
      const res:any = await  getAllStudentFeesApiCall(token)
        if(res?.success === true){
          dispatch(setStudentFeesCount(res?.data))
        }else{
          toast.error("Failed", res?.message)
        }
    } catch (error: any) {
      console.error('Fetch dashboard error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch dashboard data');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch dashboard data'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dispatch]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const StatCard = ({ title, value, icon: Icon, description, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">
              {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fee Management" 
        description="Overview of all fee collections and management"
      />
 

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Fees Amount"
          value={studentFeesCount.totalAmount}
          icon={DollarSign}
          color="bg-blue-500"
          description={`${feeTypes.length} fee types`}
        />
        <StatCard
          title="Collected"
          value={studentFeesCount.collectedAmount}
          icon={CreditCard}
          color="bg-green-500"
          description={`${studentFeesCount.collectedAmount}% collection rate`}
        />
        <StatCard
          title="Pending"
          value={studentFeesCount.pendingAmount}
          icon={AlertCircle}
          color="bg-yellow-500"
          description={`${studentFeesCount.pendingAmount} students`}
        />
        <StatCard
          title="Overdue"
          value={studentFeesCount.overdueAmount}
          icon={TrendingUp}
          color="bg-red-500"
          description={`₹${stats.totalPenalties.toFixed(2)} penalties`}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('fees/assign')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assign Fee</p>
              <p className="text-sm mt-1">Add fee to student</p>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('fees/collect/studentFee')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collect Fee And Recipts</p>
              <p className="text-sm mt-1">Students fee</p>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('fees/receipts')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Manage Receipts</p>
              <p className="text-sm mt-1">Record payment</p>
            </div>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('fees/pending')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Fees</p>
              <p className="text-sm mt-1">View all pending</p>
            </div>
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('fees/reports')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reports</p>
              <p className="text-sm mt-1">Download reports</p>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Collections</CardTitle>
            <CardDescription>Fee collected per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Distribution</CardTitle>
            <CardDescription>By fee type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feeTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Status Overview</CardTitle>
          <CardDescription>Distribution of fee statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm">{item.name}</span>
                <Badge variant="secondary">{item.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest fee transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Received</p>
                    <p className="text-xs text-muted-foreground">
                      Receipt #{payment.receiptNumber} • {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">+₹{parseFloat(payment.amount).toFixed(2)}</p>
                  <Badge variant="outline">{payment.paymentMode}</Badge>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent payments</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}