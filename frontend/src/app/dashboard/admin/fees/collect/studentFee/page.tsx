// app/dashboard/fee/collection/studentFee/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getStudentsByClassAndSectionApiCall,
  setLoading,
  setError,
  setStudents,
} from '@/store/slices/studentSlice';
import {
  getAllClassWithSections,
} from '@/store/slices/classSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Search, User, RefreshCw, CreditCard, Eye, Filter, School, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  admissionNumber: string | null;
  classId: string;
  sectionId: string | null;
  profileImage: string | null;
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean;
  admissionDate: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  phone: string | null;
  address: string | null;
}

interface ClassData {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    name: string;
    classId: string;
  }>;
}

export default function StudentFeeCollectionPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { students, loading } = useAppSelector((state: any) => state.student);
  
  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;
  
  // State
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableSections, setAvailableSections] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [studentsList, setStudentsList] = useState<Student[]>([]);

  // Fetch Classes
  const fetchClasses = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsLoadingClasses(true);
    try {
      const data = await getAllClassWithSections(token);
      if (data?.success === true && data?.data) {
        setClasses(data.data);
      } else {
        toast.error(data?.message || 'Failed to fetch classes');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Fetch Students by Class and Section
  const fetchStudents = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    if (!selectedClassId) {
      toast.warning('Please select a class first');
      return;
    }

    dispatch(setLoading(true));
    try {
      const data = await getStudentsByClassAndSectionApiCall(
        token,
        selectedClassId,
        selectedSectionId
      );
      
      console.log('API Response:', data);
      
      if (data?.success === true) {
        // Check if data.data is an array or has students property
        let studentsData = [];
        if (Array.isArray(data.data)) {
          studentsData = data.data;
        } else if (data.data?.students && Array.isArray(data.data.students)) {
          studentsData = data.data.students;
        } else {
          studentsData = [];
        }
        
        setStudentsList(studentsData);
        dispatch(setStudents(studentsData));
        toast.success(`Found ${studentsData.length} students`);
      } else {
        toast.error(data?.message || 'Failed to fetch students');
        setStudentsList([]);
        dispatch(setStudents([]));
      }
    } catch (error: any) {
      console.error('Fetch students error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch students');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch students'));
      setStudentsList([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle class change
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId('');
    setStudentsList([]);
    
    const selectedClass = classes.find(c => c.id === classId);
    setAvailableSections(selectedClass?.sections || []);
  };

  // Handle student click to view fee details
  const handleStudentFeeReciptsClick = (student: Student) => {
    router.push(`studentFee/receipts/${student.id}`);
  };

  // Handle collect fee button
  const handleCollectFee = (student: Student) => {
    router.push(`studentFee/${student.id}`);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId, selectedSectionId]);

  // Filter students by search - FIXED: Using studentsList instead of students
  const filteredStudents = Array.isArray(studentsList) ? studentsList.filter((student: Student) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.rollNumber?.toLowerCase().includes(query) ||
      (student.admissionNumber && student.admissionNumber.toLowerCase().includes(query))
    );
  }) : [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500 hover:bg-green-600',
      inactive: 'bg-gray-500 hover:bg-gray-600',
      suspended: 'bg-red-500 hover:bg-red-600',
    };
    return variants[status] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getStatusLabel = (status: string) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Fee Collection" 
        description="Select a student to view and collect fees"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
          <CardDescription>Select class and section to view students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="classFilter">Class <span className="text-red-500">*</span></Label>
              <Select
                value={selectedClassId}
                onValueChange={handleClassChange}
              >
                <SelectTrigger disabled={isLoadingClasses}>
                  <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        {cls.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="sectionFilter">Section</Label>
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                disabled={!selectedClassId || availableSections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedClassId ? "Select class first" : 
                    availableSections.length === 0 ? "No sections available" : 
                    "All Sections"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {availableSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {section.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                onClick={fetchStudents} 
                disabled={loading || !selectedClassId}
                className="w-full md:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name, roll number, or email..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>
              {selectedClassId 
                ? `Showing students from ${classes.find(c => c.id === selectedClassId)?.name || ''} ${selectedSectionId ? `- Section ${availableSections.find(s => s.id === selectedSectionId)?.name || ''}` : ''}`
                : 'Select a class to view students'}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredStudents.length} Students
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : !selectedClassId ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Please select a class to view students
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {search ? 'No students found matching your search' : 'No students in this class'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student: Student) => (
                    <TableRow 
                      key={student.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleStudentFeeReciptsClick(student)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                            {student.profileImage ? (
                              <Image
                                src={`${baseURl}/${student.profileImage}`}
                                alt={student.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            {student.admissionNumber && (
                              <p className="text-xs text-muted-foreground">
                                Admission: {student.admissionNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{student.rollNumber}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(student.status)}>
                          {getStatusLabel(student.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStudentFeeReciptsClick(student)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Receipts
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCollectFee(student)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Collect Fee
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}