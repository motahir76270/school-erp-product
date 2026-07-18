// dashboard/admin/fee/assign/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllFeeTypesApiCall,
  createFeeTypeApiCall,
  updateFeeTypeApiCall,
  deleteFeeTypeApiCall,
  updateFeeTypeStatusApiCall,
  assignFeeToStudentApiCall,
  assignFeeTosectionApiCall,
  setFeeTypes,
  setLoading,
  setError,
} from '@/store/slices/feeSlice';
import {
  getStudentsByClassAndSectionApiCall,
} from '@/store/slices/studentSlice';
import {
  getAllClassWithSections,
} from '@/store/slices/classSlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  UserPlus, 
  RefreshCw, 
  Users, 
  FileText,
  Loader2,
  School,
  User,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

// ==================== Types ====================
interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  admissionNumber: string | null;
  classId: string;
  sectionId: string | null;
  profileImage: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'suspended';
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

interface FeeType {
  id: string;
  userId: string;
  name: string;
  code: string;
  amount: string;
  frequency: string;
  dueDay: number;
  penaltyPerDay: string;
  applicableClasses: string[];
  description: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ==================== Zod Schemas ====================
// Schema for fee type
const feeTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  amount: z.string().min(1, 'Amount is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  dueDay: z.string().optional(),
  penaltyPerDay: z.string().optional(),
  applicableClasses: z.array(z.string()).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

// Schema for assigning fee to section
const assignSectionFeeSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().optional(),
  feeTypeId: z.string().min(1, 'Fee type is required'),
  amount: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  discount: z.string().optional(),
  scholarship: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  month: z.string().optional(),
});

type FeeTypeFormData = z.infer<typeof feeTypeSchema>;
type AssignSectionFeeFormData = z.infer<typeof assignSectionFeeSchema>;

