import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReduxProvider } from '@/components/providers/provider';
import { ToastContainer, toast } from 'react-toastify';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'School Management System',
  description: 'Complete School ERP System for managing students, teachers, attendance, fees, exams and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ReduxProvider>{children}</ReduxProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
