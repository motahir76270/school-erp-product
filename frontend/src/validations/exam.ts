import { z } from 'zod';

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  numericValue: z.number().min(1, 'Class numeric value is required'),
  description: z.string().optional(),
  classTeacherId: z.number().optional(),
  isActive: z.boolean().default(true),
});

export type ClassFormData = z.infer<typeof classSchema>;

export const sectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  classId: z.number().min(1, 'Class is required'),
  capacity: z.number().min(1).default(40),
  isActive: z.boolean().default(true),
});

export type SectionFormData = z.infer<typeof sectionSchema>;

export const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
  creditHours: z.number().min(1).default(1),
  isActive: z.boolean().default(true),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

export const timetableSchema = z.object({
  classId: z.number().min(1, 'Class is required'),
  sectionId: z.number().min(1, 'Section is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  teacherId: z.number().min(1, 'Teacher is required'),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type TimetableFormData = z.infer<typeof timetableSchema>;

export const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  examType: z.enum(['unit_test', 'mid_term', 'final', 'practical', 'internal', 'external']),
  classId: z.number().min(1, 'Class is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  totalMarks: z.number().min(1).default(100),
  passingMarks: z.number().min(1).default(35),
  academicYear: z.string().min(1, 'Academic year is required'),
  description: z.string().optional(),
});

export type ExamFormData = z.infer<typeof examSchema>;

export const marksSchema = z.object({
  examSubjectId: z.number().min(1, 'Exam subject is required'),
  marks: z.array(z.object({
    studentId: z.number(),
    subjectId: z.number(),
    marksObtained: z.number().min(0),
    remarks: z.string().optional(),
  })),
});

export type MarksFormData = z.infer<typeof marksSchema>;
