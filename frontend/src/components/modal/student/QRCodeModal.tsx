// components/students/QRCodeModal.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { regenerateStudentQRCodeApiCall } from '@/store/slices/studentSlice';
import { toast } from 'react-toastify';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string | null;
  studentId: string | null;
  onRegenerate?: () => void;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  qrCodeUrl,
  studentId,
  onRegenerate,
}: QRCodeModalProps) {
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_FILE

  const handleRegenerate = async () => {
    if (!studentId) return;
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsRegeneratingQR(true);
    try {
      const data = await regenerateStudentQRCodeApiCall(token);
      if (data?.success === true) {
        toast.success(data?.message || 'QR code regenerated successfully');
        if (onRegenerate) onRegenerate();
      } else {
        toast.error(data?.message || 'Failed to regenerate QR code');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to regenerate QR code');
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Student QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access student information.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          {qrCodeUrl && (
            <>
              <div className="relative w-48 h-48 bg-white rounded-lg overflow-hidden">
                <Image
                  src={`${qrCodeUrl}`}
                  alt="Student QR Code"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegeneratingQR}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRegeneratingQR ? 'animate-spin' : ''}`} />
                Regenerate QR Code 
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}