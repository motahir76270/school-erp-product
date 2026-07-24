// app/components/modals/create-teacher-modal.tsx
'use client';

import React, { useState } from 'react';
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
import { createTeacherApiCall } from '@/store/slices/teacherSlice';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTeacherModal({ isOpen, onClose, onSuccess }: CreateTeacherModalProps) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    employeeId: '',
    qualification: '',
    experience: '',
    specialization: '',
    joiningDate: '',
    salary: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (form.username) formData.append('username', form.username);
      formData.append('employeeId', form.employeeId);
      if (form.qualification) formData.append('qualification', form.qualification);
      if (form.experience) formData.append('experience', form.experience);
      if (form.specialization) formData.append('specialization', form.specialization);
      formData.append('joiningDate', form.joiningDate);
      if (form.salary) formData.append('salary', form.salary);
      if (avatarFile) formData.append('profileImage', avatarFile);

      const data = await createTeacherApiCall(token, formData);

      if (data?.success === true) {
        toast.success(data?.message || 'Teacher created successfully');
        if (data?.data?.defaultUsername) {
          toast.info(`Username: ${data.data.defaultUsername}`);
        }
        if (data?.data?.defaultPassword) {
          toast.info(`Default Password: ${data.data.defaultPassword}`);
        }
        resetForm();
        onSuccess();
        onClose();
      } else {
        toast.error(data?.message || 'Failed to create teacher');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
      name: '',
      username: '',
      employeeId: '',
      qualification: '',
      experience: '',
      specialization: '',
      joiningDate: '',
      salary: '',
    });
    setAvatarFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Teacher</DialogTitle>
          <DialogDescription>
            Add a new teacher to the platform. All fields marked with * are required.
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Auto-generated if left empty"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID <span className="text-destructive">*</span></Label>
              <Input
                id="employeeId"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date <span className="text-destructive">*</span></Label>
              <Input
                id="joiningDate"
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience (years)</Label>
              <Input
                id="experience"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </div>
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
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Teacher'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}