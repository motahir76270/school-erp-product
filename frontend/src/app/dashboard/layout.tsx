'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getCurrentUser } from '@/src/hooks/apiCall/auth';
import { setUser } from '@/src/store/slices/authSlice';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { user }:any = useAppSelector((state) => state.auth);
  
  // Manual states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          // If token exists, try to get user
          const response:any = await getCurrentUser(token);
          if (response.success === true) {
            dispatch(setUser(response.data));
            setIsAuthenticated(true);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('accessToken');
            setIsAuthenticated(false);
          }
        } else {
          // No token found
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [dispatch]);

  // Handle redirect after auth check
  useEffect(() => {
    if (authChecked && !isLoading) {
      const token = localStorage.getItem('accessToken');
      
      if (!token || !isAuthenticated || !user) {
        router.push('/login');
      }
    }
  }, [authChecked, isLoading, isAuthenticated, user, router]);

  // Show loading only during initial auth check
  if (!authChecked || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after check, redirect (handled by useEffect)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={user.role as 'super_admin' | 'admin' | 'teacher' | 'student'} />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}