// app/components/modals/face-scan-modal.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Camera,
  ScanFace,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Clock,
  User,
  Mail,
  Award
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as faceapi from 'face-api.js';
import { addFaceTeacherApiCall } from '@/src/store/slices/teacherSlice';

interface FaceScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string;
  teacherName?: string;
  onSuccess?: (data: any) => void;
}

export function FaceScanModal({ isOpen, onClose, teacherId, teacherName, onSuccess }: any) {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>('');
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<any>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_FILE;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          streamRef.current = currentStream;
          setIsScanning(true);
          setDetectionStatus('Scanning for face...');
          setTimeout(() => {
            faceMyDetect();
          }, 1000);
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        toast.error('Failed to access camera. Please grant camera permissions.');
        setIsScanning(false);
      });
  };

  const loadModels = async () => {
    setIsLoadingModels(true);
    setModelLoadError(null);
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);

      setIsModelsLoaded(true);
      toast.success('Face detection models loaded successfully');
    } catch (error: any) {
      console.error('Model load error:', error);
      setModelLoadError('Failed to load models. Please ensure model files are in /public/models directory.');
      toast.error('Failed to load face detection models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const faceMyDetect = () => {
    if (!videoRef.current || !isModelsLoaded) return;

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(async () => {
      try {
        if (!videoRef.current) return;

        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
          })
        ).withFaceLandmarks().withFaceDescriptors();

        if (canvasRef.current && videoRef.current) {
          canvasRef.current.innerHTML = '';
          const canvas = faceapi.createCanvasFromMedia(videoRef.current);
          canvasRef.current.appendChild(canvas);

          const displaySize = {
            width: videoRef.current.videoWidth || 640,
            height: videoRef.current.videoHeight || 480
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);

          const resized = faceapi.resizeResults(detections, displaySize);

          faceapi.draw.drawDetections(canvasRef.current, resized);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);

          if (detections.length > 0) {
            setFaceDetected(true);
            setDetectionStatus('Face detected! Ready to mark attendance.');
            const descriptor = Array.from(detections[0].descriptor);
            setFaceDescriptor(descriptor);
          } else {
            setFaceDetected(false);
            setFaceDescriptor(null);
            setDetectionStatus('No face detected. Please position your face clearly.');
          }
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 1000);
  };

  useEffect(() => {
    if (isOpen) {
      loadModels().then(() => {
        if (isModelsLoaded) {
          startVideo();
        }
      });
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isModelsLoaded && isScanning) {
      faceMyDetect();
    }
  }, [isModelsLoaded, isScanning]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsScanning(false);
    setFaceDetected(false);
    setFaceDescriptor(null);
    setDetectionStatus('');
    if (canvasRef.current) {
      canvasRef.current.innerHTML = '';
    }
  };

  const handleFaceAttendance = async () => {
    if (!faceDescriptor || faceDescriptor.length !== 128) {
      toast.error('No valid face detected. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication required');
        setIsProcessing(false);
        return;
      }

      const data = await addFaceTeacherApiCall(token,teacherId, faceDescriptor);

      if (data?.success) {
        const result = {
          studentId: data.data?.student?.id || 'N/A',
          name: data.data?.student?.name || 'Unknown Student',
          rollNumber: data.data?.student?.rollNumber || 'N/A',
          email: data.data?.student?.email || 'N/A',
          className: data.data?.student?.class?.name || 'N/A',
          profileImage: data.data?.student?.profileImage || null,
          status: data.data?.log?.status || 'present',
          time: data.data?.log?.markedAt || new Date().toLocaleTimeString(),
          markedAt: data.data?.log?.markedAt,
          confidence: data.data?.faceDistance || 0.95
        };

        setAttendanceResult(result);
        setShowProfileCard(true);
        toast.success(`✅ Attendance marked for ${result.name}`);

        if (onSuccess) {
          onSuccess(result);
        }

        setTimeout(() => {
          stopCamera();
        }, 3000);
      } else {
        toast.error(data?.message || 'Failed to mark attendance');
      }
    } catch (error: any) {
      console.error('Attendance marking error:', error);
      toast.error(error?.message || 'Failed to mark attendance via face recognition');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartScanning = () => {
    setAttendanceResult(null);
    setShowProfileCard(false);
    startVideo();
  };

  const handleReset = () => {
    stopCamera();
    setAttendanceResult(null);
    setShowProfileCard(false);
    setFaceDetected(false);
    setFaceDescriptor(null);
    setDetectionStatus('');
  };

  const handleClose = () => {
    stopCamera();
    setAttendanceResult(null);
    setShowProfileCard(false);
    setFaceDetected(false);
    setFaceDescriptor(null);
    setDetectionStatus('');
    onClose();
  };

  const ProfileCard = ({ student }: { student: any }) => {
    const profileImageUrl = student.profileImage
      ? `${baseUrl}${student.profileImage}`
      : null;

    return (
      <Card className="border-2 border-green-200 shadow-lg overflow-hidden">
        <div className="relative">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <Badge variant="default" className="bg-white text-green-600">
                {student.status?.toUpperCase() || 'PRESENT'}
              </Badge>
            </div>
          </div>

          <div className="flex justify-center -mt-12">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                {profileImageUrl ? (
                  <AvatarImage
                    src={profileImageUrl}
                    alt={student.name}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-green-100 text-green-600 text-xl">
                    {student.name?.charAt(0)?.toUpperCase() || 'S'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        <CardContent className="pt-6 pb-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
            <p className="text-sm text-muted-foreground">Student</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-3 w-3" />
                <span>Roll Number</span>
              </div>
              <p className="font-medium text-sm">{student.rollNumber || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Award className="h-3 w-3" />
                <span>Class</span>
              </div>
              <p className="font-medium text-sm">{student.className || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span>Time</span>
              </div>
              <p className="font-medium text-sm">
                {student.markedAt
                  ? new Date(student.markedAt).toLocaleTimeString()
                  : student.time || 'N/A'
                }
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle className="h-3 w-3" />
                <span>Confidence</span>
              </div>
              <p className="font-medium text-sm">
                {(student.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {student.email && student.email !== 'N/A' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 rounded-lg p-2">
              <Mail className="h-3 w-3" />
              <span className="font-medium">{student.email}</span>
            </div>
          )}

          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <p className="text-sm font-medium">
                Attendance marked successfully at {student.markedAt
                  ? new Date(student.markedAt).toLocaleTimeString()
                  : student.time || 'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5" />
            Face Scan Attendance
            {teacherName && (
              <span className="text-sm font-normal text-muted-foreground">
                - {teacherName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Mark attendance using face recognition technology
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {!isModelsLoaded && !modelLoadError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    {isLoadingModels ? 'Loading face detection models...' : 'Initializing...'}
                  </p>
                </div>
              </div>
            )}

            {modelLoadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700 font-medium">Model Loading Error</p>
                    <p className="text-xs text-red-600 mt-1">{modelLoadError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        loadModels().then(() => {
                          if (isModelsLoaded) startVideo();
                        });
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
              {detectionStatus && (
                <div className={`absolute bottom-2 left-2 right-2 p-2 rounded text-sm text-center ${
                  faceDetected ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-white'
                }`}>
                  {detectionStatus}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button
                  onClick={handleStartScanning}
                  className="flex-1"
                  disabled={isLoadingModels}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isLoadingModels ? 'Loading...' : 'Start Scanning'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleFaceAttendance}
                    className="flex-1"
                    variant="default"
                    disabled={!faceDetected || isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    {isProcessing ? 'Processing...' : 'Mark Attendance'}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </>
              )}
            </div>

            {faceDescriptor && faceDescriptor.length === 128 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <p className="text-xs text-green-700">
                  <CheckCircle className="inline h-3 w-3 mr-1" />
                  Face descriptor captured (128 dimensions)
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {showProfileCard && attendanceResult ? (
              <ProfileCard student={attendanceResult} />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Camera</span>
                        <Badge variant={isScanning ? "default" : "secondary"}>
                          {isScanning ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Face Detection</span>
                        <Badge variant={faceDetected ? "default" : "secondary"}>
                          {faceDetected ? 'Detected' : 'Waiting'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Models</span>
                        <Badge variant={isModelsLoaded ? "default" : "secondary"}>
                          {isModelsLoaded ? 'Loaded' : 'Loading...'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">How to use</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">1.</span>
                        Click "Start Scanning" to open camera
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">2.</span>
                        Position your face clearly in the frame
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">3.</span>
                        Wait for face detection (green box)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">4.</span>
                        Click "Mark Attendance" to complete
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}