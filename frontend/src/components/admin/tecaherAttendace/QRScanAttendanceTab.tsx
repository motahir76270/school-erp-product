// app/dashboard/attendance/teacher-attendance/components/QRScanAttendanceTab.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  QrCode,
  CheckCircle,
  RefreshCw,
  User,
  Loader2,
  UserCheck,
  X,
  Clock,
  Check
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Image from 'next/image';

interface QRScanAttendanceTabProps {
  teachers: any[];
  loading: boolean;
  onQRSubmit: (data: any) => Promise<any>;
}

interface ScannedTeacher {
  teacherId: string;
  teacherName: string;
  employeeId: string;
  status: string;
  timestamp: string;
  profileImage?: string;
}

export const QRScanAttendanceTab = ({
  teachers,
  loading,
  onQRSubmit
}: QRScanAttendanceTabProps) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [scannedTeacher, setScannedTeacher] = useState<ScannedTeacher | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<any>(null);

  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;

  // Initialize scanner
  useEffect(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }

    const scanner = new Html5QrcodeScanner(
      "teacher-reader",
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
      console.log("QR Code Scanned:", decodedText);
      handleQRScan(decodedText);
      
      scanner.clear().catch((error) => {
        console.error("Failed to clear scanner", error);
      });
      scannerRef.current = null;
      setScannerReady(false);
    };

    const onScanFailure = (error: any) => {};

    scanner.render(onScanSuccess, onScanFailure);
    setScannerReady(true);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
        setScannerReady(false);
      }
    };
  }, [scannerKey]);

  const handleQRScan = async (decodedText: string) => {
    if (isProcessing) {
      toast.info('Processing...');
      return;
    }

    setIsProcessing(true);

    try {
      let qrData: any = null;
      
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.id && parsed.name) {
          qrData = parsed;
        }
      } catch {
        const teacher = teachers.find((t: any) => 
          t.qrCode === decodedText || 
          t.id === decodedText || 
          t.employeeId === decodedText
        );
        if (teacher) {
          qrData = {
            id: teacher.id,
            name: teacher.name,
            employeeId: teacher.employeeId,
            profileImage: teacher.profileImage,
          };
        }
      }

      if (!qrData) {
        toast.error('Invalid QR code. Teacher not found.');
        resetScanner();
        return;
      }

      const response = await onQRSubmit({
        teacherId: qrData.id,
        date: date,
      });

      console.log('Response:', response);

      if (response?.success) {
        // Get teacher data from response
        const teacherData = response.data?.teacher || qrData;
        
        const result: ScannedTeacher = {
          teacherId: teacherData.id || teacherData.teacherId,
          teacherName: teacherData.name || teacherData.teacherName || 'N/A',
          employeeId: teacherData.employeeId || 'N/A',
          status: 'present',
          timestamp: new Date().toISOString(),
          profileImage: teacherData.profileImage,
        };
        
        setScannedTeacher(result);
        toast.success(`✅ ${result.teacherName} marked present`);
        
        setTimeout(() => {
          resetScanner();
          toast.info('Ready to scan next teacher');
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
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScannerKey(prev => prev + 1);
  };

  const handleManualQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      toast.error('Please enter QR code');
      return;
    }
    await handleQRScan(qrInput.trim());
    setQrInput('');
  };

  const clearScannedTeacher = () => {
    setScannedTeacher(null);
  };

  const getProfileImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${baseURl}/${imagePath}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Date and Scanner Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-[200px]">
            <Label htmlFor="qr-date" className="text-sm font-medium">Select Date</Label>
            <Input
              id="qr-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            {scannerReady && (
              <Badge className="bg-green-500 animate-pulse px-3 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Scanner Active
              </Badge>
            )}
            {isProcessing && (
              <Badge className="bg-yellow-500 animate-pulse px-3 py-1">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processing
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetScanner}
              disabled={isProcessing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
              Restart Scanner
            </Button>
          </div>
        </div>
        {scannedTeacher && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearScannedTeacher}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* QR Scanner and Teacher Profile Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Scanner Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" />
              QR Scanner
            </CardTitle>
            <CardDescription>
              {scannerReady 
                ? "Position the QR code within the frame" 
                : isProcessing ? "Processing scan..." : "Scanner ready"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-muted/20">
              <div id="teacher-reader" style={{ width: '100%', minHeight: '280px' }} />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium">Processing...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  Or enter manually
                </span>
              </div>
            </div>

            <form onSubmit={handleManualQRSubmit} className="flex gap-2">
              <Input
                placeholder="Enter QR code, teacher ID, or employee ID..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="flex-1"
                disabled={isProcessing}
              />
              <Button type="submit" disabled={isProcessing} className="gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Submit
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              <p>Supported formats: QR Code, Teacher ID, Employee ID</p>
              <p className="mt-1">Total teachers available: {teachers.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Scanned Teacher Profile Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
              Teacher Profile
            </CardTitle>
            <CardDescription>
              {scannedTeacher ? 'Attendance marked successfully' : 'Waiting for scan'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!scannedTeacher ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/5 animate-pulse" />
                  </div>
                  <QrCode className="h-16 w-16 text-muted-foreground/30 relative" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No Teacher Scanned</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                  Scan a QR code or enter teacher credentials
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center min-h-full">
                {/* Profile Image - Large Circle */}
                <div className="relative">
                  {scannedTeacher.profileImage ? (
                    <div className="relative h-[200px] w-[200px] rounded-full overflow-hidden border-4 border-green-300 shadow-lg lg:w-42 lg-h-52">
                      <Image
                        src={getProfileImageUrl(scannedTeacher.profileImage) || ''}
                        alt={scannedTeacher.teacherName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg">
                      <User className="h-16 w-16" />
                    </div>
                  )}
                  
                  {/* Status Badge on Profile */}
                  <div className="absolute -bottom-1 -right-1">
                    <Badge className="bg-green-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Present
                    </Badge>
                  </div>
                </div>

                {/* Teacher Name */}
                <h3 className="mt-4 text-2xl font-bold text-gray-900">
                  {scannedTeacher.teacherName}
                </h3>
                
                {/* Employee ID */}
                <p className="text-sm text-muted-foreground mt-1">
                  Employee ID: {scannedTeacher.employeeId}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Marked at {format(new Date(scannedTeacher.timestamp), 'hh:mm a')}</span>
                </div>

                {/* Success Message */}
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Attendance marked successfully
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 w-full mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      clearScannedTeacher();
                      resetScanner();
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Scan New
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};