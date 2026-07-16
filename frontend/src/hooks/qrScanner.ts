// src/hooks/useQrScanner.ts
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRef, useState, useCallback } from 'react';

export const useQrScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<any | null>(null);

  const startScanner = useCallback((element: HTMLElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Clean up existing scanner
        if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
        }


        // Clear previous content
        element.innerHTML = '';

        // Create scanner instance - use a unique ID for the container
        const containerId = 'qr-scanner-' + Date.now();
        element.id = containerId;

        const scanner = new Html5QrcodeScanner(
          containerId,
          {
            qrbox: {
              width: 250,
              height: 250,
            },
            fps: 10,
            aspectRatio: 1.0,
          },
          false
        );

        scannerRef.current = scanner;
        setIsScanning(true);
        setScannerReady(false);

        // Render the scanner
        scanner.render(
          (decodedText: string) => {
            if (decodedText) {
              scanner.clear();
              scannerRef.current = null;
              setIsScanning(false);
              setScannerReady(false);
              resolve(decodedText);
            }
          },
          (errorMessage: string) => {
            // Ignore scan errors
          }
        );

        setScannerReady(true);
      } catch (error) {
        console.error('Scanner error:', error);
        setIsScanning(false);
        setScannerReady(false);
        reject(error);
      }
    });
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
        setScannerReady(false);
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
      scannerRef.current = null;
      setIsScanning(false);
      setScannerReady(false);
      throw error;
    }
  }, []);

  return {
    isScanning,
    scannerReady,
    startScanner,
    stopScanner,
  };
};