// dashboard/admin/subjects/classSubject/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Users,
  XCircle,
  MoreVertical,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-toastify';
import {
  getSubjectsByClassApiCall,
  assignSubjectToClassApiCall,
  removeSubjectFromClassApiCall,
  bulkAssignSubjectsToClassApiCall,
  getSubjectsApiCall,
  setClassSubjects,
  setLoading,
  setError,
  clearError,
} from '@/store/slices/subjectsSlice';
import { getAllClassWithSections } from '@/store/slices/classSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

interface ClassData {
  id: string;
  name: string;
  sections: any[];
}

interface SubjectData {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface AssignedSubject {
  id: string;
  classId: string;
  subjectId: string;
  subject: SubjectData;
}

export default function ClassSubjects() {
  const dispatch = useAppDispatch();
  const { classSubjects, isLoading, error } = useAppSelector((state) => state.subjects);
  
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects();
      fetchAvailableSubjects();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const data = await getAllClassWithSections(token);
      if (data?.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const fetchClassSubjects = async () => {
    if (!selectedClass) return;

    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const data = await getSubjectsByClassApiCall(token, selectedClass);
      if (data?.success) {
        setAssignedSubjects(data.data.subjects || []);
        dispatch(setClassSubjects(data.data.subjects || []));
      } else {
        toast.error(data?.message || 'Failed to fetch class subjects');
        dispatch(setError(data?.message || 'Failed to fetch class subjects'));
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch class subjects');
      dispatch(setError(error?.message || 'Failed to fetch class subjects'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchAvailableSubjects = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const data = await getSubjectsApiCall(token, { status: 'active', limit: 100 });
      if (data?.success) {
        setSubjects(data.data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleAssignSubjects = async () => {
    if (!selectedClass || selectedSubjectIds.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const payload = {
        classId: selectedClass,
        subjects: selectedSubjectIds.map(id => ({ subjectId: id })),
      };

      const data = await bulkAssignSubjectsToClassApiCall(token, payload);
      if (data?.success) {
        toast.success(data?.message || `${data.data.totalAssigned} subjects assigned successfully`);
        setIsAssignModalOpen(false);
        setSelectedSubjectIds([]);
        fetchClassSubjects();
      } else {
        toast.error(data?.message || 'Failed to assign subjects');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign subjects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSubject = async (assignmentId: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to remove "${subjectName}" from this class?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const data = await removeSubjectFromClassApiCall(token, assignmentId);
      if (data?.success) {
        toast.success(data?.message || 'Subject removed from class successfully');
        fetchClassSubjects();
      } else {
        toast.error(data?.message || 'Failed to remove subject');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove subject');
    }
  };

  const getAvailableSubjects = () => {
    const assignedIds = assignedSubjects.map(as => as.subjectId);
    return subjects.filter(s => !assignedIds.includes(s.id));
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'theory':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Theory</Badge>;
      case 'practical':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Practical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getClassSections = () => {
    const classData = classes.find(c => c.id === selectedClass);
    return classData?.sections || [];
  };

  return (
    <div className="space-y-6">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedSubjectIds([]);
              setIsAssignModalOpen(true);
            }}
            disabled={!selectedClass}
          >
            <Plus className="h-4 w-4 mr-2" />
            Bulk Assign Subjects
          </Button>
        </div>

      {/* Class Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Select Class *</Label>
              <Select
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value);
                  setAssignedSubjects([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
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
              <Label>Sections</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                {getClassSections().length > 0 ? (
                  getClassSections().map((section: any) => (
                    <Badge key={section.id} variant="secondary">
                      {section.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No sections</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Subjects</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md min-h-[40px]">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{assignedSubjects.length} subjects</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Assigned Subjects
            {selectedClass && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({assignedSubjects.length} subjects)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Subjects currently assigned to the selected class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>Please select a class to view assigned subjects</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
              <Button className="mt-4" onClick={fetchClassSubjects}>
                Try Again
              </Button>
            </div>
          ) : assignedSubjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <p>No subjects assigned to this class</p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  setSelectedSubjectIds([]);
                  setIsAssignModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Subjects
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedSubjects.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.subject?.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.subject?.code || 'N/A'}</TableCell>
                      <TableCell>{item.subject ? getTypeBadge(item.subject.type) : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleRemoveSubject(item.id, item.subject?.name || 'Unknown')}
                              className="text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Assign Subjects Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Bulk Assign Subjects to Class
            </DialogTitle>
            <DialogDescription>
              Select multiple subjects to assign to the selected class at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">Selected Class:</p>
              <p className="text-sm text-muted-foreground">
                {classes.find(c => c.id === selectedClass)?.name || 'Unknown'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Available Subjects</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const available = getAvailableSubjects();
                      setSelectedSubjectIds(available.map(s => s.id));
                    }}
                    disabled={getAvailableSubjects().length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubjectIds([])}
                    disabled={selectedSubjectIds.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                {getAvailableSubjects().length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>All available subjects are already assigned</p>
                  </div>
                ) : (
                  getAvailableSubjects().map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleSubjectToggle(subject.id)}
                    >
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{subject.code}</span>
                          {getTypeBadge(subject.type)}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedSubjectIds.includes(subject.id)
                          ? 'bg-primary border-primary text-white'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedSubjectIds.includes(subject.id) && <CheckCircle className="h-4 w-4" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <span className="text-sm">
                Selected: <strong>{selectedSubjectIds.length}</strong> subjects
              </span>
              <span className="text-sm text-muted-foreground">
                Total available: {getAvailableSubjects().length}
              </span>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedSubjectIds([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleAssignSubjects}
                disabled={selectedSubjectIds.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Assigning...
                  </>
                ) : (
                  `Assign ${selectedSubjectIds.length} Subjects`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}