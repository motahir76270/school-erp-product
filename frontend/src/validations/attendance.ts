import { z } from 'zod';

export const attendanceSchema = z.object({
  classId: z.number().min(1, 'Class is required'),
  sectionId: z.number().min(1, 'Section is required'),
  date: z.string().or(z.date()),
  attendance: z.array(z.object({
    studentId: z.number(),
    status: z.enum(['present', 'absent', 'late', 'leave']),
    remarks: z.string().optional(),
  })),
});

export type AttendanceFormData = z.infer<typeof attendanceSchema>;

export const qrAttendanceSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
  teacherId: z.number().min(1, 'Teacher is required'),
});

export type QRAttendanceFormData = z.infer<typeof qrAttendanceSchema>;

export const teacherAttendanceSchema = z.object({
  teacherId: z.number().min(1, 'Teacher is required'),
  status: z.enum(['present', 'absent', 'late', 'leave']),
  qrCode: z.string().optional(),
});

export type TeacherAttendanceFormData = z.infer<typeof teacherAttendanceSchema>;

export const attendanceFilterSchema = z.object({
  classId: z.number().optional(),
  sectionId: z.number().optional(),
  date: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'leave', 'all']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AttendanceFilterFormData = z.infer<typeof attendanceFilterSchema>;
