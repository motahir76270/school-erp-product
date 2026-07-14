'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ value, size = 200, className }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
      }).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [value, size]);

  if (!qrDataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        Loading...
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={qrDataUrl}
      alt="QR Code"
      className={`rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
