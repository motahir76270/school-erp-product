// components/students/FaceRecognitionModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  ScanFace, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Save
} from 'lucide-react';
import { toast } from 'react-toastify';
import { addOrUpdateStudentFaceDescriptorApiCall } from '@/src/store/slices/studentSlice';
import * as faceapi from 'face-api.js';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  studentName?: string;
  onSuccess?: () => void;
}

export default function FaceRecognitionModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSuccess,
}: FaceRecognitionModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>('');
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start video camera
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

  // Load models from public/models directory
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

  // Face detection function (runs on interval)
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
            setDetectionStatus('Face detected! Ready to capture.');
            
            // Convert Float32Array to regular array of numbers
            const descriptor = Array.from(detections[0].descriptor);
            setFaceDescriptor(descriptor);
            
            // Log the descriptor to verify format
            console.log('Face Descriptor captured:', {
              length: descriptor.length,
              sample: descriptor.slice(0, 5),
              type: typeof descriptor[0],
              isArray: Array.isArray(descriptor)
            });
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

  // Save face descriptor to API
  const captureAndSave = async () => {
    if (!faceDescriptor || faceDescriptor.length !== 128) {
      toast.error('No valid face detected. Please try again.');
      return;
    }

    if (!studentId) {
      toast.error('Student ID missing');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication required');
        setIsSaving(false);
        return;
      }

      // Prepare the data - already in the correct format
      const payload = {
        faceDescriptor: faceDescriptor // Array of 128 numbers
      };

      // Log the payload to verify format before sending
      console.log('Sending face descriptor:', {
        studentId,
        descriptorLength: faceDescriptor.length,
        sample: faceDescriptor.slice(0, 5),
        fullDescriptor: faceDescriptor
      });

      const data = await addOrUpdateStudentFaceDescriptorApiCall(
        token, 
        studentId, 
        faceDescriptor
      );

      if (data?.success) {
        toast.success(data?.message || 'Face registered successfully');
        stopCamera();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data?.message || 'Failed to save face');
      }
    } catch (error: any) {
      console.error('Save face error:', error);
      toast.error(error?.message || 'Failed to save face');
    } finally {
      setIsSaving(false);
    }
  };

  const resetCapture = () => {
    setFaceDetected(false);
    setFaceDescriptor(null);
    setDetectionStatus('');
    if (isScanning) {
      faceMyDetect();
    }
  };

  const handleClose = () => {
    stopCamera();
    setFaceDetected(false);
    setFaceDescriptor(null);
    setDetectionStatus('');
    setIsScanning(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5" />
            Face Recognition
          </DialogTitle>
          <DialogDescription>
            {studentName 
              ? `Capture face for ${studentName}`
              : 'Capture face for student'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Models Loading Status */}
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

          {/* Model Load Error */}
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

          {/* Camera View */}
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

          {/* Face Descriptor Info */}
          {faceDescriptor && faceDescriptor.length === 128 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-xs text-green-700">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                Face descriptor captured (128 dimensions)
              </p>
              <p className="text-xs text-green-600 mt-1">
                Sample: [{faceDescriptor.slice(0, 3).map(v => v.toFixed(3)).join(', ')}, ...]
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button
                onClick={() => {
                  if (!isModelsLoaded) {
                    loadModels().then(() => {
                      if (isModelsLoaded) startVideo();
                    });
                  } else {
                    startVideo();
                  }
                }}
                className="flex-1"
                disabled={isLoadingModels}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isLoadingModels ? 'Loading...' : 'Open Camera'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={captureAndSave}
                  className="flex-1"
                  variant="default"
                  disabled={!faceDetected || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Capture & Save'}
                </Button>
                <Button
                  onClick={resetCapture}
                  variant="outline"
                  disabled={isSaving}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> Ensure good lighting and position your face clearly.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  The face descriptor is a 128-dimensional vector of floating point numbers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}