import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');
}

export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getGradeFromPercentage(percentage: number): { grade: string; points: number } {
  if (percentage >= 90) return { grade: 'A+', points: 4.0 };
  if (percentage >= 80) return { grade: 'A', points: 4.0 };
  if (percentage >= 70) return { grade: 'B+', points: 3.5 };
  if (percentage >= 60) return { grade: 'B', points: 3.0 };
  if (percentage >= 50) return { grade: 'C+', points: 2.5 };
  if (percentage >= 40) return { grade: 'C', points: 2.0 };
  if (percentage >= 35) return { grade: 'D', points: 1.0 };
  return { grade: 'F', points: 0.0 };
}

export function getAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 0 && month <= 5) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
}
