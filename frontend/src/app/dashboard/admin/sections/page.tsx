// app/dashboard/sections/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, RefreshCw, MoreVertical, Plus, Layers, Users, ArrowLeft } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllClassesApiCall,
  getAllSectionsApiCall,
  createSectionApiCall,
  deleteSectionApiCall,
  setSections,
  setLoading,
  addSection,
  removeSectionFromList,
  setClasses,
} from '@/store/slices/classSlice';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  classId: string;
  capacity?: string | null;
  currentStrength?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function SectionsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { sections, classes, loading } = useAppSelector((state) => state.class);
  
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Create section states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', capacity: '', classId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClasses = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const data = await getAllClassesApiCall(token);
      if (data?.success === true) {
        const classesData = data.data?.classes || data.data || [];
        dispatch(setClasses(classesData));
      }
    } catch (error) {
      console.error('Fetch classes error:', error);
    }
  };

  const fetchSections = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const data = await getAllSectionsApiCall(token);
      console.log('API Response:', data);
      
      if (data?.success === true) {
        const sectionsData = data.data || [];
        dispatch(setSections(sectionsData));
      } else {
        toast.error(data?.message || 'Failed to fetch sections');
        dispatch(setSections([]));
      }
    } catch (error: any) {
      console.error('Fetch sections error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch sections');
      dispatch(setSections([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, []);

  // Filter sections
  const filteredSections = sections.filter((section: Section) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    
    const searchString = [
      section.name,
      section.classId,
    ].join(' ').toLowerCase();
    
    return searchString.includes(query);
  });

  // Filter by class
  const filteredByClass = selectedClassId 
    ? filteredSections.filter((s: Section) => s.classId === selectedClassId)
    : filteredSections;

  // Get class name by ID
  const getClassName = (classId: string) => {
    const cls = classes.find((c: Class) => c.id === classId);
    return cls?.name || 'Unknown Class';
  };

  // Create Section
  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsSubmitting(false);
        return;
      }

      if (!sectionForm.classId) {
        toast.error('Please select a class');
        setIsSubmitting(false);
        return;
      }

      const data = await createSectionApiCall(token, {
        name: sectionForm.name,
        classId: sectionForm.classId,
        capacity: sectionForm.capacity || undefined,
      });

      if (data?.success === true) {
        toast.success(data?.message || 'Section created successfully');
        dispatch(addSection(data.data));
        setSectionForm({ name: '', capacity: '', classId: '' });
        setIsCreateModalOpen(false);
        await fetchSections();
      } else {
        toast.error(data?.message || 'Failed to create section');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create section');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Section
  const handleDelete = async (sectionId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      const data = await deleteSectionApiCall(token, sectionId);
      if (data?.success === true) {
        toast.success(data?.message || 'Section deleted successfully');
        dispatch(removeSectionFromList(sectionId));
        await fetchSections();
      } else {
        toast.error(data?.message || 'Failed to delete section');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete section');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sections" 
        description="Manage sections for all classes."
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Sections</CardTitle>
            <CardDescription>Manage all sections in the system</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchSections} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sections by name..."
                className="pl-9"
              />
            </div>
            <Select
              value={selectedClassId}
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((cls: Class) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Current Strength</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading sections...
                    </TableCell>
                  </TableRow>
                ) : filteredByClass.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sections found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredByClass.map((section: Section) => (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Layers className="h-5 w-5 text-muted-foreground" />
                          {section.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getClassName(section.classId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{section.capacity || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {section.currentStrength || '0'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(section.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDelete(section.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Section
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredByClass.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Total: {filteredByClass.length} sections
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/classes')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Manage Classes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Section Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription>
              Add a new section to a class.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sectionClass">Class <span className="text-destructive">*</span></Label>
              <Select
                value={sectionForm.classId}
                onValueChange={(value) => setSectionForm({ ...sectionForm, classId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: Class) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionName">Section Name <span className="text-destructive">*</span></Label>
              <Input
                id="sectionName"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                placeholder="e.g., A, B, Science, Arts"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionCapacity">Capacity</Label>
              <Input
                id="sectionCapacity"
                type="number"
                value={sectionForm.capacity}
                onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                placeholder="Max students (optional)"
                min="1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSectionForm({ name: '', capacity: '', classId: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}