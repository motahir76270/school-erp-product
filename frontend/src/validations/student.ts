import { z } from 'zod';

export const studentSchema = z.object({
  userId: z.number().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  admissionNumber: z.string().min(1, 'Admission number is required'),
  classId: z.number().min(1, 'Class is required'),
  sectionId: z.number().min(1, 'Section is required'),
  dateOfBirth: z.string().or(z.date()).transform(val => new Date(val)),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
  emergencyContact: z.string().optional(),
  admissionDate: z.string().or(z.date()).transform(val => new Date(val)),
  isActive: z.boolean().default(true),
  user: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  parent: z.object({
    fatherName: z.string().min(1, 'Father name is required'),
    fatherPhone: z.string().optional(),
    fatherOccupation: z.string().optional(),
    fatherEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    motherName: z.string().min(1, 'Mother name is required'),
    motherPhone: z.string().optional(),
    motherOccupation: z.string().optional(),
    motherEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    guardianRelation: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export const studentFilterSchema = z.object({
  search: z.string().optional(),
  classId: z.number().optional(),
  sectionId: z.number().optional(),
  gender: z.enum(['male', 'female', 'other', 'all']).optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type StudentFilterFormData = z.infer<typeof studentFilterSchema>;
