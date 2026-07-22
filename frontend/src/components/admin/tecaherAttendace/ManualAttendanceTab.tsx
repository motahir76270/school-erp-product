// app/dashboard/attendance/teacher-attendance/components/ManualAttendanceTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  UserCheck,
  UserX,
  Clock,
  UserMinus,
  Search
} from 'lucide-react';

interface ManualAttendanceTabProps {
  teachers: any[];
  loading: boolean;
  onSubmit: (data: any) => void;
}

export const ManualAttendanceTab = ({
  teachers,
  loading,
  onSubmit
}: ManualAttendanceTabProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherStatuses, setTeacherStatuses] = useState<Record<string, string>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const initialStatuses: Record<string, string> = {};
    teachers.forEach((teacher: any) => {
      initialStatuses[teacher.id] = 'present';
    });
    setTeacherStatuses(initialStatuses);
  }, [teachers]);

  const handleStatusChange = (teacherId: string, status: string) => {
    setTeacherStatuses(prev => ({
      ...prev,
      [teacherId]: status
    }));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newStatuses: Record<string, string> = {};
    teachers.forEach((teacher: any) => {
      newStatuses[teacher.id] = newSelectAll ? 'present' : 'absent';
    });
    setTeacherStatuses(newStatuses);
  };

  const handleSubmit = () => {
    const teacherList = teachers.map((teacher: any) => ({
      teacherId: teacher.id,
      status: teacherStatuses[teacher.id] || 'present'
    }));

    onSubmit({
      date: selectedDate,
      markingMethod: 'manual',
      teachers: teacherList
    });
  };

  const filteredTeachers = teachers.filter((teacher: any) => {
    const matchesSearch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'present' && teacherStatuses[teacher.id] === 'present') ||
      (filterStatus === 'absent' && teacherStatuses[teacher.id] === 'absent') ||
      (filterStatus === 'late' && teacherStatuses[teacher.id] === 'late') ||
      (filterStatus === 'leave' && teacherStatuses[teacher.id] === 'leave');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1">
          <Label htmlFor="attendance-date">Date</Label>
          <Input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-[200px]"
          />
        </div>
        <div className="flex-1">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-[150px]">
          <Label>Filter</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSelectAll}>
            {selectAll ? 'Deselect All' : 'All Present'}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || teachers.length === 0}>
            {loading ? 'Marking...' : 'Mark Attendance'}
          </Button>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No teachers found. Please add teachers first.
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No teachers match your search criteria.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher: any) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {teacher.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">{teacher.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.employeeId}</TableCell>
                  <TableCell>{teacher.specialization || 'N/A'}</TableCell>
                  <TableCell>
                    <Select
                      value={teacherStatuses[teacher.id] || 'present'}
                      onValueChange={(value) => handleStatusChange(teacher.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <span className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            Present
                          </span>
                        </SelectItem>
                        <SelectItem value="absent">
                          <span className="flex items-center gap-2">
                            <UserX className="h-4 w-4 text-red-600" />
                            Absent
                          </span>
                        </SelectItem>
                        <SelectItem value="late">
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            Late
                          </span>
                        </SelectItem>
                        <SelectItem value="leave">
                          <span className="flex items-center gap-2">
                            <UserMinus className="h-4 w-4 text-blue-600" />
                            Leave
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};