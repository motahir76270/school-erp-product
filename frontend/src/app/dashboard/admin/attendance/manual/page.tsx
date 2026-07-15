// dashboard/admin/attendance/manual/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Save, User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { markAttendanceApiCall, getAttendanceByDateApiCall } from '@/store/slices/attendanceSlice';
import { getAllClassWithSections } from '@/store/slices/classSlice';
import { getAllStudentsApiCall } from '@/store/slices/studentSlice';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  classId: string;
  sectionId: string | null;
  status?: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
}

export default function ManualAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const data = await getAllClassWithSections(token);
      if (data?.success) {
        setClasses(data.data);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch classes');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      // Fetch students for the selected class
      const data = await getAllStudentsApiCall(token, 1, '', '', selectedClass, selectedSection);
      
      if (data?.success) {
        const studentsData = data.data.students.map((student: any) => ({
          ...student,
          status: undefined,
          remarks: '',
        }));
        setStudents(studentsData);
        setFilteredStudents(studentsData);
        setAttendanceMarked(false);
        
        // Check if attendance already marked for today
        await checkExistingAttendance(studentsData);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAttendance = async (studentsList: Student[]) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const data = await getAttendanceByDateApiCall(token, {
        date,
        classId: selectedClass,
        sectionId: selectedSection,
      });

      if (data?.success && data.data.attendance) {
        // Mark attendance for students who already have it
        const updatedStudents = studentsList.map(student => {
          const existingLog = data.data.logs.find(
            (log: any) => log.studentId === student.id
          );
          if (existingLog) {
            return {
              ...student,
              status: existingLog.status,
              remarks: existingLog.remarks || '',
            };
          }
          return student;
        });
        
        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);
        setAttendanceMarked(true);
        toast.info('Attendance already marked for today. You can update it.');
      }
    } catch (error) {
      // Attendance not found, proceed with new marking
      console.log('No existing attendance found');
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
    const updatedStudents = students.map(student => {
      if (student.id === studentId) {
        return { ...student, status };
      }
      return student;
    });
    setStudents(updatedStudents);
    setFilteredStudents(updatedStudents);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    const updatedStudents = students.map(student => {
      if (student.id === studentId) {
        return { ...student, remarks };
      }
      return student;
    });
    setStudents(updatedStudents);
    setFilteredStudents(updatedStudents);
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const updatedStudents = students.map(student => ({
      ...student,
      status: status,
    }));
    setStudents(updatedStudents);
    setFilteredStudents(updatedStudents);
  };

  const handleSaveAttendance = async () => {
    // Validate
    const unmarked = students.filter(s => !s.status);
    if (unmarked.length > 0) {
      toast.error(`Please mark attendance for ${unmarked.length} student(s)`);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const attendanceData = students.map(student => ({
        studentId: student.id,
        status: student.status || 'absent',
        remarks: student.remarks || '',
      }));

      const payload = {
        date,
        classId: selectedClass,
        sectionId: selectedSection || undefined,
        markingMethod: 'manual',
        students: attendanceData,
      };

      const data = await markAttendanceApiCall(token, payload);
      
      if (data?.success) {
        toast.success(data?.message || 'Attendance saved successfully');
        setAttendanceMarked(true);
        setTimeout(() => {
          router.push('/dashboard/admin/attendance');
        }, 1500);
      } else {
        toast.error(data?.message || 'Failed to save attendance');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'leave':
        return <Badge className="bg-blue-500">Leave</Badge>;
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      unmarked: 0,
    };
    
    students.forEach(student => {
      if (!student.status) {
        counts.unmarked++;
      } else {
        counts[student.status]++;
      }
    });
    
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mark Attendance" 
        description="Mark attendance for students manually"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value);
                  const classData = classes.find(c => c.id === value);
                  setSections(classData?.sections || []);
                  setSelectedSection('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!sections.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sections.length ? "Select section" : "No sections"} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  disabled={!selectedClass}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      {selectedClass && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Present: {counts.present}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Absent: {counts.absent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Late: {counts.late}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Leave: {counts.leave}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-300" />
                  <span className="text-sm">Unmarked: {counts.unmarked}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAll('present')}
                  className="text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  All Present
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAll('absent')}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  All Absent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Students
            {selectedClass && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredStudents.length} students)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Mark attendance for each student
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a class to view students
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.rollNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {student.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={student.status || ''}
                          onValueChange={(value: any) => 
                            handleStatusChange(student.id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select status">
                              {student.status ? getStatusBadge(student.status) : 'Not marked'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Add remarks..."
                          value={student.remarks || ''}
                          onChange={(e) => 
                            handleRemarksChange(student.id, e.target.value)
                          }
                          className="max-w-[200px]"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Save Button */}
          {selectedClass && !loading && (
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/admin/attendance')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAttendance}
                disabled={saving || !selectedClass}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : attendanceMarked ? 'Update Attendance' : 'Save Attendance'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}