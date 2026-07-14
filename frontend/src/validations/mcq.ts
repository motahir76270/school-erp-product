import { z } from 'zod';

export const mcqTestSchema = z.object({
  title: z.string().min(1, 'Test title is required'),
  description: z.string().optional(),
  classId: z.number().min(1, 'Class is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  totalQuestions: z.number().min(1, 'Must have at least 1 question'),
  totalMarks: z.number().min(1, 'Total marks is required'),
  duration: z.number().min(1, 'Duration is required (in minutes)'),
  negativeMarking: z.number().min(0).max(1).default(0),
  randomQuestions: z.boolean().default(false),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  passingMarks: z.number().min(0).default(35),
});

export type McqTestFormData = z.infer<typeof mcqTestSchema>;

export const mcqQuestionSchema = z.object({
  testId: z.number().min(1, 'Test is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  questionText: z.string().min(1, 'Question text is required'),
  optionA: z.string().min(1, 'Option A is required'),
  optionB: z.string().min(1, 'Option B is required'),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  marks: z.number().min(1).default(1),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type McqQuestionFormData = z.infer<typeof mcqQuestionSchema>;

export const mcqAnswerSchema = z.object({
  questionId: z.number(),
  selectedAnswer: z.enum(['A', 'B', 'C', 'D']),
  timeTaken: z.number().optional(),
});

export type McqAnswerFormData = z.infer<typeof mcqAnswerSchema>;
