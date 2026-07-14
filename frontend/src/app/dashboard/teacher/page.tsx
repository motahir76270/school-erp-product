'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/page-header';
import {
  Users,
  BookOpen,
  Clock,
  Calendar,
  Award,
  FileText,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Dashboard"
        description="Welcome! Here's your teaching overview."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Across 4 classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Mathematics, Physics, Chemistry</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">4 hours total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Due</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Mathematics - Class X-A</p>
                  <p className="text-xs text-muted-foreground">8:00 AM - 8:45 AM</p>
                </div>
              </div>
              <Badge variant="success">Completed</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 border-primary bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Physics - Class XI-B</p>
                  <p className="text-xs text-muted-foreground">9:00 AM - 9:45 AM</p>
                </div>
              </div>
              <Badge>Current</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Chemistry - Class XII-A</p>
                  <p className="text-xs text-muted-foreground">11:00 AM - 11:45 AM</p>
                </div>
              </div>
              <Badge variant="secondary">Upcoming</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Mathematics - Class IX-C</p>
                  <p className="text-xs text-muted-foreground">1:00 PM - 1:45 PM</p>
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
            <Link href="/dashboard/teacher/attendance">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Clock className="h-5 w-5" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/dashboard/teacher/assignments">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <FileText className="h-5 w-5" />
                View Assignments
              </Button>
            </Link>
            <Link href="/dashboard/teacher/mcq">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Award className="h-5 w-5" />
                Create MCQ Test
              </Button>
            </Link>
            <Link href="/dashboard/teacher/timetable">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Calendar className="h-5 w-5" />
                View Timetable
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Status</CardTitle>
          <CardDescription>Recent assignments progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Math Problem Set 5</p>
              <p className="text-sm text-muted-foreground">Class X-A</p>
            </div>
            <div className="w-40">
              <div className="flex justify-between text-sm mb-1">
                <span>Submitted</span>
                <span>32/40</span>
              </div>
              <Progress value={80} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Physics Lab Report</p>
              <p className="text-sm text-muted-foreground">Class XI-B</p>
            </div>
            <div className="w-40">
              <div className="flex justify-between text-sm mb-1">
                <span>Submitted</span>
                <span>25/35</span>
              </div>
              <Progress value={71} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Chemistry Research Paper</p>
              <p className="text-sm text-muted-foreground">Class XII-A</p>
            </div>
            <div className="w-40">
              <div className="flex justify-between text-sm mb-1">
                <span>Submitted</span>
                <span>18/28</span>
              </div>
              <Progress value={64} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
