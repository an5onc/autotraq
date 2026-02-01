import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, SkuLookupResult } from '../api/client';
import { Layout } from '../components/Layout';
import { Camera, Search, X, Printer } from 'lucide-react';

export function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [result, setResult] = useState<SkuLookupResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
          await lookupSku(decodedText);
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

  const lookupSku = async (sku: string) => {
    if (!sku.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.lookupSku(sku.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SKU not found');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    lookupSku(manualSku);
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

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const inputCls = "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm";

  return (
    <Layout>
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Scan Barcode</h1>
          <p className="text-sm text-slate-500 mt-1">Scan a part barcode or enter SKU manually</p>
        </div>

        {/* Camera Scanner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <div id="scanner-region" className={scanning ? 'mb-4' : 'hidden'} />
          {!scanning ? (
            <button onClick={startScanner} className="flex items-center gap-2 w-full justify-center px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors cursor-pointer">
              <Camera className="w-5 h-5" /> Start Camera Scanner
            </button>
          ) : (
            <button onClick={stopScanner} className="flex items-center gap-2 w-full justify-center px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer">
              <X className="w-5 h-5" /> Stop Scanner
            </button>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Manual SKU Lookup</h3>
          <form onSubmit={handleManualLookup} className="flex gap-3">
            <input type="text" className={inputCls} placeholder="e.g. FD-MUS-24-ENBL" value={manualSku} onChange={(e) => setManualSku(e.target.value.toUpperCase())} />
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        {loading && <div className="text-center text-slate-500 py-8">Looking up SKU...</div>}

        {/* Result */}
        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white">SKU Found</h3>
              <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <img src={`data:image/png;base64,${result.barcode_png_base64}`} alt="Barcode" className="max-w-full" />
              <p className="mt-2 text-lg font-mono font-bold text-amber-400">{result.sku}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}
