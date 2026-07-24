// app/components/modals/view-teacher-modal.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, QrCode } from 'lucide-react';
import Image from 'next/image';

interface Teacher {
  id: string;
  name: string;
  email: string;
  username: string;
  employeeId: string;
  qualification: string | null;
  experience: string | null;
  specialization: string | null;
  salary: string | null;
  joiningDate: string;
  profileImage: string | null;
  qrCode: string | null;
  isActive: boolean;
}

interface ViewTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  baseUrl: string;
  onViewQR: (teacher: Teacher) => void;
}

export function ViewTeacherModal({ isOpen, onClose, teacher, baseUrl, onViewQR }: any) {
  if (!teacher) return null;

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Teacher Details</DialogTitle>
          <DialogDescription>
            Complete information about the teacher.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted overflow-hidden">
              {teacher.profileImage ? (
                <Image
                  src={`${baseUrl}/${teacher.profileImage}`}
                  alt={teacher.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{teacher.name}</h3>
              <p className="text-sm text-muted-foreground">{teacher.email}</p>
              <Badge variant={getStatusBadgeVariant(teacher.isActive)}>
                {teacher.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Employee ID</p>
              <p className="font-medium">{teacher.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">{teacher.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Qualification</p>
              <p className="font-medium">{teacher.qualification || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience</p>
              <p className="font-medium">{teacher.experience || 'N/A'} years</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Specialization</p>
              <p className="font-medium">{teacher.specialization || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salary</p>
              <p className="font-medium">{teacher.salary || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joining Date</p>
              <p className="font-medium">{new Date(teacher.joiningDate).toLocaleDateString()}</p>
            </div>
            {teacher.qrCode && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">QR Code</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-1"
                  onClick={() => onViewQR(teacher)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  View QR Code
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}