import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Html5QrcodeScanner: any;
  }
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scannerId = "reader";
    
    // Check if the global object exists (loaded from CDN)
    if (!window.Html5QrcodeScanner) {
      setError("QR Scanner library not loaded. Please refresh.");
      return;
    }

    let scanner: any = null;
    
    try {
      scanner = new window.Html5QrcodeScanner(
        scannerId,
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText: string) => {
          scanner.clear().catch(console.error);
          onScan(decodedText);
        },
        (error: any) => {
          // Silently handle scan errors
        }
      );
    } catch (e) {
      console.error("Scanner initialization failed", e);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((err: any) => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-lg glass-liquid rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="text-xl font-medium">Scan Table QR</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8">
          {error ? (
            <div className="text-red-400 text-center py-12">{error}</div>
          ) : (
            <div id="reader" className="overflow-hidden rounded-2xl border border-white/10 bg-black/40" />
          )}
          
          <p className="mt-6 text-center text-white/40 text-sm font-light">
            Position the QR code within the frame to scan.
          </p>
        </div>
      </div>
    </div>
  );
};
