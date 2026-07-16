// dashboard/admin/attendance/qr-scan/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
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
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { markAttendanceViaQRApiCall } from '@/store/slices/attendanceSlice';
import { getAllClassWithSections } from '@/store/slices/classSlice';
import { getAllStudentsApiCall } from '@/store/slices/studentSlice';
import { format } from 'date-fns';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  // Initialize scanner when component mounts or scannerKey changes
  useEffect(() => {
    if (!selectedClass) return;

    // Clean up previous scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }

    // Create new scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0],
      },
      false
    );

    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
      console.log("QR Code:", decodedText);
      
      // Process the QR code
      handleQRScan(decodedText);
      
      // Stop scanner after successful scan
      scanner.clear().catch((error) => {
        console.error("Failed to clear scanner", error);
      });
      scannerRef.current = null;
      setScannerReady(false);
    };

    const onScanFailure = (error: any) => {
      // Ignore scan errors
      console.warn(error);
    };

    scanner.render(onScanSuccess, onScanFailure);
    setScannerReady(true);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
        setScannerReady(false);
      }
    };
  }, [selectedClass, scannerKey]);

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

  // Handle QR scan
  const handleQRScan = async (decodedText: string) => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      resetScanner();
      return;
    }

    if (isProcessing) {
      toast.info('Processing...');
      return;
    }

    setIsProcessing(true);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        resetScanner();
        return;
      }

      // Parse QR data
      let qrData: QRData | null = null;
      
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.id && parsed.name) {
          qrData = parsed;
        }
      } catch {
        // If not JSON, try to find student by QR code, ID, or roll number
        const student = students.find(s => 
          s.qrCode === decodedText || 
          s.id === decodedText || 
          s.rollNumber === decodedText
        );
        if (student) {
          qrData = {
            id: student.id,
            name: student.name,
            email: student.email || '',
            rollNumber: student.rollNumber,
            admissionNumber: '',
            classId: student.classId,
          };
        }
      }

      if (!qrData) {
        toast.error('Invalid QR code. Student not found.');
        resetScanner();
        return;
      }

      if (qrData.classId !== selectedClass) {
        toast.error(`Student "${qrData.name}" is not in the selected class`);
        resetScanner();
        return;
      }

      if (scannedStudents.some(s => s.studentId === qrData!.id)) {
        toast.info(`${qrData.name} already marked present`);
        resetScanner();
        return;
      }

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
        toast.success(`✅ ${qrData.name} marked present`);
        
        // Reset scanner to scan next student
        setTimeout(() => {
          resetScanner();
          toast.info('Ready to scan next student');
        }, 1500);
      } else {
        toast.error(response?.message || 'Failed to mark attendance');
        resetScanner();
      }
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      toast.error(error?.message || 'Failed to process QR code');
      resetScanner();
    } finally {
      setIsSubmitting(false);
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScannerKey(prev => prev + 1);
  };

  // Handle manual QR input
  const handleManualQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      toast.error('Please enter QR code');
      return;
    }
    await handleQRScan(qrInput.trim());
    setQrInput('');
  };

  const clearScannedStudents = () => {
    setScannedStudents([]);
  };

  const handleClassChange = async (value: string) => {
    setSelectedClass(value);
    const classData = classes.find(c => c.id === value);
    setSections(classData?.sections || []);
    setSelectedSection('');
    clearScannedStudents();
    // Reset scanner when class changes
    setScannerKey(prev => prev + 1);
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
          <div className="grid gap-4 md:grid-cols-3">
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
                  setScannerKey(prev => prev + 1);
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
              {isProcessing && (
                <Badge className="bg-yellow-500 animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {scannerReady 
                ? "Point camera at QR code to mark attendance" 
                : isProcessing ? "Processing last scan..." : "Scanner ready"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedClass ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm">Please select a class first</p>
                <p className="text-xs mt-2">QR scanner will start after class selection</p>
              </div>
            ) : (
              <div className="relative">
                <div id="reader" style={{ width: '100%', minHeight: '300px' }} />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Processing...</p>
                    </div>
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