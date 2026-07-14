'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Users, BookOpen, Calendar, Award, DollarSign, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
   

  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Complete student lifecycle from admission to graduation',
    },
    {
      icon: GraduationCap,
      title: 'Teacher Management',
      description: 'Manage teachers, assignments, and performance tracking',
    },
    {
      icon: Calendar,
      title: 'Attendance System',
      description: 'Manual and QR-based attendance with real-time tracking',
    },
    {
      icon: DollarSign,
      title: 'Fee Management',
      description: 'Comprehensive fee collection with penalty calculation',
    },
    {
      icon: BookOpen,
      title: 'Library System',
      description: 'Book management with issue tracking and fine calculation',
    },
    {
      icon: Award,
      title: 'Exam & Results',
      description: 'Online tests, marks management, and report generation',
    },
    {
      icon: Clock,
      title: 'Timetable',
      description: 'Automated scheduling conflict detection',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure access control for admins, teachers, and students',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">School ERP</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Complete School Management
            <span className="block text-primary">System</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A comprehensive ERP solution for managing students, teachers, attendance, fees,
            exams, library, and more. Streamline your school operations with our modern platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="mt-4 text-muted-foreground">
              Powerful features to manage your entire school operation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-primary/5 py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Role-Based Dashboards
                </h2>
                <p className="text-muted-foreground mb-6">
                  Customized interfaces for Super Admins, Admins, Teachers, and Students.
                  Each role has access to relevant features and data.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Complete student attendance tracking with QR codes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Online MCQ tests with auto-grading
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Real-time fee collection dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Automated report card generation
                  </li>
                </ul>
              </div>
              <div className="bg-background rounded-lg shadow-lg p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>School Management System. Built with Next.js, MySQL, and Drizzle ORM.</p>
        </div>
      </footer>
    </div>
  );
}
