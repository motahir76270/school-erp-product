import { z } from 'zod';

export const feeSchema = z.object({
  name: z.string().min(1, 'Fee name is required'),
  feeType: z.enum(['admission', 'monthly', 'exam', 'transport', 'hostel', 'library', 'sports', 'other']),
  classId: z.number().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  dueDate: z.string().optional(),
  penaltyPerDay: z.number().min(0).optional(),
  description: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  isActive: z.boolean().default(true),
});

export type FeeFormData = z.infer<typeof feeSchema>;

export const feePaymentSchema = z.object({
  studentId: z.number().min(1, 'Student is required'),
  feeId: z.number().min(1, 'Fee is required'),
  amountPaid: z.number().min(0, 'Amount must be positive'),
  penaltyAmount: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'cheque']),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

export type FeePaymentFormData = z.infer<typeof feePaymentSchema>;

export const feeFilterSchema = z.object({
  feeType: z.enum(['admission', 'monthly', 'exam', 'transport', 'hostel', 'library', 'sports', 'other', 'all']).optional(),
  classId: z.number().optional(),
  academicYear: z.string().optional(),
});

export type FeeFilterFormData = z.infer<typeof feeFilterSchema>;
