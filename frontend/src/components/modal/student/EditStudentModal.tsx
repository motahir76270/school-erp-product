// components/students/EditStudentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { updateStudentApiCall } from '@/store/slices/studentSlice';
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

interface Student {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  rollNumber: string;
  admissionNumber: string | null;
  classId: string;
  sectionId: string | null;
  dateOfBirth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  bloodGroup: string | null;
  religion: string | null;
  caste: string | null;
  nationality: string | null;
  aadharNumber: string | null;
  status: 'active' | 'inactive' | 'suspended';
  profileImage: string | null;
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classes: ClassData[];
  isLoadingClasses: boolean;
  baseUrl: string;
  onSuccess: () => void;
}

export default function EditStudentModal({
  isOpen,
  onClose,
  student,
  classes,
  isLoadingClasses,
  baseUrl,
  onSuccess,
}: any) {
  const [editForm, setEditForm] = useState({
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
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [availableSections, setAvailableSections] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (student) {
      setEditForm({
        name: student.name,
        phone: student.phone || '',
        address: student.address || '',
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber || '',
        classId: student.classId,
        sectionId: student.sectionId || '',
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender || '',
        bloodGroup: student.bloodGroup || '',
        religion: student.religion || '',
        caste: student.caste || '',
        nationality: student.nationality || '',
        aadharNumber: student.aadharNumber || '',
        status: student.status,
      });
      setCurrentAvatar(student.profileImage);
      
      const selectedClass = classes.find((c:any)=> c.id === student.classId);
      setAvailableSections(selectedClass?.sections || []);
    }
  }, [student, classes]);

  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find((c:any)=> c.id === classId);
    const sections = selectedClass?.sections || [];
    setAvailableSections(sections);
    setEditForm({ ...editForm, classId, sectionId: '' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!student) return;
    
    setIsEditSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsEditSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', editForm.name);
      if (editForm.phone) formData.append('phone', editForm.phone);
      if (editForm.address) formData.append('address', editForm.address);
      formData.append('rollNumber', editForm.rollNumber);
      if (editForm.admissionNumber) formData.append('admissionNumber', editForm.admissionNumber);
      formData.append('classId', editForm.classId);
      if (editForm.sectionId) formData.append('sectionId', editForm.sectionId);
      if (editForm.dateOfBirth) formData.append('dateOfBirth', editForm.dateOfBirth);
      if (editForm.gender) formData.append('gender', editForm.gender);
      if (editForm.bloodGroup) formData.append('bloodGroup', editForm.bloodGroup);
      if (editForm.religion) formData.append('religion', editForm.religion);
      if (editForm.caste) formData.append('caste', editForm.caste);
      if (editForm.nationality) formData.append('nationality', editForm.nationality);
      if (editForm.aadharNumber) formData.append('aadharNumber', editForm.aadharNumber);
      formData.append('status', editForm.status);
      if (editAvatarFile) formData.append('profileImage', editAvatarFile);

      const data = await updateStudentApiCall(token, student.id, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Student updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data?.message || 'Failed to update student');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update student');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleClose = () => {
    setEditAvatarFile(null);
    setCurrentAvatar(null);
    setAvailableSections([]);
    onClose();
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student information. Upload a new image to change the profile picture.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-rollNumber">Roll Number <span className="text-destructive">*</span></Label>
              <Input
                id="edit-rollNumber"
                value={editForm.rollNumber}
                onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-admissionNumber">Admission Number</Label>
              <Input
                id="edit-admissionNumber"
                value={editForm.admissionNumber}
                onChange={(e) => setEditForm({ ...editForm, admissionNumber: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-classId">Class <span className="text-destructive">*</span></Label>
              <Select
                value={editForm.classId}
                onValueChange={handleClassChange}
                required
              >
                <SelectTrigger disabled={isLoadingClasses}>
                  <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls:any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sectionId">Section</Label>
              <Select
                value={editForm.sectionId}
                onValueChange={(value) => setEditForm({ ...editForm, sectionId: value })}
                disabled={!editForm.classId || availableSections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !editForm.classId ? "Select class first" : 
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
              <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
              <Input
                id="edit-dateOfBirth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <Select
                value={editForm.gender}
                onValueChange={(value: 'male' | 'female' | 'other') =>
                  setEditForm({ ...editForm, gender: value })
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
              <Label htmlFor="edit-bloodGroup">Blood Group</Label>
              <Input
                id="edit-bloodGroup"
                value={editForm.bloodGroup}
                onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-religion">Religion</Label>
              <Input
                id="edit-religion"
                value={editForm.religion}
                onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-caste">Caste</Label>
              <Input
                id="edit-caste"
                value={editForm.caste}
                onChange={(e) => setEditForm({ ...editForm, caste: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nationality">Nationality</Label>
              <Input
                id="edit-nationality"
                value={editForm.nationality}
                onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-aadharNumber">Aadhar Number</Label>
              <Input
                id="edit-aadharNumber"
                value={editForm.aadharNumber}
                onChange={(e) => setEditForm({ ...editForm, aadharNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: 'active' | 'inactive' | 'suspended') =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-avatar">Profile image</Label>
            <Input
              id="edit-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)}
            />
            {currentAvatar && !editAvatarFile && (
              <div className="flex items-center gap-2">
                <Image
                  src={`${baseUrl}/${currentAvatar}`}
                  alt="Current profile"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <p className="text-sm text-muted-foreground">
                  Current: {currentAvatar.split('/').pop()}
                </p>
              </div>
            )}
            {editAvatarFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {editAvatarFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isEditSubmitting}>
              {isEditSubmitting ? 'Updating...' : 'Update Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}