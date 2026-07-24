// components/students/ViewStudentModal.tsx
'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, QrCode } from 'lucide-react';



export default function ViewStudentModal({
  isOpen,
  onClose,
  student,
  baseUrl,
  getClassName,
  getSectionName,
  getStatusBadgeVariant,
  onViewQR,
}: any) {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Complete information about the student.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted overflow-hidden">
              {student.profileImage ? (
                <Image
                  src={`${baseUrl}/${student.profileImage}`}
                  alt={student.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{student.name}</h3>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <Badge variant={getStatusBadgeVariant(student.status)}>
                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-medium">{student.rollNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admission Number</p>
              <p className="font-medium">{student.admissionNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{student.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium">{student.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{student.dateOfBirth || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blood Group</p>
              <p className="font-medium">{student.bloodGroup || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="font-medium">{getClassName(student.classId)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Section</p>
              <p className="font-medium">{getSectionName(student.sectionId)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{student.address || 'N/A'}</p>
            </div>
            {student.qrCode && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">QR Code</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-1"
                  onClick={() => onViewQR(student)}
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