// app/dashboard/classes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Trash2, RefreshCw, Plus, BookOpen, Layers, Users } from 'lucide-react';
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
  createClassApiCall,
  createSectionApiCall,
  deleteClassApiCall,
  deleteSectionApiCall,
  setClasses,
  setSections,
  setLoading,
  addClass,
  addSection,
  removeClassFromList,
  removeSectionFromList,
} from '@/store/slices/classSlice';
import { toast } from 'react-toastify';

interface Class {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
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

export default function ClassesPage() {
  const dispatch = useAppDispatch();
  const { classes, sections, loading } = useAppSelector((state) => state.class);
  
  // Search and filter states
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('classes');

  // Create class states
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({ name: '' });
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  // Create section states
  const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', capacity: '', classId: '' });
  const [isSubmittingSection, setIsSubmittingSection] = useState(false);

  const fetchClasses = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const data = await getAllClassesApiCall(token);
      console.log('Classes API Response:', data);
      
      if (data?.success === true) {
        const classesData = data.data?.classes || data.data || [];
        dispatch(setClasses(classesData));
      } else {
        toast.error(data?.message || 'Failed to fetch classes');
        dispatch(setClasses([]));
      }
    } catch (error: any) {
      console.error('Fetch classes error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch classes');
      dispatch(setClasses([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchSections = async (classId?: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    dispatch(setLoading(true));
    try {
      // Only send classId if it exists
      const data = await getAllSectionsApiCall(token, classId);
      console.log('Sections API Response:', data);
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

  // Initial load
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch sections when class filter changes in sections tab
  useEffect(() => {
    if (activeTab === 'sections') {
      fetchSections(selectedClassId);
    }
  }, [selectedClassId, activeTab]);

  // Filter classes by search
  const filteredClasses = classes.filter((cls: Class) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return cls.name.toLowerCase().includes(query);
  });

  // Filter sections by search
  const filteredSections = sections.filter((section: Section) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return section.name.toLowerCase().includes(query);
  });

  // Get class name by ID
  const getClassName = (classId: string) => {
    const cls = classes.find((c: Class) => c.id === classId);
    return cls?.name || 'Unknown Class';
  };

  // ==================== Class CRUD ====================

  const handleCreateClass = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingClass(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsSubmittingClass(false);
        return;
      }

      const data = await createClassApiCall(token, { name: classForm.name });

      if (data?.success === true) {
        toast.success(data?.message || 'Class created successfully');
        dispatch(addClass(data.data));
        setClassForm({ name: '' });
        setIsCreateClassModalOpen(false);
        await fetchClasses();
      } else {
        toast.error(data?.message || 'Failed to create class');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create class');
    } finally {
      setIsSubmittingClass(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      const data = await deleteClassApiCall(token, classId);
      if (data?.success === true) {
        toast.success(data?.message || 'Class deleted successfully');
        dispatch(removeClassFromList(classId));
        await fetchClasses();
        // Refresh sections if they were filtered by this class
        if (selectedClassId === classId) {
          setSelectedClassId('');
          await fetchSections();
        }
      } else {
        toast.error(data?.message || 'Failed to delete class');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete class');
    }
  };

  // ==================== Section CRUD ====================

  const handleCreateSection = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingSection(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsSubmittingSection(false);
        return;
      }

      if (!sectionForm.classId) {
        toast.error('Please select a class');
        setIsSubmittingSection(false);
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
        setIsCreateSectionModalOpen(false);
        await fetchSections(selectedClassId || undefined);
      } else {
        toast.error(data?.message || 'Failed to create section');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create section');
    } finally {
      setIsSubmittingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
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
        await fetchSections(selectedClassId || undefined);
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
        title="Classes & Sections" 
        description="Manage classes and their sections."
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Classes & Sections</CardTitle>
            <CardDescription>Manage classes and sections in the system</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (activeTab === 'classes') {
                  fetchClasses();
                } else {
                  fetchSections(selectedClassId || undefined);
                }
              }} 
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {activeTab === 'classes' ? (
              <Button size="sm" onClick={() => setIsCreateClassModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsCreateSectionModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Classes
                <Badge variant="secondary" className="ml-1">
                  {classes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="sections" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Sections
                <Badge variant="secondary" className="ml-1">
                  {sections.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Classes Tab */}
            <TabsContent value="classes">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search classes by name..."
                  className="pl-9"
                />
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Loading classes...
                        </TableCell>
                      </TableRow>
                    ) : filteredClasses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No classes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClasses.map((cls: Class) => (
                        <TableRow key={cls.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{cls.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(cls.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClass(cls.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections">
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
                  onValueChange={(value) => setSelectedClassId(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map((cls: any) => (
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
                    ) : filteredSections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No sections found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSections.map((section: Section) => (
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSection(section.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Class Modal */}
      <Dialog open={isCreateClassModalOpen} onOpenChange={setIsCreateClassModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Add a new class to the platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name <span className="text-destructive">*</span></Label>
              <Input
                id="className"
                value={classForm.name}
                onChange={(e) => setClassForm({ name: e.target.value })}
                placeholder="e.g., Class 10, Class 12, Grade 5"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateClassModalOpen(false);
                  setClassForm({ name: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmittingClass}>
                {isSubmittingClass ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Section Modal */}
      <Dialog open={isCreateSectionModalOpen} onOpenChange={setIsCreateSectionModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription>
              Add a new section to a class.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSection} className="space-y-4">
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
                  setIsCreateSectionModalOpen(false);
                  setSectionForm({ name: '', capacity: '', classId: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmittingSection}>
                {isSubmittingSection ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}