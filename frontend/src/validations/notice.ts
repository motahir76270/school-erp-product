import { z } from 'zod';

export const noticeSchema = z.object({
  title: z.string().min(1, 'Notice title is required'),
  content: z.string().min(1, 'Notice content is required'),
  target: z.enum(['students', 'teachers', 'everyone', 'specific_class']),
  targetClassId: z.number().optional(),
  attachmentUrl: z.string().optional(),
  publishDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  isActive: z.boolean().default(true),
});

export type NoticeFormData = z.infer<typeof noticeSchema>;

export const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  description: z.string().optional(),
  holidayType: z.enum(['national', 'festival', 'school', 'other']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isRecurring: z.boolean().default(false),
});

export type HolidayFormData = z.infer<typeof holidaySchema>;

export const eventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  organizer: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  maxParticipants: z.number().optional(),
  registrationRequired: z.boolean().default(false),
  registrationDeadline: z.string().or(z.date()).optional(),
  imageUrl: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;
