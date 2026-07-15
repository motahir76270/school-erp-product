// dashboard/admin/attendance/qr-scan/page.tsx
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
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  User,
  Calendar,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { markAttendanceViaQRApiCall } from '@/store/slices/attendanceSlice';
import { getAllClassWithSections } from '@/store/slices/classSlice';
import { getAllStudentsApiCall } from '@/store/slices/studentSlice';
import { format } from 'date-fns';
import { closeQrScanner, openQrScanner } from '@/src/hooks/qrScanner';


interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  sectionId: string | null;
  qrCode: string | null;
  email: string;
}

interface ScanResult {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: string;
  timestamp: string;
  email?: string;
}

interface QRData {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  admissionNumber: string;
  classId: string;
}

export default function QRScanAttendancePage() {
  const router = useRouter();
  const [qrInput, setQrInput] = useState('');
  const [scannedStudents, setScannedStudents] = useState<ScanResult[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
    return () => {
      // Cleanup scanner on unmount
      closeQrScanner();
    };
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const data = await getAllClassWithSections(token);
      if (data?.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const data = await getAllStudentsApiCall(token, 1, '', '', selectedClass, selectedSection);
      if (data?.success) {
        setStudents(data.data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to fetch students');
    }
  };

  // Start QR Scanner
  const startQRScanner = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    setCameraError(null);
    setIsScanning(true);
    setScannerReady(false);

    try {
      // Open scanner and wait for result
      const qrData = await openQrScanner('qr-reader-container');
      
      // Scanner opened successfully
      setScannerReady(true);
      toast.success('QR Scanner started successfully');
      
      // Process the scanned data
      await processQRCode(qrData);
    } catch (error: any) {
      console.error('Error starting QR scanner:', error);
      setCameraError(error?.message || 'Failed to start camera');
      toast.error(error?.message || 'Failed to start camera. Please use manual entry.');
      setIsScanning(false);
      setScannerReady(false);
    }
  };

  // Stop QR Scanner
  const stopQRScanner = async () => {
    try {
      await closeQrScanner();
      setIsScanning(false);
      setScannerReady(false);
      toast.info('QR scanner stopped');
    } catch (error) {
      console.error('Error stopping scanner:', error);
      toast.error('Failed to stop scanner');
    }
  };

  // Process QR code
  const processQRCode = async (decodedText: string) => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      // Parse QR data
      let qrData: QRData | null = null;
      
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(decodedText);
        if (parsed.id && parsed.name) {
          qrData = parsed;
        }
      } catch {
        // If not JSON, try to find student by QR code
        const student = students.find(s => s.qrCode === decodedText);
        if (student) {
          qrData = {
            id: student.id,
            name: student.name,
            email: student.email || '',
            rollNumber: student.rollNumber,
            admissionNumber: '',
            classId: student.classId,
          };
        } else {
          // Try to find student by ID
          const studentById = students.find(s => s.id === decodedText);
          if (studentById) {
            qrData = {
              id: studentById.id,
              name: studentById.name,
              email: studentById.email || '',
              rollNumber: studentById.rollNumber,
              admissionNumber: '',
              classId: studentById.classId,
            };
          }
        }
      }

      if (!qrData) {
        toast.error('Invalid QR code. Student not found.');
        return;
      }

      // Check if student is in selected class
      if (qrData.classId !== selectedClass) {
        toast.error(`Student "${qrData.name}" is not in the selected class`);
        return;
      }

      // Check if already scanned
      if (scannedStudents.some(s => s.studentId === qrData!.id)) {
        toast.info(`${qrData.name} already marked present`);
        return;
      }

      // Mark attendance
      const response = await markAttendanceViaQRApiCall(token, {
        studentId: qrData.id,
        date,
        classId: selectedClass,
        sectionId: selectedSection || undefined,
      });

      if (response?.success) {
        const result: ScanResult = {
          studentId: qrData.id,
          studentName: qrData.name,
          rollNumber: qrData.rollNumber,
          status: 'present',
          timestamp: new Date().toISOString(),
          email: qrData.email,
        };
        
        setScannedStudents(prev => [...prev, result]);
        setLastScannedId(qrData.id);
        toast.success(`✅ ${qrData.name} marked present`);
        
        // Clear last scanned after 3 seconds
        setTimeout(() => setLastScannedId(null), 3000);

        // After successful scan, reset scanner state to allow scanning again
        setScannerReady(false);
        setIsScanning(false);
        
        // Show option to scan next student
        toast.info('Ready to scan next student. Click "Start Scanner" again.');
      } else {
        toast.error(response?.message || 'Failed to mark attendance');
      }
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      toast.error(error?.message || 'Failed to process QR code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual QR input
  const handleManualQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      toast.error('Please enter QR code');
      return;
    }
    await processQRCode(qrInput.trim());
    setQrInput('');
  };

  const clearScannedStudents = () => {
    setScannedStudents([]);
  };

  const handleClassChange = async (value: string) => {
    // Stop scanner before changing class
    if (scannerReady || isScanning) {
      await stopQRScanner();
    }
    setSelectedClass(value);
    const classData = classes.find(c => c.id === value);
    setSections(classData?.sections || []);
    setSelectedSection('');
    clearScannedStudents();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'leave':
        return <Badge className="bg-blue-500">Leave</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="QR Scan Attendance" 
        description="Mark attendance quickly by scanning QR codes"
      />

      {/* Class Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={selectedClass}
                onValueChange={handleClassChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
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
              <Label>Section</Label>
              <Select
                value={selectedSection}
                onValueChange={(value) => {
                  setSelectedSection(value);
                  clearScannedStudents();
                }}
                disabled={!sections.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sections.length ? "Select section" : "No sections"} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex gap-2 w-full">
                {!scannerReady ? (
                  <Button 
                    className="w-full" 
                    onClick={startQRScanner}
                    disabled={!selectedClass || isScanning}
                  >
                    {isScanning ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    {isScanning ? 'Initializing...' : 'Start Scanner'}
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={stopQRScanner}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Scanner
              </span>
              {scannerReady && (
                <Badge className="bg-green-500 animate-pulse">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {scannerReady 
                ? "Point camera at QR code to mark attendance" 
                : "Start camera to scan QR codes"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedClass ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                Please select a class first
              </div>
            ) : !scannerReady && !isScanning ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click "Start Scanner" to begin scanning QR codes
                </p>
                <p className="text-xs text-muted-foreground">
                  Or use the manual entry below if camera is not available
                </p>
              </div>
            ) : (
              <div className="relative">
                <div 
                  id="qr-reader-container" 
                  style={{ width: '100%', minHeight: '300px' }}
                  className="rounded-lg overflow-hidden bg-black"
                />
                
                {isScanning && !scannerReady && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Initializing camera...</p>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                    <AlertCircle className="h-4 w-4 inline-block mr-2" />
                    {cameraError}
                  </div>
                )}

                {lastScannedId && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm animate-in slide-in-from-top duration-200">
                    ✅ Last scanned: {students.find(s => s.id === lastScannedId)?.name || 'Student'}
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or enter QR code manually
                </span>
              </div>
            </div>

            <form onSubmit={handleManualQRSubmit} className="flex gap-2">
              <Input
                placeholder="Enter QR code, student ID, or email..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting || !selectedClass}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scanned Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Scanned Today
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {scannedStudents.length} students
                </Badge>
                {scannedStudents.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearScannedStudents}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Students marked present via QR scan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scannedStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4" />
                No students scanned yet
                <p className="text-sm mt-2">
                  Scan QR codes or enter manually to mark attendance
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {scannedStudents.map((student, index) => (
                  <div
                    key={student.studentId + index}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 animate-in slide-in-from-right duration-200"
                  >
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        Roll No: {student.rollNumber}
                      </p>
                      {student.email && (
                        <p className="text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(student.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(student.timestamp), 'hh:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {scannedStudents.length > 0 && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    clearScannedStudents();
                    toast.info('List cleared');
                  }}
                >
                  Clear List
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push('/dashboard/admin/attendance')}
                >
                  Done
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}