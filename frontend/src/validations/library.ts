import { z } from 'zod';

export const libraryBookSchema = z.object({
  title: z.string().min(1, 'Book title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  category: z.string().optional(),
  totalCopies: z.number().min(1, 'At least 1 copy required').default(1),
  shelfLocation: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
});

export type LibraryBookFormData = z.infer<typeof libraryBookSchema>;

export const bookIssueSchema = z.object({
  bookId: z.number().min(1, 'Book is required'),
  studentId: z.number().min(1, 'Student is required'),
  dueDate: z.string().or(z.date()),
});

export type BookIssueFormData = z.infer<typeof bookIssueSchema>;

export const bookFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  availability: z.enum(['available', 'unavailable', 'all']).optional(),
});

export type BookFilterFormData = z.infer<typeof bookFilterSchema>;
