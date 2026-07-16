// dashboard/admin/subjects/page.tsx
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
  Edit2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Code,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  BookMarked,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-toastify';
import {
  setLoading,
  setError,
  setPagination,
  clearError,
} from '@/store/slices/studentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';
import { createSubjectApiCall, deleteSubjectApiCall, getSubjectsApiCall, hardDeleteSubjectApiCall, setSubjects, updateSubjectApiCall, updateSubjectStatusApiCall } from '@/src/store/slices/subjectsSlice';

interface SubjectFormData {
  name: string;
  code: string;
  type: 'theory' | 'practical';
  maxMarks: number;
  passMarks: number;
}

export default function SubjectsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { subjects, isLoading, error, pagination } = useAppSelector((state) => state.subjects);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    type: 'theory',
    maxMarks: 100,
    passMarks: 33,
  });

  const fetchSubjects = async (page: number = currentPage) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    dispatch(clearError());
    
    try {
      const data = await getSubjectsApiCall(token, {
        page,
        limit: 10,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      
      if (data?.success) {
        dispatch(setSubjects(data.data.subjects || []));
        dispatch(setPagination(data.data.pagination));
      } else {
        toast.error(data?.message || 'Failed to fetch subjects');
        dispatch(setError(data?.message || 'Failed to fetch subjects'));
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch subjects');
      dispatch(setError(error?.message || 'Failed to fetch subjects'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchSubjects(currentPage);
  }, [currentPage, statusFilter, typeFilter]);

  // Handle Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await createSubjectApiCall(token, formData);
      if (data?.success) {
        toast.success(data?.message || 'Subject created successfully');
        setIsCreateModalOpen(false);
        resetForm();
        fetchSubjects(currentPage);
      } else {
        toast.error(data?.message || 'Failed to create subject');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Subject
  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    
    setIsSubmitting(true);
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await updateSubjectApiCall(token, selectedSubject.id, formData);
      if (data?.success) {
        toast.success(data?.message || 'Subject updated successfully');
        setIsEditModalOpen(false);
        setSelectedSubject(null);
        resetForm();
        fetchSubjects(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update subject');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Subject
  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await deleteSubjectApiCall(token, selectedSubject.id);
      if (data?.success) {
        toast.success(data?.message || 'Subject deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedSubject(null);
        fetchSubjects(currentPage);
      } else {
        toast.error(data?.message || 'Failed to delete subject');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete subject');
    }
  };

  // Handle Hard Delete Subject
  const handleHardDeleteSubject = async () => {
    if (!selectedSubject) return;
    
    if (!confirm('Are you sure you want to permanently delete this subject? This action cannot be undone.')) {
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await hardDeleteSubjectApiCall(token, selectedSubject.id);
      if (data?.success) {
        toast.success(data?.message || 'Subject permanently deleted');
        setIsDeleteModalOpen(false);
        setSelectedSubject(null);
        fetchSubjects(currentPage);
      } else {
        toast.error(data?.message || 'Failed to permanently delete subject');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to permanently delete subject');
    }
  };

  // Handle Status Toggle
  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await updateSubjectStatusApiCall(token, id, newStatus as 'active' | 'inactive');
      if (data?.success) {
        toast.success(data?.message || `Subject ${newStatus} successfully`);
        fetchSubjects(currentPage);
      } else {
        toast.error(data?.message || 'Failed to update status');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update status');
    }
  };

  const openEditModal = (subject: any) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      type: subject.type,
      maxMarks: subject.maxMarks,
      passMarks: subject.passMarks,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (subject: any) => {
    setSelectedSubject(subject);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'theory',
      maxMarks: 100,
      passMarks: 33,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-500">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  // Pagination
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Subjects" 
        description="Manage all subjects in the system"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Implement search if needed
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter('');
                  setTypeFilter('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Subjects
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({pagination.total} subjects)
            </span>
          </CardTitle>
          <CardDescription>
            View and manage all subjects in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
              <Button className="mt-4" onClick={() => fetchSubjects(currentPage)}>
                Try Again
              </Button>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <p>No subjects found</p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Subject
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Max Marks</TableHead>
                      <TableHead>Pass Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{subject.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-muted-foreground" />
                            {subject.code}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(subject.type)}</TableCell>
                        <TableCell>{subject.maxMarks}</TableCell>
                        <TableCell>{subject.passMarks}</TableCell>
                        <TableCell>{getStatusBadge(subject.status)}</TableCell>
                        <TableCell>{formatDate(subject.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(subject)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusToggle(subject.id, subject.status)}>
                                {subject.status === 'active' ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteModal(subject)}>
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                <span className="text-red-500">Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {subjects.length} of {pagination.total} subjects
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Add a new subject to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Name *</Label>
              <Input
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Code *</Label>
              <Input
                placeholder="e.g., MATH101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'theory' | 'practical') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value="active"
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Marks</Label>
                <Input
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pass Marks</Label>
                <Input
                  type="number"
                  value={formData.passMarks}
                  onChange={(e) => setFormData({ ...formData, passMarks: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubject} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Name *</Label>
              <Input
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Code *</Label>
              <Input
                placeholder="e.g., MATH101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'theory' | 'practical') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedSubject?.status || 'active'}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setSelectedSubject({ ...selectedSubject, status: value })
                  }
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Marks</Label>
                <Input
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pass Marks</Label>
                <Input
                  type="number"
                  value={formData.passMarks}
                  onChange={(e) => setFormData({ ...formData, passMarks: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedSubject(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Subject'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subject?
            </DialogDescription>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedSubject.name}</p>
                <p className="text-sm text-muted-foreground">Code: {selectedSubject.code}</p>
                <p className="text-sm text-muted-foreground">Type: {selectedSubject.type}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedSubject(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteSubject}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}