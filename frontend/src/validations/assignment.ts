import { z } from 'zod';

export const assignmentSchema = z.object({
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().optional(),
  classId: z.number().min(1, 'Class is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  dueDate: z.string().or(z.date()),
  totalMarks: z.number().min(1).default(100),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;

export const submissionSchema = z.object({
  assignmentId: z.number(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  remarks: z.string().optional(),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;

export const gradeSubmissionSchema = z.object({
  marksObtained: z.number().min(0, 'Marks must be positive'),
  feedback: z.string().optional(),
});

export type GradeSubmissionFormData = z.infer<typeof gradeSubmissionSchema>;
