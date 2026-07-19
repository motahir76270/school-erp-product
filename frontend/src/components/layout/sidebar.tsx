'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  FileText,
  Bell,
  Settings,
  Clock,
  ClipboardList,
  Library,
  Award,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

interface SidebarProps {
  role: 'super_admin' | 'admin' | 'teacher' | 'student';
}

const menuItems = {
  super_admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
    { icon: Users, label: 'Students', href: '/dashboard/admin/students' },
    { icon: GraduationCap, label: 'Teachers', href: '/dashboard/admin/teachers' },
    { icon: BookOpen, label: 'Classes', href: '/dashboard/admin/classes' },
    { icon: BookOpen, label: 'Subjects', href: '/dashboard/admin/subjects' },
    { icon: Clock, label: 'Attendance', href: '/dashboard/admin/attendance' },
    { icon: DollarSign, label: 'Fees', href: '/dashboard/admin/fees' },
    { icon: Calendar, label: 'Timetable', href: '/dashboard/admin/timetable' },
    { icon: Award, label: 'Exams', href: '/dashboard/admin/exams' },
    { icon: ClipboardList, label: 'Assignments', href: '/dashboard/admin/assignments' },
    { icon: Library, label: 'Library', href: '/dashboard/admin/library' },
    { icon: FileText, label: 'Notices', href: '/dashboard/admin/notices' },
    { icon: Bell, label: 'Events', href: '/dashboard/admin/events' },
    { icon: Settings, label: 'GateWay', href: '/dashboard/admin/gateway' },
    { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: Users, label: 'Students', href: '/dashboard/admin/students' },
    { icon: GraduationCap, label: 'Teachers', href: '/dashboard/admin/teachers' },
    { icon: BookOpen, label: 'Classes', href: '/dashboard/admin/classes' },
    { icon: Clock, label: 'Attendance', href: '/dashboard/admin/attendance' },
    { icon: DollarSign, label: 'Fees', href: '/dashboard/admin/fees' },
    { icon: Calendar, label: 'Timetable', href: '/dashboard/admin/timetable' },
    { icon: Award, label: 'Exams', href: '/dashboard/admin/exams' },
    { icon: ClipboardList, label: 'Assignments', href: '/dashboard/admin/assignments' },
    { icon: Library, label: 'Library', href: '/dashboard/admin/library' },
    { icon: FileText, label: 'Notices', href: '/dashboard/admin/notices' },
    { icon: Bell, label: 'Events', href: '/dashboard/admin/events' },
    { icon: Bell, label: 'post', href: '/dashboard/admin/post' },
    { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/teacher' },
    { icon: Users, label: 'My Students', href: '/dashboard/teacher/students' },
    { icon: Clock, label: 'Attendance', href: '/dashboard/teacher/attendance' },
    { icon: Calendar, label: 'Timetable', href: '/dashboard/teacher/timetable' },
    { icon: Award, label: 'Exams & Marks', href: '/dashboard/teacher/exams' },
    { icon: ClipboardList, label: 'Assignments', href: '/dashboard/teacher/assignments' },
    { icon: BookOpen, label: 'MCQ Tests', href: '/dashboard/teacher/mcq' },
    { icon: Bell, label: 'Notices', href: '/dashboard/teacher/notices' },
    { icon: User, label: 'Profile', href: '/dashboard/teacher/profile' },
  ],
  student: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student' },
    { icon: Clock, label: 'Attendance', href: '/dashboard/student/attendance' },
    { icon: Calendar, label: 'Timetable', href: '/dashboard/student/timetable' },
    { icon: Award, label: 'Results', href: '/dashboard/student/results' },
    { icon: DollarSign, label: 'Fees', href: '/dashboard/student/fees' },
    { icon: ClipboardList, label: 'Assignments', href: '/dashboard/student/assignments' },
    { icon: BookOpen, label: 'MCQ Tests', href: '/dashboard/student/mcq' },
    { icon: Library, label: 'Library', href: '/dashboard/student/library' },
    { icon: Bell, label: 'Notices', href: '/dashboard/student/notices' },
    { icon: User, label: 'Profile', href: '/dashboard/student/profile' },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state:any) => state.auth);

  const items = menuItems[role] || [];

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">School ERP</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed && 'lg:w-16'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
