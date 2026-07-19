// app/dashboard/fee/collection/studentFee/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getStudentFeesApiCall,
  makePaymentApiCall,
  setStudentFees,
  setLoading as setFeeLoading,
  setError as setFeeError,
} from '@/store/slices/feeSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Calendar, 
  FileText,
  RefreshCw,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';

// ==================== Types ====================
interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  admissionNumber: string | null;
  classId: string;
  sectionId: string | null;
  profileImage: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'suspended';
  gender?: string | null;
  dateOfBirth?: string | null;
}

interface FeeType {
  id: string;
  name: string;
  code: string;
  frequency: string;
}

interface StudentFee {
  id: string;
  studentId: string;
  feeTypeId: string;
  amount: string;
  dueDate: string;
  paidAmount: string;
  penaltyAmount: string;
  discount: string;
  scholarship: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  academicYear: string;
  month: string | null;
  feeType?: FeeType;
}

interface FeeSummary {
  totalFees: number;
  paid: number;
  pending: number;
  overDue: number;
}

// ==================== Component ====================
export default function StudentFeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const dispatch = useAppDispatch();
  const { currentStudent, loading: studentLoading } = useAppSelector((state: any) => state.student);
  const { studentFees, loading: feeLoading } = useAppSelector((state: any) => state.fee);
  
  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;
  
  // ==================== State ====================
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'cash' as 'cash' | 'card' | 'upi' | 'bank_transfer',
    transactionId: '',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feeSummary, setFeeSummary] = useState<FeeSummary>({
    totalFees: 0,
    paid: 0,
    pending: 0,
    overDue: 0,
  });

  // ==================== Fetch Fees ====================
  const fetchFees = async () => {
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
    dispatch(setFeeLoading(true));

    try {
      console.log('Fetching fees for student ID:', studentId);
      
      const response = await getStudentFeesApiCall(token, studentId);
      console.log('Fees API Response:', response);
      
      // Check if the response indicates success
      if (response?.success === true && response?.data) {
        const data:any = response.data;
        
        // Extract fees array from response.data.fees
        let feesArray: any[] = [];
        if (data.fees && Array.isArray(data.fees)) {
          feesArray = data.fees;
        } else if (Array.isArray(data)) {
          feesArray = data;
        }
        
        console.log('Extracted fees array:', feesArray);
        
        // Update Redux store with the fees array
        dispatch(setStudentFees({ 
          fees: feesArray, 
          pagination: { page: 1, limit: 10, total: feesArray.length } 
        }));
        
        // Extract fee summary from response
        if (data.feeSummary) {
          setFeeSummary({
            totalFees: data.feeSummary.totalFees || 0,
            paid: data.feeSummary.paid || 0,
            pending: data.feeSummary.pending || 0,
            overDue: data.feeSummary.overDue || 0,
          });
        } else {
          // Calculate summary from fees array if feeSummary not provided
          calculateSummary(feesArray);
        }
        
        if (feesArray.length > 0) {
          toast.success(`Loaded ${feesArray.length} fee records`);
        } else {
          toast.info('No fee records found for this student');
        }
      } else {
        // Handle error response
        const errorMessage = response?.message || 'Failed to fetch fees';
        console.error('API Error:', errorMessage);
        toast.error(errorMessage);
        
        // Reset fees in store
        dispatch(setStudentFees({ fees: [], pagination: { page: 1, limit: 10, total: 0 } }));
        dispatch(setFeeError(errorMessage));
        
        // Reset summary
        setFeeSummary({
          totalFees: 0,
          paid: 0,
          pending: 0,
          overDue: 0,
        });
      }
    } catch (error: any) {
      console.error('Fetch fees error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch fees';
      toast.error(errorMessage);
      dispatch(setFeeError(errorMessage));
      dispatch(setStudentFees({ fees: [], pagination: { page: 1, limit: 10, total: 0 } }));
      
      // Reset summary
      setFeeSummary({
        totalFees: 0,
        paid: 0,
        pending: 0,
        overDue: 0,
      });
    } finally {
      dispatch(setFeeLoading(false));
      setIsRefreshing(false);
    }
  };

  // ==================== Calculate Summary from Fees Array ====================
  const calculateSummary = (feesArray: any[]) => {
    const totalFees = feesArray.reduce((sum: number, f: any) => sum + parseFloat(f.amount || 0), 0);
    const paid = feesArray.reduce((sum: number, f: any) => sum + parseFloat(f.paidAmount || 0), 0);
    const pending = feesArray
      .filter((f: any) => f.status === 'pending' || f.status === 'partial')
      .reduce((sum: number, f: any) => sum + (parseFloat(f.amount || 0) - parseFloat(f.paidAmount || 0)), 0);
    const overDue = feesArray
      .filter((f: any) => f.status === 'overdue')
      .reduce((sum: number, f: any) => sum + (parseFloat(f.amount || 0) - parseFloat(f.paidAmount || 0)), 0);
    
    setFeeSummary({
      totalFees,
      paid,
      pending,
      overDue,
    });
  };

  // ==================== Load Fees on Mount ====================
  useEffect(() => {
    if (studentId) {
      fetchFees();
    }
  }, [studentId]);

  // ==================== Handle Payment Click ====================
  const handlePaymentClick = (fee: StudentFee) => {
    setSelectedFee(fee);
    const remaining = parseFloat(fee.amount) - parseFloat(fee.paidAmount || 0);
    setPaymentData({
      amount: remaining > 0 ? remaining.toString() : '0',
      paymentMode: 'cash',
      transactionId: '',
      remarks: '',
    });
    setIsPaymentModalOpen(true);
  };

  // ==================== Handle Payment Submit ====================
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    const amount = parseFloat(paymentData.amount);
    if (!paymentData.amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const remaining = parseFloat(selectedFee.amount) - parseFloat(selectedFee.paidAmount || 0);
    if (amount > remaining) {
      toast.error(`Amount cannot exceed remaining balance of ₹${remaining.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentPayload = {
        studentFeeId: selectedFee.id,
        amount: paymentData.amount,
        paymentMode: paymentData.paymentMode,
        transactionId: paymentData.transactionId || undefined,
        remarks: paymentData.remarks || undefined,
      };
      
      console.log('Payment Payload:', paymentPayload);
      
      const data = await makePaymentApiCall(token, paymentPayload);
      console.log('Payment Response:', data);

      if (data?.success === true) {
        toast.success(data?.message || 'Payment recorded successfully');
        setIsPaymentModalOpen(false);
        setSelectedFee(null);
        // Refresh fees after payment
        await fetchFees();
      } else {
        toast.error(data?.message || 'Failed to record payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // ==================== Get Fees Array from Store ====================
  const getFeesArray = () => {
    if (!studentFees) return [];
    
    // If studentFees is already an array
    if (Array.isArray(studentFees)) {
      return studentFees;
    }
    
    // If studentFees has a fees property that's an array
    if (studentFees.fees && Array.isArray(studentFees.fees)) {
      return studentFees.fees;
    }
    
    // If studentFees has a data property with fees
    if (studentFees.data?.fees && Array.isArray(studentFees.data.fees)) {
      return studentFees.data.fees;
    }
    
    // If studentFees.data is an array
    if (studentFees.data && Array.isArray(studentFees.data)) {
      return studentFees.data;
    }
    
    return [];
  };

  const feesList = getFeesArray();

  // ==================== Loading State ====================
  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Page Header with Refetch Button */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Student Fee Details"
          description={`Fee records for ${currentStudent?.name || 'student'}`}
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
            onClick={fetchFees}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Student Info Card */}
      {currentStudent && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {currentStudent.profileImage ? (
                  <Image
                    src={`${baseURl}${currentStudent.profileImage}`}
                    alt={currentStudent.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{currentStudent.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                  <span>Roll: {currentStudent.rollNumber}</span>
                  {currentStudent.admissionNumber && (
                    <span>Admission: {currentStudent.admissionNumber}</span>
                  )}
                  <span>Status: <Badge className={currentStudent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {currentStudent.status}
                  </Badge></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Summary Cards - Using feeSummary from API */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">₹{feeSummary.totalFees.toFixed(2)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{feeSummary.paid.toFixed(2)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹{feeSummary.pending.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">₹{feeSummary.overDue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee List Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee History</CardTitle>
              <CardDescription>All fee records for this student</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFees}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due Amount</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading fees...
                    </TableCell>
                  </TableRow>
                ) : feesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No fees assigned to this student
                    </TableCell>
                  </TableRow>
                ) : (
                  feesList.map((fee: any) => {
                    const remaining = parseFloat(fee.amount) - parseFloat(fee.paidAmount || 0);
                    const isOverdue = new Date(fee.dueDate) < new Date() && fee.status !== 'paid';
                    // Use status from API if available, otherwise determine from due date
                    const status = fee.status || (isOverdue ? 'overdue' : 'pending');
                    
                    // Get fee type name from feeType object or use a fallback
                    const feeTypeName = fee.feeType?.name || fee.feeTypeName || 'Unknown';
                    
                    return (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{feeTypeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {fee.academicYear} {fee.month ? `- ${fee.month}` : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>₹{parseFloat(fee.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          ₹{parseFloat(fee.paidAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className={remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          ₹{remaining.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          ₹{parseFloat(fee.penaltyAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className={isOverdue ? 'text-red-600' : ''}>
                              {new Date(fee.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(status)}
                              {getStatusLabel(status)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {status !== 'paid' && remaining > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handlePaymentClick(fee)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay
                              </Button>
                            )}
                            {status === 'paid' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toast.info('Receipt will be available soon')}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Receipt
                              </Button>
                            )}
                            {status !== 'paid' && remaining <= 0 && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fully Paid
                              </Badge>
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

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Collect Fee Payment</DialogTitle>
            <DialogDescription>
              Record payment for {selectedFee?.feeType?.name || 'fee'}
            </DialogDescription>
          </DialogHeader>
          {selectedFee && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Fee Summary */}
              <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Type:</span>
                  <span className="font-medium">{selectedFee.feeType?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Academic Year:</span>
                  <span className="font-medium">{selectedFee.academicYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">₹{parseFloat(selectedFee.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="font-medium text-green-600">₹{parseFloat(selectedFee.paidAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-red-600">
                    ₹{(parseFloat(selectedFee.amount) - parseFloat(selectedFee.paidAmount || 0)).toFixed(2)}
                  </span>
                </div>
                {parseFloat(selectedFee.penaltyAmount || 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Penalty:</span>
                    <span className="font-medium">₹{parseFloat(selectedFee.penaltyAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{new Date(selectedFee.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  className={!paymentData.amount || parseFloat(paymentData.amount) <= 0 ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Max: ₹{(parseFloat(selectedFee.amount) - parseFloat(selectedFee.paidAmount || 0)).toFixed(2)}
                </p>
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label htmlFor="paymentMode">
                  Payment Mode <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={paymentData.paymentMode}
                  onValueChange={(value: any) => setPaymentData({ ...paymentData, paymentMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  placeholder="Enter transaction ID (optional)"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                  placeholder="Add any remarks (optional)"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedFee(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Processing...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}