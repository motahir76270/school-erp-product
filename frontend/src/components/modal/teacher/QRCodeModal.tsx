// app/components/modals/qr-code-modal.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeData: {
    qrCode: string;
    qrCodeUrl: string;
  } | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function QRCodeModal({ 
  isOpen, 
  onClose, 
  qrCodeData, 
  onRegenerate, 
  isRegenerating 
}: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Teacher QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access teacher information.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          {qrCodeData && (
            <>
              <div className="relative w-48 h-48 bg-white rounded-lg overflow-hidden">
                <Image
                  src={qrCodeData}
                  alt="Teacher QR Code"
                  fill
                  className="object-contain p-2"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate QR Code {qrCodeData.qrCodeUrl}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}