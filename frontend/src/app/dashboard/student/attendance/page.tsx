'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStudents } from '@/store/slices/studentSlice';
import { fetchTeachers } from '@/store/slices/teacherSlice';
import { fetchClasses, fetchSections, fetchSubjects } from '@/store/slices/classSlice';
import { fetchAttendanceStats } from '@/store/slices/attendanceSlice';
import { fetchFees, fetchFeeStats, fetchPayments } from '@/store/slices/feeSlice';
import { fetchExams } from '@/store/slices/examSlice';
import { fetchMcqTests } from '@/store/slices/mcqSlice';
import { fetchBooks, fetchIssues } from '@/store/slices/librarySlice';
import { fetchNotices, fetchHolidays } from '@/store/slices/noticeSlice';
import { ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, ClipboardList, DollarSign, FileText, GraduationCap, Library, Settings, Users, Bell, Clock3 } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}

function MetricCard({ title, value, description, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function getModuleKind(pathname: string) {
  const route = pathname.toLowerCase();
  if (route.includes('/students')) return 'students';
  if (route.includes('/teachers')) return 'teachers';
  if (route.includes('/classes')) return 'classes';
  if (route.includes('/attendance')) return 'attendance';
  if (route.includes('/fees')) return 'fees';
  if (route.includes('/exams')) return 'exams';
  if (route.includes('/assignments')) return 'assignments';
  if (route.includes('/mcq')) return 'mcq';
  if (route.includes('/library')) return 'library';
  if (route.includes('/notices')) return 'notices';
  if (route.includes('/holidays')) return 'holidays';
  if (route.includes('/events')) return 'events';
  if (route.includes('/results')) return 'results';
  if (route.includes('/profile')) return 'profile';
  if (route.includes('/settings')) return 'settings';
  if (route.includes('/timetable')) return 'timetable';
  return 'general';
}

function getTitle(moduleKind: string, pathname: string) {
  const slug = pathname.split('/').filter(Boolean).pop() || 'dashboard';
  const titleMap: Record<string, string> = {
    students: 'Students',
    teachers: 'Teachers',
    classes: 'Classes',
    attendance: 'Attendance',
    fees: 'Fees',
    exams: 'Exams',
    assignments: 'Assignments',
    mcq: 'MCQ',
    library: 'Library',
    notices: 'Notices',
    holidays: 'Holidays',
    events: 'Events',
    results: 'Results',
    profile: 'Profile',
    settings: 'Settings',
    timetable: 'Timetable',
    general: slug.replace(/-/g, ' ').replace(/\w/g, (letter) => letter.toUpperCase()),
  };

  return titleMap[moduleKind] || titleMap.general;
}

export default function Page() {
  const pathname = usePathname() || '';
  const dispatch = useAppDispatch();
  const studentState = useAppSelector((state) => state.student);
  const teacherState = useAppSelector((state) => state.teacher);
  const classState = useAppSelector((state) => state.class);
  const attendanceState = useAppSelector((state) => state.attendance);
  const feeState = useAppSelector((state) => state.fee);
  const examState = useAppSelector((state) => state.exam);
  const mcqState = useAppSelector((state) => state.mcq);
  const libraryState = useAppSelector((state) => state.library);
  const noticeState = useAppSelector((state) => state.notice);
  const moduleKind = getModuleKind(pathname);
  const title = getTitle(moduleKind, pathname);
  const description = `Manage ${title.toLowerCase()} for this dashboard section.`;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    switch (moduleKind) {
      case 'students':
        dispatch(fetchStudents({ limit: 5 }));
        break;
      case 'teachers':
        dispatch(fetchTeachers({ limit: 5 }));
        break;
      case 'classes':
        dispatch(fetchClasses());
        dispatch(fetchSections(undefined));
        dispatch(fetchSubjects());
        break;
      case 'attendance':
        dispatch(fetchAttendanceStats({ date: today }));
        break;
      case 'fees':
        dispatch(fetchFees());
        dispatch(fetchFeeStats());
        dispatch(fetchPayments({ status: 'pending' }));
        break;
      case 'exams':
      case 'results':
        dispatch(fetchExams());
        break;
      case 'mcq':
        dispatch(fetchMcqTests({ status: 'published' }));
        break;
      case 'library':
        dispatch(fetchBooks({}));
        dispatch(fetchIssues({ status: 'issued' }));
        break;
      case 'notices':
      case 'holidays':
      case 'events':
        dispatch(fetchNotices());
        dispatch(fetchHolidays());
        break;
      default:
        break;
    }
  }, [dispatch, moduleKind]);

  const renderModuleContent = () => {
    switch (moduleKind) {
      case 'students': {
        const activeStudents = studentState.students.filter((student) => student.isActive).length;
        const recentStudents = studentState.students.slice(0, 4);
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Total students" value={studentState.students.length} description="Students currently in the store" icon={Users} />
              <MetricCard title="Active" value={activeStudents} description="Accounts marked active" icon={CheckCircle2} />
              <MetricCard title="Classes" value={new Set(studentState.students.map((student) => student.classId)).size} description="Distinct class groups" icon={GraduationCap} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recent student records</CardTitle>
                <CardDescription>Live data from the students API slice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentStudents.length > 0 ? recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{student.user?.firstName} {student.user?.lastName}</p>
                      <p className="text-sm text-muted-foreground">Roll {student.rollNumber}</p>
                    </div>
                    <Badge variant={student.isActive ? 'success' : 'secondary'}>{student.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No students loaded yet.</p>}
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'teachers': {
        const activeTeachers = teacherState.teachers.filter((teacher) => teacher.isActive).length;
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Total teachers" value={teacherState.teachers.length} description="Teachers fetched from the API" icon={GraduationCap} />
              <MetricCard title="Active" value={activeTeachers} description="Currently active teachers" icon={CheckCircle2} />
              <MetricCard title="Employees" value={teacherState.teachers.length} description="Ready for roster and profile review" icon={Users} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Teaching staff</CardTitle>
                <CardDescription>Latest teacher records from the Redux teacher slice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacherState.teachers.slice(0, 4).map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{teacher.user?.firstName} {teacher.user?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{teacher.specialization || 'Teaching staff'}</p>
                    </div>
                    <Badge variant="outline">{teacher.employeeId}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'classes': {
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Classes" value={classState.classes.length} description="Class groups available" icon={BookOpen} />
              <MetricCard title="Sections" value={classState.sections.length} description="Sections fetched from the API" icon={Users} />
              <MetricCard title="Subjects" value={classState.subjects.length} description="Subjects in the curriculum" icon={ClipboardList} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Class overview</CardTitle>
                <CardDescription>Most recent school classes and sections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {classState.classes.slice(0, 4).map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{classItem.name}</p>
                      <p className="text-sm text-muted-foreground">{classItem.description || 'Academic class'}</p>
                    </div>
                    <Badge variant="secondary">{classItem.sections?.length || 0} sections</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'attendance': {
        const stats = attendanceState.stats;
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard title="Present" value={stats.present} description="Present today" icon={CheckCircle2} />
              <MetricCard title="Absent" value={stats.absent} description="Absentees" icon={Clock3} />
              <MetricCard title="Late" value={stats.late} description="Late arrivals" icon={CalendarDays} />
              <MetricCard title="Total" value={stats.total} description="Tracked students" icon={Users} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Attendance snapshot</CardTitle>
                <CardDescription>Stats from the attendance slice.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Attendance records are available for the current day and can be expanded with detailed views.</p>
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'fees': {
        const stats = feeState.stats;
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Collected" value={stats.collected} description="Amount collected" icon={DollarSign} />
              <MetricCard title="Pending" value={stats.pending} description="Pending payments" icon={Clock3} />
              <MetricCard title="Fees" value={feeState.fees.length} description="Fee structures configured" icon={FileText} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Fee overview</CardTitle>
                <CardDescription>Recent fee and payment records.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {feeState.fees.slice(0, 4).map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{fee.name}</p>
                      <p className="text-sm text-muted-foreground">{fee.feeType}</p>
                    </div>
                    <Badge variant="outline">{fee.amount}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'exams':
      case 'results': {
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Exams" value={examState.exams.length} description="Exams in the system" icon={ClipboardList} />
              <MetricCard title="Results" value={examState.results.length} description="Stored result entries" icon={Award} />
              <MetricCard title="Marks" value={examState.marks.length} description="Marks records available" icon={FileText} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Exam schedule</CardTitle>
                <CardDescription>Latest exam data returned by the exam slice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {examState.exams.slice(0, 4).map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{exam.name}</p>
                      <p className="text-sm text-muted-foreground">{exam.examType}</p>
                    </div>
                    <Badge variant="outline">{exam.totalMarks} marks</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'mcq': {
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Tests" value={mcqState.tests.length} description="MCQ tests published" icon={ClipboardList} />
              <MetricCard title="Questions" value={mcqState.questions.length} description="Questions loaded" icon={FileText} />
              <MetricCard title="Leaderboard" value={mcqState.leaderboard.length} description="Leaderboard entries" icon={Users} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>MCQ tests</CardTitle>
                <CardDescription>Current test set from the MCQ slice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mcqState.tests.slice(0, 4).map((test) => (
                  <div key={test.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{test.title}</p>
                      <p className="text-sm text-muted-foreground">{test.totalQuestions} questions • {test.duration} mins</p>
                    </div>
                    <Badge variant="secondary">{test.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'library': {
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Books" value={libraryState.books.length} description="Library books available" icon={Library} />
              <MetricCard title="Available" value={libraryState.books.filter((book) => book.availableCopies > 0).length} description="Books ready to issue" icon={BookOpen} />
              <MetricCard title="Issues" value={libraryState.issues.length} description="Active book issues" icon={FileText} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Library activity</CardTitle>
                <CardDescription>Books and borrowed records from the library slice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {libraryState.books.slice(0, 4).map((book) => (
                  <div key={book.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    <Badge variant="outline">{book.availableCopies}/{book.totalCopies}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'notices':
      case 'holidays':
      case 'events': {
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Notices" value={noticeState.notices.length} description="Published notices" icon={Bell} />
              <MetricCard title="Holidays" value={noticeState.holidays.length} description="Calendar events" icon={CalendarDays} />
              <MetricCard title="Status" value="Live" description="Data from notices and holidays slices" icon={CheckCircle2} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Communication feed</CardTitle>
                <CardDescription>Recent notices and special days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {noticeState.notices.slice(0, 4).map((notice) => (
                  <div key={notice.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{notice.title}</p>
                      <p className="text-sm text-muted-foreground">{notice.target}</p>
                    </div>
                    <Badge variant="secondary">{notice.priority}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      }
      default:
        return (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Use this section to review the latest module data and actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Live dashboard view</Badge>
                  <Badge variant="outline">Ready for data</Badge>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {['Track the latest records for this section.', 'Use the dashboard tools to manage daily tasks.', 'Review upcoming actions and keep your workflow current.'].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Useful next steps for this module.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">Review records and assigned users</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">Open recent entries and updates</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm">Plan upcoming activities and deadlines</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm">Adjust module preferences and visibility</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      {renderModuleContent()}
    </div>
  );
}
