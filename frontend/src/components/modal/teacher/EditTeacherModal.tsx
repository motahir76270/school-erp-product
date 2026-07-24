// app/components/modals/edit-teacher-modal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { updateTeacherApiCall } from '@/store/slices/teacherSlice';
import Image from 'next/image';

interface Teacher {
  id: string;
  name: string;
  username: string;
  qualification: string | null;
  experience: string | null;
  specialization: string | null;
  salary: string | null;
  profileImage: string | null;
}

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: Teacher | null;
  baseUrl: string;
}

export function EditTeacherModal({ isOpen, onClose, onSuccess, teacher, baseUrl }: any) {
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    qualification: '',
    experience: '',
    specialization: '',
    salary: '',
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacher) {
      setEditForm({
        name: teacher.name || '',
        username: teacher.username || '',
        qualification: teacher.qualification || '',
        experience: teacher.experience || '',
        specialization: teacher.specialization || '',
        salary: teacher.salary || '',
      });
      setCurrentAvatar(teacher.profileImage);
      setEditAvatarFile(null);
    }
  }, [teacher]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacher) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', editForm.name);
      if (editForm.username) formData.append('username', editForm.username);
      if (editForm.qualification) formData.append('qualification', editForm.qualification);
      if (editForm.experience) formData.append('experience', editForm.experience);
      if (editForm.specialization) formData.append('specialization', editForm.specialization);
      if (editForm.salary) formData.append('salary', editForm.salary);
      if (editAvatarFile) formData.append('profileImage', editAvatarFile);

      const data = await updateTeacherApiCall(token, teacher.id, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Teacher updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data?.message || 'Failed to update teacher');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>
            Update teacher information. Upload a new image to change the profile picture.
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
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-qualification">Qualification</Label>
              <Input
                id="edit-qualification"
                value={editForm.qualification}
                onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Experience (years)</Label>
              <Input
                id="edit-experience"
                value={editForm.experience}
                onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Specialization</Label>
              <Input
                id="edit-specialization"
                value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-salary">Salary</Label>
              <Input
                id="edit-salary"
                value={editForm.salary}
                onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
              />
            </div>
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
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Teacher'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}