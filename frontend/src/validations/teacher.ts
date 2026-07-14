import { z } from 'zod';

export const teacherSchema = z.object({
  userId: z.number().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  qualification: z.string().optional(),
  experience: z.number().min(0).optional(),
  specialization: z.string().optional(),
  salary: z.number().min(0).optional(),
  joiningDate: z.string().or(z.date()).transform(val => new Date(val)),
  isActive: z.boolean().default(true),
  user: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

export type TeacherFormData = z.infer<typeof teacherSchema>;

export const teacherFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type TeacherFilterFormData = z.infer<typeof teacherFilterSchema>;
