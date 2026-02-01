import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api, SkuLookupResult, Part } from '../api/client';
import { Layout } from '../components/Layout';
import { Camera, Search, X, Printer, Usb, Zap, ExternalLink, AlertCircle } from 'lucide-react';

export function ScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scanning, setScanning] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [result, setResult] = useState<SkuLookupResult | null>(null);
  const [foundPart, setFoundPart] = useState<Part | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usbMode, setUsbMode] = useState(false);
  const [usbBuffer, setUsbBuffer] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const usbBufferRef = useRef('');
  const usbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Auto-activate mode from sidebar sub-nav
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'usb') setUsbMode(true);
    if (mode === 'camera') startScanner();
    if (mode === 'manual') manualInputRef.current?.focus();
  }, []);

  const startScanner = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode('scanner-region');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 300, height: 100 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          await lookupAndNavigate(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setError('Could not access camera. Please allow camera permissions or use manual entry.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const lookupAndNavigate = async (sku: string) => {
    if (!sku.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setFoundPart(null);
    try {
      // First, search for the part in inventory by SKU
      const partsResult = await api.getParts(sku.trim());
      const exactMatch = partsResult.parts.find(
        (p) => p.sku.toLowerCase() === sku.trim().toLowerCase()
      );

      if (exactMatch) {
        // Part exists in inventory — navigate directly to detail page
        navigate(`/parts/${exactMatch.id}`);
        return;
      }

      // Part not in inventory — try to decode the SKU
      try {
        const decoded = await api.lookupSku(sku.trim());
        setResult(decoded);
        setError('This SKU was decoded but no matching part exists in inventory.');
      } catch {
        setError(`No part found with SKU "${sku.trim()}" and could not decode the SKU format.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    lookupAndNavigate(manualSku);
  };

  const handlePrint = () => {
    if (!result) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Barcode - ${result.sku}</title>
      <style>body{font-family:monospace;text-align:center;padding:40px}img{max-width:100%}h2{margin:20px 0 5px}p{color:#666;margin:4px 0}</style></head>
      <body>
        <img src="data:image/png;base64,${result.barcode_png_base64}" />
        <h2>${result.sku}</h2>
        <p>${result.decoded.make} ${result.decoded.model} ${result.decoded.year}</p>
        <p>${result.decoded.system} — ${result.decoded.component}${result.decoded.position ? ' (' + result.decoded.position + ')' : ''}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  // USB Barcode Scanner Mode
  const handleUsbKeydown = useCallback((e: KeyboardEvent) => {
    if (!usbMode) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const code = usbBufferRef.current.trim();
      if (code.length >= 3) {
        lookupAndNavigate(code);
        setUsbBuffer('');
        usbBufferRef.current = '';
      }
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      usbBufferRef.current += e.key;
      setUsbBuffer(usbBufferRef.current);

      if (usbTimerRef.current) clearTimeout(usbTimerRef.current);
      usbTimerRef.current = setTimeout(() => {}, 2000);
    }
  }, [usbMode]);

  useEffect(() => {
    if (usbMode) {
      window.addEventListener('keydown', handleUsbKeydown);
      return () => window.removeEventListener('keydown', handleUsbKeydown);
    }
  }, [usbMode, handleUsbKeydown]);

  const toggleUsbMode = () => {
    setUsbMode(prev => {
      if (!prev) {
        setUsbBuffer('');
        usbBufferRef.current = '';
      }
      return !prev;
    });
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <Layout>
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Scan Barcode</h1>
          <p className="text-sm text-slate-500 mt-2">Scan or enter a SKU to jump straight to the part details</p>
        </div>

        {/* Camera Scanner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Camera Scanner</h3>
          <div id="scanner-region" className={scanning ? 'mb-4' : 'hidden'} />
          {!scanning ? (
            <button onClick={startScanner} className="flex items-center gap-3 w-full justify-center px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors cursor-pointer text-sm">
              <Camera className="w-5 h-5" /> Start Camera Scanner
            </button>
          ) : (
            <button onClick={stopScanner} className="flex items-center gap-3 w-full justify-center px-6 py-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors cursor-pointer text-sm">
              <X className="w-5 h-5" /> Stop Scanner
            </button>
          )}
        </div>

        {/* USB Scanner Mode */}
        <div className={`bg-slate-900 border rounded-2xl p-8 mb-8 transition-colors ${usbMode ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Usb className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">USB Barcode Scanner</h3>
            </div>
            <button onClick={toggleUsbMode} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${usbMode ? 'bg-amber-500 text-slate-900 hover:bg-amber-400' : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600'}`}>
              <Zap className="w-4 h-4" />
              {usbMode ? 'Scanner Active' : 'Enable Scanner Mode'}
            </button>
          </div>
          {usbMode ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-amber-400 text-sm font-medium">Listening for scanner input...</span>
              </div>
              {usbBuffer && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Buffer:</p>
                  <p className="text-xl font-mono font-bold text-white">{usbBuffer}</p>
                </div>
              )}
              <p className="text-xs text-slate-600 mt-4">Point your USB scanner at a barcode. It will auto-navigate to the part.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Plug in your USB barcode scanner and enable scanner mode. Scans auto-lookup — no clicking required.</p>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Manual SKU Lookup</h3>
          <form onSubmit={handleManualLookup} className="flex gap-4">
            <div className="relative flex-1">
              <input
                ref={manualInputRef}
                type="text"
                className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
                placeholder="Enter SKU (e.g. FD-MUS-24-ENBL)"
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value.toUpperCase())}
              />
            </div>
            <button type="submit" disabled={loading} className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 text-sm">
              {loading ? 'Searching...' : 'Lookup'}
            </button>
          </form>
        </div>

        {/* Error / Not in inventory */}
        {error && (
          <div className="mb-8 p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">{error}</p>
                {result && (
                  <p className="text-slate-500 text-xs mt-2">The SKU decoded successfully but this part hasn't been added to inventory yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && <div className="text-center text-slate-500 py-8">Looking up SKU...</div>}

        {/* Decoded result (only shown when part NOT in inventory) */}
        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">SKU Decoded</h3>
                <p className="text-xs text-slate-500 mt-1">This part is not in inventory</p>
              </div>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
            <div className="flex flex-col items-center mb-8">
              {result.barcode_png_base64 && (
                <img src={`data:image/png;base64,${result.barcode_png_base64}`} alt="Barcode" className="max-w-full" />
              )}
              <p className="mt-3 text-xl font-mono font-bold text-amber-400">{result.sku}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <InfoItem label="Make" value={result.decoded.make} />
              <InfoItem label="Model" value={result.decoded.model} />
              <InfoItem label="Year" value={String(result.decoded.year)} />
              <InfoItem label="System" value={result.decoded.system} />
              <InfoItem label="Component" value={result.decoded.component} />
              {result.decoded.position && <InfoItem label="Position" value={result.decoded.position} />}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-base text-white font-medium">{value}</p>
    </div>
  );
}
