'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  DollarSign, 
  Clock, 
  Shield,
  Palette,
  Sun,
  Moon,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [theme, setTheme] = useState<string>('light');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const themes = [
    { name: 'Light', value: 'light', icon: Sun },
    { name: 'Dark', value: 'dark', icon: Moon },
    { name: 'Blue', value: 'blue', icon: Palette },
    { name: 'Green', value: 'green', icon: Palette },
    { name: 'Purple', value: 'purple', icon: Palette },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
    setIsThemeMenuOpen(false);
  };

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
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-[hsl(var(--primary))]" />
            <span className="text-xl font-bold text-[hsl(var(--foreground))]">School ERP</span>
          </div>
          <nav className="flex items-center gap-4">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="relative border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                <Palette className="h-5 w-5" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              {isThemeMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsThemeMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] py-1 z-50">
                    {themes.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => handleThemeChange(t.value)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{t.name}</span>
                          {theme === t.value && (
                            <Check className="h-4 w-4 ml-auto text-[hsl(var(--primary))]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <Link href="/login">
              <Button variant="ghost" className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-[hsl(var(--foreground))]">
            Complete School Management
            <span className="block text-[hsl(var(--primary))]">System</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
            A comprehensive ERP solution for managing students, teachers, attendance, fees,
            exams, library, and more. Streamline your school operations with our modern platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">Everything You Need</h2>
            <p className="mt-4 text-[hsl(var(--muted-foreground))]">
              Powerful features to manage your entire school operation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-shadow border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]"
              >
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-[hsl(var(--primary))] mb-2" />
                  <CardTitle className="text-lg text-[hsl(var(--card-foreground))]">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[hsl(var(--muted-foreground))]">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-20 bg-[hsl(var(--primary)/0.05)]">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4 text-[hsl(var(--foreground))]">
                  Role-Based Dashboards
                </h2>
                <p className="text-[hsl(var(--muted-foreground))] mb-6">
                  Customized interfaces for Super Admins, Admins, Teachers, and Students.
                  Each role has access to relevant features and data.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                    Complete student attendance tracking with QR codes
                  </li>
                  <li className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                    Online MCQ tests with auto-grading
                  </li>
                  <li className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                    Real-time fee collection dashboard
                  </li>
                  <li className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                    Automated report card generation
                  </li>
                </ul>
              </div>
              <div className="bg-[hsl(var(--background))] rounded-lg shadow-lg p-8 border border-[hsl(var(--border))]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-[hsl(var(--muted))] rounded animate-pulse" />
                    <div className="h-8 w-8 bg-[hsl(var(--muted))] rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 bg-[hsl(var(--muted))] rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[hsl(var(--border))] py-8 bg-[hsl(var(--background))]">
        <div className="container mx-auto px-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          <p>School Management System. Built with Next.js, MySQL, and Drizzle ORM.</p>
        </div>
      </footer>
    </div>
  );
}