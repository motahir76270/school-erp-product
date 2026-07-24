// components/students/CreateStudentModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { createStudentApiCall } from '@/store/slices/studentSlice';
import { toast } from 'react-toastify';

interface ClassData {
  id: string;
  name: string;
  userId: string;
  sections: Array<{
    id: string;
    name: string;
    classId: string;
    userId: string;
    capacity: number;
  }>;
}

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassData[];
  isLoadingClasses: boolean;
  onSuccess: () => void;
}

export default function CreateStudentModal({
  isOpen,
  onClose,
  classes,
  isLoadingClasses,
  onSuccess,
}: CreateStudentModalProps) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    rollNumber: '',
    admissionNumber: '',
    classId: '',
    sectionId: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    bloodGroup: '',
    religion: '',
    caste: '',
    nationality: '',
    aadharNumber: '',
    admissionDate: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSections, setAvailableSections] = useState<Array<{id: string, name: string}>>([]);

  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find(c => c.id === classId);
    const sections = selectedClass?.sections || [];
    setAvailableSections(sections);
    setForm({ ...form, classId, sectionId: '' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('email', form.email);
      if (form.password) formData.append('password', form.password);
      formData.append('name', form.name);
      if (form.phone) formData.append('phone', form.phone);
      if (form.address) formData.append('address', form.address);
      formData.append('rollNumber', form.rollNumber);
      if (form.admissionNumber) formData.append('admissionNumber', form.admissionNumber);
      formData.append('classId', form.classId);
      if (form.sectionId) formData.append('sectionId', form.sectionId);
      if (form.dateOfBirth) formData.append('dateOfBirth', form.dateOfBirth);
      if (form.gender) formData.append('gender', form.gender);
      if (form.bloodGroup) formData.append('bloodGroup', form.bloodGroup);
      if (form.religion) formData.append('religion', form.religion);
      if (form.caste) formData.append('caste', form.caste);
      if (form.nationality) formData.append('nationality', form.nationality);
      if (form.aadharNumber) formData.append('aadharNumber', form.aadharNumber);
      formData.append('admissionDate', form.admissionDate);
      if (avatarFile) formData.append('profileImage', avatarFile);

      const data = await createStudentApiCall(token, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Student created successfully');
        setForm({
          email: '',
          password: '',
          name: '',
          phone: '',
          address: '',
          rollNumber: '',
          admissionNumber: '',
          classId: '',
          sectionId: '',
          dateOfBirth: '',
          gender: '',
          bloodGroup: '',
          religion: '',
          caste: '',
          nationality: '',
          aadharNumber: '',
          admissionDate: '',
        });
        setAvatarFile(null);
        setAvailableSections([]);
        onSuccess();
        onClose();
      } else {
        toast.error(data?.message || 'Failed to create student');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
      name: '',
      phone: '',
      address: '',
      rollNumber: '',
      admissionNumber: '',
      classId: '',
      sectionId: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      religion: '',
      caste: '',
      nationality: '',
      aadharNumber: '',
      admissionDate: '',
    });
    setAvatarFile(null);
    setAvailableSections([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetForm}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Student</DialogTitle>
          <DialogDescription>
            Add a new student to the platform. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Leave empty for default (123456)"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number <span className="text-destructive">*</span></Label>
              <Input
                id="rollNumber"
                value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission Number</Label>
              <Input
                id="admissionNumber"
                value={form.admissionNumber}
                onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="classId">Class <span className="text-destructive">*</span></Label>
              <Select
                value={form.classId}
                onValueChange={handleClassChange}
                required
              >
                <SelectTrigger disabled={isLoadingClasses}>
                  <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
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
              <Label htmlFor="sectionId">Section</Label>
              <Select
                value={form.sectionId}
                onValueChange={(value) => setForm({ ...form, sectionId: value })}
                disabled={!form.classId || availableSections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !form.classId ? "Select class first" : 
                    availableSections.length === 0 ? "No sections available" : 
                    "Select section"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(value: 'male' | 'female' | 'other') =>
                  setForm({ ...form, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Input
                id="bloodGroup"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="religion">Religion</Label>
              <Input
                id="religion"
                value={form.religion}
                onChange={(e) => setForm({ ...form, religion: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="caste">Caste</Label>
              <Input
                id="caste"
                value={form.caste}
                onChange={(e) => setForm({ ...form, caste: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="aadharNumber">Aadhar Number</Label>
              <Input
                id="aadharNumber"
                value={form.aadharNumber}
                onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admissionDate">Admission Date <span className="text-destructive">*</span></Label>
              <Input
                id="admissionDate"
                type="date"
                value={form.admissionDate}
                onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile image</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
            {avatarFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {avatarFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}