import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
  onToggle: () => void;
  supportedFormats?: BarcodeFormat[];
}

const DEFAULT_FORMATS: BarcodeFormat[] = ['ean_13', 'ean_8', 'code_128', 'qr_code'];

export function BarcodeScanner({
  onScan,
  onError,
  isActive,
  onToggle,
  supportedFormats = DEFAULT_FORMATS,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedFormats, setDetectedFormats] = useState<BarcodeFormat[]>([]);

  // Check BarcodeDetector API availability
  useEffect(() => {
    const checkBarcodeDetector = async () => {
      if ('BarcodeDetector' in window) {
        try {
          const formats = await window.BarcodeDetector!.getSupportedFormats();
          setHasBarcodeDetector(true);
          setDetectedFormats(formats);
        } catch (err) {
          setHasBarcodeDetector(false);
          onError?.('BarcodeDetector API is not fully supported');
        }
      } else {
        setHasBarcodeDetector(false);
      }
    };

    checkBarcodeDetector();
  }, [onError]);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    setIsInitializing(true);
    setCameraError(null);

    try {
      // Request camera access with rear camera preference
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            resolve();
          };
        }
      });

      setDetectorReady(true);
      setIsInitializing(false);
    } catch (err) {
      setIsInitializing(false);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Could not access camera. Please check permissions.';
      setCameraError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setDetectorReady(false);
    setCameraError(null);
  }, []);

  // Scan using BarcodeDetector API
  const scanWithBarcodeDetector = useCallback(async () => {
    if (!videoRef.current || !detectorReady || !hasBarcodeDetector) return;

    try {
      const detector = new window.BarcodeDetector!({
        formats: supportedFormats,
      });

      const barcodes = await detector.detect(videoRef.current);

      if (barcodes.length > 0) {
        const barcode = barcodes[0];
        setLastScan(barcode.rawValue);
        onScan(barcode.rawValue);

        // Stop scanning after successful detection
        stopCamera();
        onToggle();
      }
    } catch (err) {
      console.error('Barcode detection error:', err);
    }
  }, [detectorReady, hasBarcodeDetector, supportedFormats, onScan, stopCamera, onToggle]);

  // Fallback: Manual scan using canvas (for browsers without BarcodeDetector)
  const scanWithFallback = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !detectorReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // In a real implementation, you would use a library like jsQR or quagga
    // For now, we'll show an error message
    onError?.(
      'BarcodeDetector API not available. Please use a supported browser (Chrome, Edge) or enable the feature flag.'
    );
  }, [detectorReady, onError]);

  // Start/stop scanning based on isActive
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  // Start continuous scanning when detector is ready
  useEffect(() => {
    if (detectorReady && hasBarcodeDetector) {
      // Scan every 500ms using BarcodeDetector API
      scanIntervalRef.current = window.setInterval(() => {
        scanWithBarcodeDetector();
      }, 500);
    } else if (detectorReady && !hasBarcodeDetector) {
      // Fallback scanning (less frequent)
      scanIntervalRef.current = window.setInterval(() => {
        scanWithFallback();
      }, 1000);
    }

    return () => {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
    };
  }, [detectorReady, hasBarcodeDetector, scanWithBarcodeDetector, scanWithFallback]);

  // Clear last scan after 3 seconds
  useEffect(() => {
    if (lastScan) {
      const timer = setTimeout(() => setLastScan(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScan]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Barcode Scanner
          </h3>
          <p className="text-xs text-slate-600">
            {hasBarcodeDetector
              ? `Native API (${detectedFormats.length} formats supported)`
              : 'Fallback mode - BarcodeDetector API not available'}
          </p>
        </div>
        <button
          onClick={onToggle}
          disabled={isInitializing}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-amber-500 text-slate-900 hover:bg-amber-400'
          }`}
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing...
            </>
          ) : isActive ? (
            <>
              <X className="w-4 h-4" />
              Stop Scanner
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Start Scanner
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {cameraError && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Camera Error</p>
            <p className="text-red-400/80 text-xs mt-1">{cameraError}</p>
          </div>
        </div>
      )}

      {lastScan && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-400 text-sm font-medium">Barcode Detected</p>
            <p className="text-emerald-400/80 text-xs mt-1 font-mono">{lastScan}</p>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {isActive && (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-96 object-contain"
          />

          {/* Scanning Overlay */}
          {detectorReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-32">
                {/* Scanning Frame */}
                <div className="absolute inset-0 border-2 border-amber-400 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
                </div>

                {/* Scanning Line Animation */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan-line" />
              </div>
            </div>
          )}

          {/* Initialization Overlay */}
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-white text-sm font-medium">Starting camera...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for fallback */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Info section when not active */}
      {!isActive && !cameraError && (
        <div className="text-center py-8">
          <Camera className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-sm mb-2">
            Click "Start Scanner" to begin scanning barcodes
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded border border-slate-700"
              >
                {format.toUpperCase().replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
