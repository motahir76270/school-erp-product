'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Download, 
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  QrCode,
  Loader2,
  Home,
  Users
} from 'lucide-react';
import { AppDispatch, RootState } from '@/store';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  clearCurrentStudent, 
  deleteStudent, 
  fetchStudent, 
  generateStudentQR,
  clearError 
} from '@/src/store/slices/studentSlice';
import { toast } from 'react-toastify';

export default function ViewStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = Number(params.id);
  const dispatch = useDispatch<AppDispatch>();
  const { currentStudent, isLoading, error } = useSelector((state: RootState) => state.student);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (studentId) {
      dispatch(fetchStudent(studentId));
    }

    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [studentId, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    const result = await dispatch(deleteStudent(studentId));
    if (deleteStudent.fulfilled.match(result)) {
      toast.success('Student deleted successfully');
      router.push('/dashboard/admin/students');
    }
    setDeleting(false);
  };

  const handleRegenerateQR = async () => {
    setQrLoading(true);
    const result = await dispatch(generateStudentQR(studentId));
    if (generateStudentQR.fulfilled.match(result)) {
      toast.success('QR code regenerated successfully');
      // Refetch student to get updated QR code
      await dispatch(fetchStudent(studentId));
      setShowQRDialog(true);
    }
    setQrLoading(false);
  };

  const downloadQR = () => {
    if (currentStudent?.qrCodeImage) {
      const link = document.createElement('a');
      link.href = currentStudent.qrCodeImage;
      link.download = `QR-${currentStudent.user?.firstName}-${currentStudent.user?.lastName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Student Not Found</h2>
        <p className="text-muted-foreground mt-2">The student you're looking for doesn't exist.</p>
        <Link href="/dashboard/admin/students">
          <Button className="mt-4">Back to Students</Button>
        </Link>
      </div>
    );
  }

  const fullName = `${currentStudent.user?.firstName || ''} ${currentStudent.user?.lastName || ''}`.trim();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Profile" 
        description={`Viewing ${fullName}'s details and QR code`}
      />

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        {/* Left Column - Profile & QR */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="h-32 w-32 rounded-full bg-muted overflow-hidden">
                    {currentStudent.user?.profileImage ? (
                      <Image 
                        src={currentStudent.user.profileImage} 
                        alt={fullName} 
                        width={128} 
                        height={128} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-muted-foreground m-8" />
                    )}
                  </div>
                  <Badge 
                    variant={currentStudent.isActive ? 'default' : 'secondary'}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                  >
                    {currentStudent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold mt-4">{fullName}</h2>
                <p className="text-muted-foreground">{currentStudent.user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Student</Badge>
                  <Badge variant="outline" className="capitalize">{currentStudent.gender}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
              <CardDescription>
                Unique identifier for this student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div 
                  className="w-48 h-48 border rounded-lg p-2 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setShowQRDialog(true)}
                >
                  {currentStudent.qrCodeImage ? (
                    <Image 
                      src={currentStudent.qrCodeImage} 
                      alt="QR Code" 
                      width={200} 
                      height={200} 
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <QrCode className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-sm text-center">
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                    {currentStudent.qrCode || 'No QR code generated'}
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRegenerateQR}
                    disabled={qrLoading}
                    className="flex-1"
                  >
                    {qrLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={downloadQR}
                    className="flex-1"
                    disabled={!currentStudent.qrCodeImage}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{currentStudent.user?.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{currentStudent.user?.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{currentStudent.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {currentStudent.dateOfBirth ? new Date(currentStudent.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Group</p>
                <Badge variant="outline">{currentStudent.bloodGroup || 'N/A'}</Badge>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">{currentStudent.emergencyContact || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{currentStudent.rollNumber || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admission Number</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{currentStudent.admissionNumber || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{currentStudent.class?.name || `Class ${currentStudent.classId}` || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Section</p>
                <p className="font-medium">{currentStudent.section?.name || `Section ${currentStudent.sectionId}` || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Admission Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {currentStudent.admissionDate ? new Date(currentStudent.admissionDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          {currentStudent.parent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Parent Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Father's Name</p>
                  <p className="font-medium">{currentStudent.parent.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Father's Phone</p>
                  <p className="font-medium">{currentStudent.parent.fatherPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mother's Name</p>
                  <p className="font-medium">{currentStudent.parent.motherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mother's Phone</p>
                  <p className="font-medium">{currentStudent.parent.motherPhone || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Student
                </Button>
                <Link href={`/dashboard/admin/students/edit/${studentId}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
            <DialogDescription>
              {fullName} - {currentStudent.rollNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {currentStudent.qrCodeImage ? (
              <>
                <Image 
                  src={currentStudent.qrCodeImage} 
                  alt="QR Code" 
                  width={250} 
                  height={250} 
                  className="border rounded-lg p-4"
                />
                <div className="text-sm text-muted-foreground space-y-1 text-center">
                  <p>Roll Number: <span className="font-medium">{currentStudent.rollNumber}</span></p>
                  <p>Admission: <span className="font-medium">{currentStudent.admissionNumber}</span></p>
                  <p>Student ID: <span className="font-medium">#{currentStudent.id}</span></p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={downloadQR}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQRDialog(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">No QR code available</p>
                <Button 
                  onClick={handleRegenerateQR}
                  disabled={qrLoading}
                  className="mt-4"
                >
                  {qrLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}