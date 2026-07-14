'use client';

import { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

export function QRScanner({ onScan, onError, isActive }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setHasPermission(true);

          simulateQRScanning();
        }
      } catch (error) {
        setHasPermission(false);
        if (onError) {
          onError('Could not access camera. Please grant camera permissions.');
        }
      }
    }

    function simulateQRScanning() {
      const simulatedQRCode = `STU-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      setTimeout(() => {
        if (isActive) {
          onScan(simulatedQRCode);
        }
      }, 3000);
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, onScan, onError]);

  if (!isActive) return null;

  return (
    <div className="relative aspect-video w-full max-w-md mx-auto">
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center p-4">
            <p className="text-muted-foreground">Camera permission required</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-auto rounded-lg"
        playsInline
        muted
      />

      {hasPermission && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-primary rounded-lg animate-pulse">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
