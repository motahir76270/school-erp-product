// app/dashboard/admin/fee/receipts/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  adminGetStudentFeeReceiptsApiCall,
  setStudentFeesReceipts,
  setLoading,
  setError,
} from '@/store/slices/reciptSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  Download,
  Eye,
  CreditCard,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';

// ==================== Types ====================
interface StudentFee {
  id: string;
  userId: string;
  studentId: string;
  feeTypeId: string;
  amount: string;
  dueDate: string;
  dueAmount: string;
  paidAmount: string;
  penaltyAmount: string;
  discount: string;
  scholarship: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  academicYear: string;
  month: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentReceipt {
  id: string;
  studentFeeId: string;
  amount: string;
  paymentMode: string;
  transactionId: string | null;
  receiptNumber: string;
  pdf_url: string;
  paidBy: string;
  remarks: string | null;
  createdAt: string;
  studentFee: StudentFee;
}

// ==================== Component ====================
export default function StudentFeeReceiptDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const dispatch = useAppDispatch();
  const { studentFeesReceipts, loading } = useAppSelector((state: any) => state.receipt);
  
  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;
  
  // ==================== State ====================
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // ==================== Fetch Receipt Details ====================
  const fetchReceiptDetails = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    if (!studentId) {
      toast.error('Student ID is missing');
      return;
    }

    setIsRefreshing(true);
    dispatch(setLoading(true));

    try {
      console.log('Fetching receipts for student ID:', studentId);
      
      const response = await adminGetStudentFeeReceiptsApiCall(token, studentId);
      console.log('Receipts Response:', response);

      if (response?.success === true && response?.data) {
        let receiptsData = [];
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          receiptsData = response.data;
        } else if (response.data.receipts && Array.isArray(response.data.receipts)) {
          receiptsData = response.data.receipts;
        } else {
          receiptsData = [response.data];
        }
        
        setReceipts(receiptsData);
        dispatch(setStudentFeesReceipts(receiptsData));
        
        if (receiptsData.length > 0) {
          toast.success(`Found ${receiptsData.length} receipts`);
        } else {
          toast.info('No receipts found');
        }
      } else {
        toast.error(response?.message || 'Failed to fetch receipts');
        setReceipts([]);
        dispatch(setError(response?.message || 'Failed to fetch receipts'));
      }
    } catch (error: any) {
      console.error('Fetch receipts error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch receipts';
      toast.error(errorMessage);
      setReceipts([]);
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
      setIsRefreshing(false);
    }
  };

  // ==================== Load on Mount ====================
  useEffect(() => {
    if (studentId) {
      fetchReceiptDetails();
    }
  }, [studentId]);

  // ==================== Helper Functions ====================
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500 hover:bg-yellow-600',
      partial: 'bg-blue-500 hover:bg-blue-600',
      paid: 'bg-green-500 hover:bg-green-600',
      overdue: 'bg-red-500 hover:bg-red-600',
    };
    return variants[status] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'partial':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  const getPaymentModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
    };
    return modes[mode] || mode;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // ==================== Handle View Receipt ====================
  const handleViewReceipt = (receipt: PaymentReceipt) => {
    setSelectedReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  // ==================== Handle View PDF ====================
  const handleViewPDF = (pdfUrl: string) => {
    if (pdfUrl) {
      window.open(pdfUrl.trim(), '_blank');
    } else {
      toast.info('PDF URL not available');
    }
  };

  // ==================== Handle Download PDF ====================
  const handleDownloadPDF = (pdfUrl: string) => {
    if (pdfUrl) {
      window.open(pdfUrl.trim(), '_blank');
    } else {
      toast.info('PDF URL not available');
    }
  };

  // ==================== Handle Print ====================
  const handlePrint = () => {
    window.print();
  };

  // ==================== Loading State ====================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading receipts...</p>
      </div>
    );
  }

  // ==================== No Data State ====================
  if (receipts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Student Receipts" 
            description="View all payment receipts for this student"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={fetchReceiptDetails}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Receipts Found</p>
            <p className="text-sm text-muted-foreground">No payment receipts found for this student</p>
            <Button 
              onClick={fetchReceiptDetails} 
              className="mt-4"
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== Calculate Summary ====================
  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const uniqueFees = new Set(receipts.map(r => r.studentFeeId)).size;

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Student Payment Receipts" 
          description={`${totalReceipts} receipts found`}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={fetchReceiptDetails}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">{totalReceipts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{formatCurrency(totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Fees</p>
                <p className="text-2xl font-bold">{uniqueFees}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Receipts</CardTitle>
          <CardDescription>Complete list of payment receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => {
                  const studentFee = receipt.studentFee;
                  const isOverdue = studentFee?.dueDate && new Date(studentFee.dueDate) < new Date() && studentFee.status !== 'paid';
                  const displayStatus = isOverdue && studentFee?.status !== 'paid' ? 'overdue' : studentFee?.status || 'pending';
                  
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{receipt.receiptNumber || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {receipt.id.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        ₹{formatCurrency(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getPaymentModeLabel(receipt.paymentMode)}
                        </Badge>
                        {receipt.transactionId && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {receipt.transactionId}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(receipt.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(receipt.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(displayStatus)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(displayStatus)}
                            {getStatusLabel(displayStatus)}
                          </span>
                        </Badge>
                        {studentFee && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: ₹{formatCurrency(studentFee.dueAmount || '0')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {studentFee ? (
                          <div>
                            <p className="text-sm">{studentFee.academicYear}</p>
                            <p className="text-xs text-muted-foreground">{studentFee.month}</p>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(receipt)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {receipt.pdf_url && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPDF(receipt.pdf_url)}
                                className="text-blue-600"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(receipt.pdf_url)}
                                className="text-green-600"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>Complete receipt information</DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              {/* Receipt Header */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{selectedReceipt.receiptNumber}</h3>
                    <p className="text-sm text-muted-foreground">Receipt ID: {selectedReceipt.id}</p>
                  </div>
                  <Badge className={getStatusBadge(selectedReceipt.studentFee?.status || 'pending')}>
                    {getStatusLabel(selectedReceipt.studentFee?.status || 'pending')}
                  </Badge>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold text-green-600">₹{formatCurrency(selectedReceipt.amount)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Payment Mode</Label>
                  <p className="font-medium capitalize">{getPaymentModeLabel(selectedReceipt.paymentMode)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{formatDateTime(selectedReceipt.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedReceipt.transactionId || 'N/A'}</p>
                </div>
              </div>

              {/* Fee Details */}
              {selectedReceipt.studentFee && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Fee Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Academic Year</Label>
                      <p>{selectedReceipt.studentFee.academicYear}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Month</Label>
                      <p>{selectedReceipt.studentFee.month}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Total Amount</Label>
                      <p>₹{formatCurrency(selectedReceipt.studentFee.amount)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Paid Amount</Label>
                      <p className="text-green-600">₹{formatCurrency(selectedReceipt.studentFee.paidAmount)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Due Amount</Label>
                      <p className="text-yellow-600">₹{formatCurrency(selectedReceipt.studentFee.dueAmount)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Due Date</Label>
                      <p>{formatDate(selectedReceipt.studentFee.dueDate)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedReceipt.pdf_url && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleViewPDF(selectedReceipt.pdf_url)}
                      className="flex-1"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View PDF
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleDownloadPDF(selectedReceipt.pdf_url)}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Label component for the modal
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm font-medium ${className}`}>{children}</p>
);