// ==================== Component ====================
export default function AssignFeePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { feeTypes, loading } = useAppSelector((state: any) => state.fee);

  console.log("Fee Types:", feeTypes);
  
  // ==================== State ====================
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableSections, setAvailableSections] = useState<Array<{id: string, name: string}>>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType | null>(null);
  const [selectedFeeTypeForEdit, setSelectedFeeTypeForEdit] = useState<FeeType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [activeTab, setActiveTab] = useState('section');
  const [selectAll, setSelectAll] = useState(false);
  
  // Fee Type Dialog States
  const [isFeeTypeDialogOpen, setIsFeeTypeDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [feeTypeToDelete, setFeeTypeToDelete] = useState<FeeType | null>(null);

  // ==================== Forms ====================
  const feeTypeForm = useForm<FeeTypeFormData>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues: {
      frequency: 'monthly',
      dueDay: '10',
      penaltyPerDay: '0',
      status: 'active',
      applicableClasses: [],
    },
  });

  const sectionForm = useForm<AssignSectionFeeFormData>({
    resolver: zodResolver(assignSectionFeeSchema),
    defaultValues: {
      academicYear: new Date().getFullYear().toString(),
      month: new Date().toLocaleString('default', { month: 'long' }),
    },
  });

  // Watch values
  const sectionWatchFeeTypeId = sectionForm.watch('feeTypeId');
  const sectionWatchClassId = sectionForm.watch('classId');
  const sectionWatchSectionId = sectionForm.watch('sectionId');

  // ==================== Effects ====================
  // Update fee type details when selected
  useEffect(() => {
    if (sectionWatchFeeTypeId) {
      const feeType = feeTypes.find((f: any) => f.id === sectionWatchFeeTypeId);
      setSelectedFeeType(feeType);
      if (feeType) {
        sectionForm.setValue('amount', feeType.amount);
      }
    }
  }, [sectionWatchFeeTypeId, feeTypes, sectionForm]);

  // Load students when class/section changes
  useEffect(() => {
    if (sectionWatchClassId) {
      fetchStudentsByClassAndSection();
    }
  }, [sectionWatchClassId, sectionWatchSectionId]);

  // Update sections when class changes
  useEffect(() => {
    if (sectionWatchClassId) {
      const selectedClass = classes.find(c => c.id === sectionWatchClassId);
      setAvailableSections(selectedClass?.sections || []);
      sectionForm.setValue('sectionId', '');
      setSelectedStudentIds([]);
      setSelectAll(false);
    } else {
      setAvailableSections([]);
    }
  }, [sectionWatchClassId, classes, sectionForm]);

  // Update selected students when studentsList changes
  useEffect(() => {
    if (sectionWatchClassId) {
      const studentIds = studentsList.map(s => s.id);
      setSelectedStudentIds(selectAll ? studentIds : []);
    }
  }, [studentsList, sectionWatchClassId, selectAll]);

  // ==================== API Calls ====================
  // Fetch classes with sections
  const fetchClasses = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsLoadingClasses(true);
    try {
      const data = await getAllClassWithSections(token);
      console.log('Classes Response:', data);
      
      if (data?.success === true && data?.data) {
        setClasses(data.data);
      } else {
        toast.error(data?.message || 'Failed to fetch classes');
      }
    } catch (error: any) {
      console.error('Fetch classes error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Fetch students by class and section
  const fetchStudentsByClassAndSection = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    if (!sectionWatchClassId) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await getStudentsByClassAndSectionApiCall(
        token,
        sectionWatchClassId,
        sectionWatchSectionId || ''
      );
      
      console.log('Students by Class/Section Response:', data);
      
      if (data?.success === true) {
        let studentsData = [];
        if (Array.isArray(data.data)) {
          studentsData = data.data;
        } else if (data.data?.students && Array.isArray(data.data.students)) {
          studentsData = data.data.students;
        } else {
          studentsData = [];
        }
        
        // Filter only active students
        const activeStudents = studentsData.filter((s: any) => s.status === 'active');
        setStudentsList(activeStudents);
        
        // Extract student IDs for the payload
        const studentIds = activeStudents.map((s: any) => s.id);
        setSelectedStudentIds(selectAll ? studentIds : []);
        
        if (activeStudents.length > 0) {
          toast.success(`Found ${activeStudents.length} active students`);
        } else {
          toast.info('No active students found in this section');
        }
      } else {
        toast.error(data?.message || 'Failed to fetch students');
        setStudentsList([]);
        setSelectedStudentIds([]);
      }
    } catch (error: any) {
      console.error('Fetch students error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch students');
      setStudentsList([]);
      setSelectedStudentIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch fee types
  const fetchFeeTypes = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      console.log('Fetching fee types...');
      const feeTypesRes: any = await getAllFeeTypesApiCall(token, { status: 'all' });
      console.log('Fee types response:', feeTypesRes);
      
      if (feeTypesRes?.success === true && feeTypesRes?.data) {
        dispatch(setFeeTypes(feeTypesRes.data));
        console.log('Fee types set successfully:', feeTypesRes.data);
      } else {
        toast.error(feeTypesRes?.message || 'Failed to fetch fee types');
        dispatch(setFeeTypes([]));
      }
    } catch (error: any) {
      console.error('Fetch fee types error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch fee types');
      dispatch(setFeeTypes([]));
    }
  };

  // Fetch all data
  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));
    
    try {
      // Fetch fee types
      await fetchFeeTypes();
      
      // Fetch classes with sections
      await fetchClasses();
      
    } catch (error: any) {
      console.error('Fetch data error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch data';
      toast.error(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==================== Fee Type CRUD Handlers ====================
  const handleCreateFeeType = async (data: FeeTypeFormData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        code: data.code.toUpperCase(),
        amount: data.amount,
        frequency: data.frequency,
        dueDay: parseInt(data.dueDay || '10'),
        penaltyPerDay: data.penaltyPerDay || '0',
        applicableClasses: data.applicableClasses || [],
        description: data.description || null,
        status: data.status || 'active',
      };

      console.log('Create Fee Type Payload:', payload);
      const response = await createFeeTypeApiCall(token, payload);
      console.log('Create Fee Type Response:', response);

      if (response?.success) {
        toast.success(response.message || 'Fee type created successfully');
        setIsFeeTypeDialogOpen(false);
        feeTypeForm.reset({
          frequency: 'monthly',
          dueDay: '10',
          penaltyPerDay: '0',
          status: 'active',
          applicableClasses: [],
        });
        await fetchFeeTypes();
      } else {
        toast.error(response?.message || 'Failed to create fee type');
      }
    } catch (error: any) {
      console.error('Create fee type error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to create fee type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFeeType = async (data: FeeTypeFormData) => {
    const token = localStorage.getItem('accessToken');
    if (!token || !selectedFeeTypeForEdit) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        code: data.code.toUpperCase(),
        amount: data.amount,
        frequency: data.frequency,
        dueDay: parseInt(data.dueDay || '10'),
        penaltyPerDay: data.penaltyPerDay || '0',
        applicableClasses: data.applicableClasses || [],
        description: data.description || null,
        status: data.status || 'active',
      };

      console.log('Update Fee Type Payload:', payload);
      const response = await updateFeeTypeApiCall(token, selectedFeeTypeForEdit.id, payload);
      console.log('Update Fee Type Response:', response);

      if (response?.success) {
        toast.success(response.message || 'Fee type updated successfully');
        setIsFeeTypeDialogOpen(false);
        setSelectedFeeTypeForEdit(null);
        feeTypeForm.reset({
          frequency: 'monthly',
          dueDay: '10',
          penaltyPerDay: '0',
          status: 'active',
          applicableClasses: [],
        });
        await fetchFeeTypes();
      } else {
        toast.error(response?.message || 'Failed to update fee type');
      }
    } catch (error: any) {
      console.error('Update fee type error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update fee type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeeType = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !feeTypeToDelete) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await deleteFeeTypeApiCall(token, feeTypeToDelete.id);
      console.log('Delete Fee Type Response:', response);

      if (response?.success) {
        toast.success(response.message || 'Fee type deleted successfully');
        setIsDeleteDialogOpen(false);
        setFeeTypeToDelete(null);
        await fetchFeeTypes();
      } else {
        toast.error(response?.message || 'Failed to delete fee type');
      }
    } catch (error: any) {
      console.error('Delete fee type error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to delete fee type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (feeType: FeeType) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    const newStatus = feeType.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await updateFeeTypeStatusApiCall(token, feeType.id, newStatus);
      console.log('Update Status Response:', response);

      if (response?.success) {
        toast.success(`Fee type ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        await fetchFeeTypes();
      } else {
        toast.error(response?.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update status');
    }
  };

  // ==================== Handlers ====================
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    if (newSelectAll) {
      const studentIds = studentsList.map(s => s.id);
      setSelectedStudentIds(studentIds);
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSelection = prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];
      
      setSelectAll(newSelection.length === studentsList.length && studentsList.length > 0);
      return newSelection;
    });
  };

  const handleClassChange = (classId: string) => {
    sectionForm.setValue('classId', classId);
    sectionForm.setValue('sectionId', '');
    setStudentsList([]);
    setSelectedStudentIds([]);
    setSelectAll(false);
    
    const selectedClass = classes.find(c => c.id === classId);
    setAvailableSections(selectedClass?.sections || []);
  };

  const openCreateFeeTypeDialog = () => {
    setIsEditMode(false);
    setSelectedFeeTypeForEdit(null);
    feeTypeForm.reset({
      frequency: 'monthly',
      dueDay: '10',
      penaltyPerDay: '0',
      status: 'active',
      applicableClasses: [],
    });
    setIsFeeTypeDialogOpen(true);
  };

  const openEditFeeTypeDialog = (feeType: FeeType) => {
    setIsEditMode(true);
    setSelectedFeeTypeForEdit(feeType);
    feeTypeForm.reset({
      name: feeType.name,
      code: feeType.code,
      amount: feeType.amount,
      frequency: feeType.frequency,
      dueDay: feeType.dueDay?.toString() || '10',
      penaltyPerDay: feeType.penaltyPerDay || '0',
      applicableClasses: feeType.applicableClasses || [],
      description: feeType.description || '',
      status: feeType.status || 'active',
    });
    setIsFeeTypeDialogOpen(true);
  };

  const openDeleteDialog = (feeType: FeeType) => {
    setFeeTypeToDelete(feeType);
    setIsDeleteDialogOpen(true);
  };

  // ==================== Submit Handlers ====================
  const onSubmitSectionFee = async (data: AssignSectionFeeFormData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast.error('No students selected. Please select at least one student.');
      return;
    }

    const amount = parseFloat(data.amount || '0');
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        studentIds: selectedStudentIds,
        feeTypeId: data.feeTypeId,
        amount: data.amount,
        dueDate: data.dueDate,
        discount: data.discount || '0',
        scholarship: data.scholarship || '0',
        academicYear: data.academicYear,
        month: data.month || '',
      };

      console.log('Assign Section Fee Payload:', payload);
      console.log('Selected Student IDs:', selectedStudentIds);
      console.log('Number of Students:', selectedStudentIds.length);

      const response = await assignFeeTosectionApiCall(token, payload);
      console.log('Assign Section Fee Response:', response);

      if (response?.success) {
        toast.success(response.message || `Fee assigned to ${selectedStudentIds.length} students successfully`);
        sectionForm.reset({
          academicYear: new Date().getFullYear().toString(),
          month: new Date().toLocaleString('default', { month: 'long' }),
        });
        setSelectedStudentIds([]);
        setSelectAll(false);
        setStudentsList([]);
        await fetchData();
      } else {
        toast.error(response?.message || 'Failed to assign fee');
      }
    } catch (error: any) {
      console.error('Assign section fee error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to assign fee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Fee Management" 
          description="Manage fee types and assign fees to students"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="section" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            By Section
          </TabsTrigger>
          <TabsTrigger value="feetypes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fee Types
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Section-based Fee Assignment */}
        <TabsContent value="section">
          <Card>
            <CardHeader>
              <CardTitle>Assign Fee by Section</CardTitle>
              <CardDescription>Assign a fee type to multiple students in a class/section</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sectionForm.handleSubmit(onSubmitSectionFee)} className="space-y-4">
                {/* Class Selection */}
                <div className="space-y-2">
                  <Label htmlFor="classId">Class <span className="text-red-500">*</span></Label>
                  <Select 
                    onValueChange={handleClassChange}
                    disabled={isLoading || isLoadingClasses || classes.length === 0}
                  >
                    <SelectTrigger className={sectionForm.formState.errors.classId ? 'border-red-500' : ''}>
                      <SelectValue placeholder={
                        isLoadingClasses ? 'Loading classes...' : 
                        classes.length === 0 ? 'No classes available' : 
                        'Select class'
                      } />
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
                  {sectionForm.formState.errors.classId && (
                    <p className="text-sm text-red-500">{sectionForm.formState.errors.classId.message}</p>
                  )}
                </div>

                {/* Section Selection */}
                <div className="space-y-2">
                  <Label htmlFor="sectionId">Section</Label>
                  <Select 
                    onValueChange={(value) => sectionForm.setValue('sectionId', value)}
                    disabled={!sectionWatchClassId || availableSections.length === 0 || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !sectionWatchClassId ? 'Select class first' : 
                        availableSections.length === 0 ? 'No sections available' : 
                        'All Sections'
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

                {/* Students List */}
                {sectionWatchClassId && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Students in this section ({studentsList.length})</Label>
                      {studentsList.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                          disabled={isLoading}
                        >
                          {selectAll ? 'Deselect All' : 'Select All'}
                        </Button>
                      )}
                    </div>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">Loading students...</span>
                        </div>
                      ) : studentsList.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {sectionWatchClassId ? 'No students found in this class/section' : 'Select a class to view students'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {studentsList.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={selectedStudentIds.includes(student.id)}
                                onCheckedChange={() => handleStudentSelect(student.id)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                                {student.name} ({student.admissionNumber || student.rollNumber})
                              </Label>
                              <Badge variant="outline" className="ml-auto">
                                {student.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {studentsList.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedStudentIds.length} of {studentsList.length} students
                      </p>
                    )}
                  </div>
                )}

                {/* Fee Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="sectionFeeTypeId">Fee Type <span className="text-red-500">*</span></Label>
                  <Select 
                    onValueChange={(value) => sectionForm.setValue('feeTypeId', value)}
                    disabled={isLoading || feeTypes.length === 0}
                  >
                    <SelectTrigger className={sectionForm.formState.errors.feeTypeId ? 'border-red-500' : ''}>
                      <SelectValue placeholder={feeTypes.length === 0 ? 'No fee types available' : 'Select fee type'} />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTypes.filter((f: any) => f.status === 'active').map((feeType: any) => (
                        <SelectItem key={feeType.id} value={feeType.id}>
                          {feeType.name} - ₹{parseFloat(feeType.amount).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sectionForm.formState.errors.feeTypeId && (
                    <p className="text-sm text-red-500">{sectionForm.formState.errors.feeTypeId.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="sectionAmount">Amount <span className="text-red-500">*</span></Label>
                  <Input
                    id="sectionAmount"
                    type="number"
                    step="0.01"
                    {...sectionForm.register('amount')}
                    placeholder="Enter amount"
                    className={sectionForm.formState.errors.amount ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {sectionForm.formState.errors.amount && (
                    <p className="text-sm text-red-500">{sectionForm.formState.errors.amount.message}</p>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="sectionDueDate">Due Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="sectionDueDate"
                    type="date"
                    {...sectionForm.register('dueDate')}
                    className={sectionForm.formState.errors.dueDate ? 'border-red-500' : ''}
                    disabled={isLoading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {sectionForm.formState.errors.dueDate && (
                    <p className="text-sm text-red-500">{sectionForm.formState.errors.dueDate.message}</p>
                  )}
                </div>

                {/* Discount */}
                <div className="space-y-2">
                  <Label htmlFor="sectionDiscount">Discount</Label>
                  <Input
                    id="sectionDiscount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...sectionForm.register('discount')}
                    placeholder="Enter discount amount"
                    disabled={isLoading}
                  />
                </div>

                {/* Scholarship */}
                <div className="space-y-2">
                  <Label htmlFor="sectionScholarship">Scholarship</Label>
                  <Input
                    id="sectionScholarship"
                    type="number"
                    step="0.01"
                    min="0"
                    {...sectionForm.register('scholarship')}
                    placeholder="Enter scholarship amount"
                    disabled={isLoading}
                  />
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="sectionAcademicYear">Academic Year <span className="text-red-500">*</span></Label>
                  <Input
                    id="sectionAcademicYear"
                    {...sectionForm.register('academicYear')}
                    placeholder="e.g., 2024"
                    className={sectionForm.formState.errors.academicYear ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {sectionForm.formState.errors.academicYear && (
                    <p className="text-sm text-red-500">{sectionForm.formState.errors.academicYear.message}</p>
                  )}
                </div>

                {/* Month */}
                <div className="space-y-2">
                  <Label htmlFor="sectionMonth">Month</Label>
                  <Input
                    id="sectionMonth"
                    {...sectionForm.register('month')}
                    placeholder="e.g., January"
                    disabled={isLoading}
                  />
                </div>

                {/* Summary */}
                {selectedFeeType && sectionWatchClassId && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Fee Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Class:</span>
                        <span className="font-medium">
                          {classes.find(c => c.id === sectionWatchClassId)?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Section:</span>
                        <span className="font-medium">
                          {sectionWatchSectionId 
                            ? availableSections.find(s => s.id === sectionWatchSectionId)?.name || 'N/A'
                            : 'All Sections'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Students:</span>
                        <span className="font-medium">{selectedStudentIds.length} students</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee Type:</span>
                        <span className="font-medium">{selectedFeeType.name}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-muted-foreground">Amount per student:</span>
                        <span className="font-bold">₹{parseFloat(sectionForm.watch('amount') || selectedFeeType.amount || '0').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total amount:</span>
                        <span className="font-bold text-primary">
                          ₹{(parseFloat(sectionForm.watch('amount') || selectedFeeType.amount || '0') * selectedStudentIds.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      sectionForm.reset({
                        academicYear: new Date().getFullYear().toString(),
                        month: new Date().toLocaleString('default', { month: 'long' }),
                      });
                      setSelectedStudentIds([]);
                      setSelectAll(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={
                      isSubmitting || 
                      isLoading || 
                      feeTypes.filter((f: any) => f.status === 'active').length === 0 || 
                      selectedStudentIds.length === 0 ||
                      !sectionWatchClassId
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Assign to {selectedStudentIds.length} Students
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Fee Types Management */}
        <TabsContent value="feetypes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fee Types</CardTitle>
                <CardDescription>Manage fee types for your institution</CardDescription>
              </div>
              <Button onClick={openCreateFeeTypeDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Fee Type
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Due Day</TableHead>
                      <TableHead>Penalty/Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Loading fee types...
                        </TableCell>
                      </TableRow>
                    ) : feeTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No fee types found. Create your first fee type.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feeTypes.map((feeType: FeeType) => (
                        <TableRow key={feeType.id}>
                          <TableCell className="font-medium">{feeType.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{feeType.code}</Badge>
                          </TableCell>
                          <TableCell>₹{parseFloat(feeType.amount).toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{feeType.frequency}</TableCell>
                          <TableCell>{feeType.dueDay}</TableCell>
                          <TableCell>₹{parseFloat(feeType.penaltyPerDay || '0').toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              className={feeType.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}
                              onClick={() => handleToggleStatus(feeType)}
                              style={{ cursor: 'pointer' }}
                            >
                              {feeType.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditFeeTypeDialog(feeType)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => openDeleteDialog(feeType)}
                              >
                                <Trash2 className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>

      {/* Fee Type Create/Edit Dialog */}
      <Dialog open={isFeeTypeDialogOpen} onOpenChange={setIsFeeTypeDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Fee Type' : 'Create Fee Type'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the fee type details' : 'Add a new fee type to your institution'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={feeTypeForm.handleSubmit(isEditMode ? handleUpdateFeeType : handleCreateFeeType)}>
            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  {...feeTypeForm.register('name')}
                  placeholder="e.g., Tuition Fee"
                  className={feeTypeForm.formState.errors.name ? 'border-red-500' : ''}
                />
                {feeTypeForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{feeTypeForm.formState.errors.name.message}</p>
                )}
              </div>

              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
                <Input
                  id="code"
                  {...feeTypeForm.register('code')}
                  placeholder="e.g., TUITION"
                  className={feeTypeForm.formState.errors.code ? 'border-red-500' : ''}
                  disabled={isEditMode}
                />
                {feeTypeForm.formState.errors.code && (
                  <p className="text-sm text-red-500">{feeTypeForm.formState.errors.code.message}</p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...feeTypeForm.register('amount')}
                  placeholder="Enter amount"
                  className={feeTypeForm.formState.errors.amount ? 'border-red-500' : ''}
                />
                {feeTypeForm.formState.errors.amount && (
                  <p className="text-sm text-red-500">{feeTypeForm.formState.errors.amount.message}</p>
                )}
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => feeTypeForm.setValue('frequency', value)}
                  defaultValue={feeTypeForm.watch('frequency')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_yearly">Half Yearly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
                {feeTypeForm.formState.errors.frequency && (
                  <p className="text-sm text-red-500">{feeTypeForm.formState.errors.frequency.message}</p>
                )}
              </div>

              {/* Due Day */}
              <div className="space-y-2">
                <Label htmlFor="dueDay">Due Day</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  {...feeTypeForm.register('dueDay')}
                  placeholder="e.g., 10"
                />
              </div>

              {/* Penalty Per Day */}
              <div className="space-y-2">
                <Label htmlFor="penaltyPerDay">Penalty Per Day</Label>
                <Input
                  id="penaltyPerDay"
                  type="number"
                  step="0.01"
                  min="0"
                  {...feeTypeForm.register('penaltyPerDay')}
                  placeholder="e.g., 10"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...feeTypeForm.register('description')}
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  onValueChange={(value) => feeTypeForm.setValue('status', value)}
                  defaultValue={feeTypeForm.watch('status') || 'active'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFeeTypeDialogOpen(false);
                  setSelectedFeeTypeForEdit(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{feeTypeToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setFeeTypeToDelete(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteFeeType}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}