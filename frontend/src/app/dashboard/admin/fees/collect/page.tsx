// dashboard/admin/fee/collect/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllStudentFeesApiCall,
  makePaymentApiCall,
  setStudentFees,
  setLoading,
  setError,
} from '@/store/slices/feeSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { ArrowLeft, CreditCard, Search, RefreshCw } from 'lucide-react';

// ==================== Zod Schema ====================
const collectFeeSchema = z.object({
  studentFeeId: z.string().min(1, 'Please select a fee'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => parseFloat(val) > 0, {
      message: 'Amount must be greater than 0',
    }),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

type CollectFeeFormData = z.infer<typeof collectFeeSchema>;

// ==================== Component ====================
export default function CollectFeePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { studentFees, loading } = useAppSelector((state) => state.fee);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CollectFeeFormData>({
    resolver: zodResolver(collectFeeSchema),
    defaultValues: {
      paymentMode: 'cash',
      amount: '',
    },
  });

  const watchStudentFeeId = watch('studentFeeId');

  // Update selected fee and amount when fee is selected
  useEffect(() => {
    if (watchStudentFeeId) {
      const fee:any = studentFees.find((f: any) => f.id === watchStudentFeeId);
      setSelectedFee(fee);
      if (fee) {
        const remaining = parseFloat(fee.amount) - parseFloat(fee.paidAmount || 0);
        setValue('amount', remaining > 0 ? remaining.toString() : '0');
      }
    } else {
      setSelectedFee(null);
    }
  }, [watchStudentFeeId, studentFees, setValue]);

  // Fetch pending fees
  const fetchFees = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsFetching(true);
    dispatch(setLoading(true));
    try {
      const response = await getAllStudentFeesApiCall(token, {
        status: 'pending,partial,overdue',
        limit: 100,
      });

      console.log('Fetch fees response:', response);

      if (response?.success) {
        const feesData = response.data?.fees || [];
        dispatch(setStudentFees({ 
          fees: feesData, 
          pagination: response.data?.pagination || { page: 1, limit: 10, total: 0 } 
        }));
        toast.success(`Loaded ${feesData.length} pending fees`);
      } else {
        toast.error(response?.message || 'Failed to fetch fees');
        dispatch(setStudentFees({ fees: [], pagination: { page: 1, limit: 10, total: 0 } }));
        dispatch(setError(response?.message || 'Failed to fetch fees'));
      }
    } catch (error: any) {
      console.error('Fetch fees error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch fees');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch fees'));
      dispatch(setStudentFees({ fees: [], pagination: { page: 1, limit: 10, total: 0 } }));
    } finally {
      dispatch(setLoading(false));
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  // Filter fees by search term
  const filteredFees = Array.isArray(studentFees) ? studentFees.filter((fee: any) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      fee.student?.name?.toLowerCase().includes(search) ||
      fee.student?.admissionNumber?.toLowerCase().includes(search) ||
      fee.student?.rollNumber?.toLowerCase().includes(search) ||
      fee.feeType?.name?.toLowerCase().includes(search) ||
      fee.feeType?.code?.toLowerCase().includes(search)
    );
  }) : [];

  // Handle payment submission
  const onSubmit = async (data: CollectFeeFormData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    // Validate amount
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check if amount exceeds remaining balance
    if (selectedFee) {
      const remaining = parseFloat(selectedFee.amount) - parseFloat(selectedFee.paidAmount || 0);
      if (amount > remaining) {
        toast.error(`Amount cannot exceed remaining balance of ₹${remaining.toFixed(2)}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await makePaymentApiCall(token, {
        studentFeeId: data.studentFeeId,
        amount: data.amount,
        paymentMode: data.paymentMode as any,
        transactionId: data.transactionId || undefined,
        remarks: data.remarks || undefined,
      });

      console.log('Payment response:', response);

      if (response?.success) {
        toast.success(response.message || 'Payment recorded successfully');
        // Reset form
        reset({
          studentFeeId: '',
          amount: '',
          paymentMode: 'cash',
          transactionId: '',
          remarks: '',
        });
        setSelectedFee(null);
        // Refresh fees
        await fetchFees();
        // Navigate to receipts or stay
        router.push('/admin/fee/receipts');
      } else {
        toast.error(response?.message || 'Failed to record payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error?.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500 hover:bg-yellow-600',
      partial: 'bg-blue-500 hover:bg-blue-600',
      paid: 'bg-green-500 hover:bg-green-600',
      overdue: 'bg-red-500 hover:bg-red-600',
    };
    return variants[status] || 'bg-gray-500 hover:bg-gray-600';
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Collect Fee" 
        description="Record fee payments from students"
      />
 

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Fee Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Fee</CardTitle>
            <CardDescription>Choose a pending fee to collect</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student or fee type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading fees...
                </div>
              ) : filteredFees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchTerm ? 'No fees found matching your search' : 'No pending fees found'}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={fetchFees}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              ) : (
                filteredFees.map((fee: any) => {
                  const remaining = parseFloat(fee.amount) - parseFloat(fee.paidAmount || 0);
                  const isSelected = watchStudentFeeId === fee.id;
                  
                  return (
                    <div
                      key={fee.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => setValue('studentFeeId', fee.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fee.student?.name || 'Unknown Student'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {fee.feeType?.name || 'Unknown Fee'} • {fee.academicYear}
                            {fee.month && ` • ${fee.month}`}
                          </p>
                          {fee.student?.rollNumber && (
                            <p className="text-xs text-muted-foreground">
                              Roll: {fee.student.rollNumber}
                            </p>
                          )}
                        </div>
                        <Badge className={`${getStatusBadge(fee.status)} text-white ml-2 flex-shrink-0`}>
                          {getStatusLabel(fee.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between mt-2 text-sm flex-wrap gap-1">
                        <span>Total: ₹{parseFloat(fee.amount).toFixed(2)}</span>
                        <span className="text-green-600">
                          Paid: ₹{parseFloat(fee.paidAmount || 0).toFixed(2)}
                        </span>
                        <span className={remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          Remaining: ₹{remaining.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          Due: {new Date(fee.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      {parseFloat(fee.penaltyAmount || 0) > 0 && (
                        <div className="mt-1 text-xs text-red-600">
                          Penalty: ₹{parseFloat(fee.penaltyAmount).toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {filteredFees.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredFees.length} of {studentFees.length} pending fees
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Enter payment information</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFee ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Fee Summary */}
                <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium">{selectedFee.student?.name || 'Unknown'}</span>
                  </div>
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

                <input type="hidden" {...register('studentFeeId')} />

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('amount')}
                    className={errors.amount ? 'border-red-500' : ''}
                    placeholder="Enter payment amount"
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
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
                    onValueChange={(value) => setValue('paymentMode', value)}
                    defaultValue="cash"
                  >
                    <SelectTrigger className={errors.paymentMode ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMode && (
                    <p className="text-sm text-red-500">{errors.paymentMode.message}</p>
                  )}
                </div>

                {/* Transaction ID */}
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    {...register('transactionId')}
                    placeholder="Enter transaction ID (optional)"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    {...register('remarks')}
                    placeholder="Add any remarks (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      reset({
                        studentFeeId: '',
                        amount: '',
                        paymentMode: 'cash',
                        transactionId: '',
                        remarks: '',
                      });
                      setSelectedFee(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Processing...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Fee Selected</p>
                <p className="text-sm">Select a pending fee from the left to start collecting</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}