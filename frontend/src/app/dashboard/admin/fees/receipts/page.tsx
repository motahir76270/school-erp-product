// dashboard/admin/fee/receipts/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllPaymentsApiCall,
  setPayments,
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
import { Search, Download, Printer, Eye, FileText, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ReceiptsPage() {
  const dispatch = useAppDispatch();
  const { payments, loading } = useAppSelector((state) => state.fee);
  
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPayments = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const params: any = { limit: 100 };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      const response = await getAllPaymentsApiCall(token, params);

      if (response?.success) {
        dispatch(setPayments(response.data));
      } else {
        toast.error(response?.message || 'Failed to fetch payments');
      }
    } catch (error: any) {
      console.error('Fetch payments error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch payments');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch payments'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [startDate, endDate]);

  const filteredPayments = payments.filter((payment: any) => {
    const searchTerm = search.toLowerCase();
    return (
      payment.receiptNumber?.toLowerCase().includes(searchTerm) ||
      payment.student?.name?.toLowerCase().includes(searchTerm) ||
      payment.transactionId?.toLowerCase().includes(searchTerm) ||
      payment.paymentMode?.toLowerCase().includes(searchTerm)
    );
  });

  const getPaymentModeBadge = (mode: string) => {
    const variants: Record<string, string> = {
      cash: 'bg-green-500',
      card: 'bg-blue-500',
      upi: 'bg-purple-500',
      bank_transfer: 'bg-orange-500',
    };
    return variants[mode] || 'bg-gray-500';
  };

  const handlePrint = (payment: any) => {
    // Implement print receipt logic
    window.print();
  };

  const handleDownload = (payment: any) => {
    // Implement download receipt logic
    toast.success('Receipt downloaded successfully');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Receipts" 
        description="View and manage all payment receipts"
      />
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All payment receipts and transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number, student, or transaction..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[130px]"
                  placeholder="Start"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[130px]"
                  placeholder="End"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {payment.receiptNumber}
                        </div>
                      </TableCell>
                      <TableCell>{payment.student?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ₹{parseFloat(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentModeBadge(payment.paymentMode)}>
                          {payment.paymentMode.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.transactionId || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrint(payment)}
                            className="h-8 w-8"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(payment)}
                            className="h-8 w-8 text-blue-600"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {filteredPayments.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Receipts</p>
                  <p className="text-lg font-bold">{filteredPayments.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{filteredPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}