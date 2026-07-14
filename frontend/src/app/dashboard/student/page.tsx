'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/page-header';
import {
  GraduationCap,
  Calendar,
  Clock,
  DollarSign,
  Award,
  BookOpen,
  FileText,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="Welcome back! Here's your academic overview."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <Progress value={94.5} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A</div>
            <p className="text-xs text-muted-foreground">85.6% average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$450</div>
            <p className="text-xs text-red-500">Due: Dec 15, 2024</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Rank</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3rd</div>
            <p className="text-xs text-muted-foreground">Out of 40 students</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Classes</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Mathematics</p>
                  <p className="text-xs text-muted-foreground">8:00 AM - 8:45 AM</p>
                </div>
              </div>
              <Badge variant="success">Completed</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Physics</p>
                  <p className="text-xs text-muted-foreground">9:00 AM - 9:45 AM</p>
                </div>
              </div>
              <Badge>Current</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">English</p>
                  <p className="text-xs text-muted-foreground">10:00 AM - 10:45 AM</p>
                </div>
              </div>
              <Badge variant="secondary">Upcoming</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Chemistry</p>
                  <p className="text-xs text-muted-foreground">11:00 AM - 11:45 AM</p>
                </div>
              </div>
              <Badge variant="secondary">Upcoming</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline" className="w-full h-20 flex-col gap-2">
              <Link href="/dashboard/student/attendance">
                <Clock className="h-5 w-5" />
                View Attendance
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-20 flex-col gap-2">
              <Link href="/dashboard/student/results">
                <Award className="h-5 w-5" />
                View Results
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-20 flex-col gap-2">
              <Link href="/dashboard/student/assignments">
                <FileText className="h-5 w-5" />
                Assignments
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-20 flex-col gap-2">
              <Link href="/dashboard/student/fees">
                <DollarSign className="h-5 w-5" />
                Pay Fees
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Results</CardTitle>
          <CardDescription>Your latest exam scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Unit Test - Mathematics</p>
                  <p className="text-xs text-muted-foreground">Nov 25, 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">88/100</p>
                <Badge variant="success">Grade A</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Unit Test - Physics</p>
                  <p className="text-xs text-muted-foreground">Nov 23, 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">92/100</p>
                <Badge variant="success">Grade A+</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">MCQ Test - Chemistry</p>
                  <p className="text-xs text-muted-foreground">Nov 20, 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">45/50</p>
                <Badge variant="success">Grade A</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Assignments and exams due soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Physics Lab Report</p>
                  <p className="text-xs text-muted-foreground">Due in 2 days</p>
                </div>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Mid-Term Exam</p>
                  <p className="text-xs text-muted-foreground">Dec 18-23, 2024</p>
                </div>
              </div>
              <Badge variant="warning">2 weeks</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
