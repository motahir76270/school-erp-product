'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginSchema, LoginFormData } from '@/validations/auth';
import { loginApiCall } from '@/store/slices/authSlice';
import { toast } from 'react-toastify';
import { setAuthenticated, setToken, setUser } from '@/store/slices/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register: formRegister, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (datas: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const data = await loginApiCall(datas);
      
      if (data?.success === true) {
        // Store token and user in localStorage
        localStorage.setItem('accessToken', data?.data?.token);
        localStorage.setItem('user', JSON.stringify(data?.data?.user));
        
        // Update Redux state
        dispatch(setUser(data?.data?.user));
        dispatch(setToken(data?.data?.token));
        dispatch(setAuthenticated(true));
        
        toast.success(data?.message || 'Login successful');
        
        const role = data?.data?.user?.role;
        const dashboardRoutes: Record<string, string> = {
          super_admin: '/dashboard/admin',
          admin: '/dashboard/admin',
          teacher: '/dashboard/teacher',
          student: '/dashboard/student',
        };
        
        router.push(dashboardRoutes[role] || '/dashboard/student');
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user?.role;
        
        // Update Redux state
        dispatch(setToken(token));
        dispatch(setUser(user));
        dispatch(setAuthenticated(true));
        
        const dashboardRoutes: Record<string, string> = {
          super_admin: '/dashboard/admin',
          admin: '/dashboard/admin',
          teacher: '/dashboard/teacher',
          student: '/dashboard/student',
        };
        
        router.push(dashboardRoutes[role] || '/dashboard/student');
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
  }, [dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your School ERP account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...formRegister('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...formRegister('password')}
                  className={errors.password ? 'border-destructive' : ''}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading || loading}>
              {isLoading || loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}