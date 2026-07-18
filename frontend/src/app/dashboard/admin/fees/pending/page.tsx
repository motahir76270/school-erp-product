// dashboard/admin/fee/pending/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllStudentFeesApiCall,
  setStudentFees,
  setLoading,
  setError,
} from '@/store/slices/feeSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, CreditCard, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PendingFeesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { studentFees, loading } = useAppSelector((state) => state.fee);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [classes, setClasses] = useState<any[]>([]);

  const fetchPendingFees = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const params: any = { limit: 100 };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await getAllStudentFeesApiCall(token, params);

      if (response?.success) {
        dispatch(setStudentFees(response.data));
        // Extract unique classes
        const uniqueClasses = response.data.fees
          .map((f: any) => f.student?.class)
          .filter((c: any, i: number, arr: any[]) => c && arr.indexOf(c) === i);
        setClasses(uniqueClasses);
      } else {
        toast.error(response?.message || 'Failed to fetch fees');
      }
    } catch (error: any) {
      console.error('Fetch pending fees error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch fees');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch fees'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchPendingFees();
  }, [filterStatus]);

  const filteredFees = studentFees.filter((fee: any) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch = 
      fee.student?.name?.toLowerCase().includes(searchTerm) ||
      fee.student?.admissionNumber?.toLowerCase().includes(searchTerm) ||
      fee.feeType?.name?.toLowerCase().includes(searchTerm);
    
    const matchesClass = filterClass === 'all' || fee.student?.classId === filterClass;
    
    return matchesSearch && matchesClass;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500',
      partial: 'bg-blue-500',
      paid: 'bg-green-500',
      overdue: 'bg-red-500',
    };
    return variants[status] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      partial: 'text-blue-600',
      paid: 'text-green-600',
      overdue: 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getTotalPending = () => {
    return filteredFees.reduce((sum: number, fee: any) => {
      const remaining = parseFloat(fee.amount) - parseFloat(fee.paidAmount || 0);
      return sum + remaining;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pending Fees" 
        description="View and manage all pending fee collections"
      />
 

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">₹{getTotalPending().toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredFees.filter((f: any) => f.status === 'overdue').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partial Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredFees.filter((f: any) => f.status === 'partial').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee List</CardTitle>
          <CardDescription>All pending and overdue fees</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student or fee type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No pending fees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFees.map((fee: any) => {
                    const remaining = parseFloat(fee.amount) - parseFloat(fee.paidAmount || 0);
                    return (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{fee.student?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {fee.student?.admissionNumber || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{fee.feeType?.name || 'Unknown'}</TableCell>
                        <TableCell>₹{parseFloat(fee.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          ₹{parseFloat(fee.paidAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className={`font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{remaining.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className={new Date(fee.dueDate) < new Date() ? 'text-red-600' : ''}>
                            {new Date(fee.dueDate).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(fee.status)}>
                            {fee.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/admin/fee/${fee.id}`)}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {fee.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/fee/collect?feeId=${fee.id}`)}
                                className="h-8 w-8 text-green-600"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}