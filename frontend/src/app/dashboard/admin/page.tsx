'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/page-header';
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Bell,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const attendanceData = [
  { name: 'Mon', present: 95, absent: 5 },
  { name: 'Tue', present: 92, absent: 8 },
  { name: 'Wed', present: 97, absent: 3 },
  { name: 'Thu', present: 90, absent: 10 },
  { name: 'Fri', present: 93, absent: 7 },
];

const feeCollectionData = [
  { month: 'Jan', collected: 45000 },
  { month: 'Feb', collected: 52000 },
  { month: 'Mar', collected: 48000 },
  { month: 'Apr', collected: 61000 },
  { month: 'May', collected: 55000 },
  { month: 'Jun', collected: 58000 },
];

const genderDistribution = [
  { name: 'Male', value: 55, color: '#3b82f6' },
  { name: 'Female', value: 45, color: '#ec4899' },
];

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Assignments</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Welcome back! Here's an overview of your school."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value="1,234"
          description="Active students enrolled"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Teachers"
          value="89"
          description="Teaching staff members"
          icon={GraduationCap}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Total Classes"
          value="42"
          description="Active class sections"
          icon={BookOpen}
        />
        <StatCard
          title="Today's Attendance"
          value="94.5%"
          description="Present students today"
          icon={Clock}
          trend={{ value: 2.3, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Student attendance rate this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#22c55e" name="Present %" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Fee Collection</CardTitle>
            <CardDescription>Revenue collected in the past 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feeCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Collected']} />
                  <Legend />
                  <Line type="monotone" dataKey="collected" stroke="#3b82f6" name="Amount ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Student body composition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Status</CardTitle>
            <CardDescription>Current month fee collection progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Monthly Tuition</span>
                <span className="text-sm text-muted-foreground">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Transport Fee</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Library Fee</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium font-semibold">Pending</span>
                <span className="text-sm font-semibold text-red-500">$12,450</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>Latest announcements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Annual Day Celebration</p>
                <p className="text-xs text-muted-foreground">Dec 15, 2024</p>
              </div>
              <Badge variant="warning">Urgent</Badge>
            </div>
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Mid-Term Exam Schedule</p>
                <p className="text-xs text-muted-foreground">Dec 10, 2024</p>
              </div>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Winter Break</p>
                <p className="text-xs text-muted-foreground">Dec 5, 2024</p>
              </div>
              <Badge variant="success">Holiday</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Exams</CardTitle>
          <CardDescription>Scheduled examinations for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Mid-Term Examination</p>
                  <p className="text-sm text-muted-foreground">Class VIII - XII</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">Dec 18-23, 2024</p>
                <Badge>Upcoming</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <Award className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Unit Test - III</p>
                  <p className="text-sm text-muted-foreground">Class I - VII</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">Dec 20-22, 2024</p>
                <Badge>Upcoming</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <Award className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="font-medium">Practical Exams</p>
                  <p className="text-sm text-muted-foreground">Class XII Science</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">Dec 25-28, 2024</p>
                <Badge variant="warning">Scheduled</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
