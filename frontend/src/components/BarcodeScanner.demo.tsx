/**
 * BarcodeScanner Component Demo Page
 *
 * This is a standalone demo page for testing the BarcodeScanner component.
 * To use it, add this route to your router:
 *
 * <Route path="/demo/barcode-scanner" element={<BarcodeScannerDemo />} />
 */

import { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { CheckCircle2, XCircle, Camera, Info } from 'lucide-react';

export function BarcodeScannerDemo() {
  const [isActive, setIsActive] = useState(false);
  const [scanHistory, setScanHistory] = useState<
    Array<{ barcode: string; timestamp: Date; success: boolean }>
  >([]);
  const [selectedFormats, setSelectedFormats] = useState<BarcodeFormat[]>([
    'ean_13',
    'ean_8',
    'code_128',
    'qr_code',
  ]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
  });

  const allFormats: BarcodeFormat[] = [
    'aztec',
    'code_128',
    'code_39',
    'code_93',
    'codabar',
    'data_matrix',
    'ean_13',
    'ean_8',
    'itf',
    'pdf417',
    'qr_code',
    'upc_a',
    'upc_e',
  ];

  const handleScan = async (barcode: string) => {
    console.log('Scanned barcode:', barcode);

    // Simulate part lookup
    const isSuccess = Math.random() > 0.3; // 70% success rate for demo

    setScanHistory((prev) => [
      {
        barcode,
        timestamp: new Date(),
        success: isSuccess,
      },
      ...prev.slice(0, 9), // Keep last 10 scans
    ]);

    setStats((prev) => ({
      totalScans: prev.totalScans + 1,
      successfulScans: prev.successfulScans + (isSuccess ? 1 : 0),
      failedScans: prev.failedScans + (isSuccess ? 0 : 1),
    }));

    if (!isSuccess) {
      setError(`Part not found for barcode: ${barcode}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error('Scanner error:', errorMessage);
  };

  const toggleFormat = (format: BarcodeFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const clearHistory = () => {
    setScanHistory([]);
    setStats({
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Barcode Scanner Demo</h1>
          <p className="text-slate-400">
            Test the BarcodeDetector API integration with various configurations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Scanner */}
          <div className="lg:col-span-2 space-y-6">
            <BarcodeScanner
              onScan={handleScan}
              onError={handleError}
              isActive={isActive}
              onToggle={() => setIsActive(!isActive)}
              supportedFormats={selectedFormats}
            />

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Error</p>
                  <p className="text-red-400/80 text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-500 text-sm mb-1">Total Scans</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalScans}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-500 text-sm mb-1">Successful</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {stats.successfulScans}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-500 text-sm mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-400">
                  {stats.failedScans}
                </p>
              </div>
            </div>

            {/* Scan History */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Scan History</h3>
                {scanHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {scanHistory.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  No scans yet. Start scanning to see history.
                </p>
              ) : (
                <div className="space-y-2">
                  {scanHistory.map((scan, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {scan.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <code className="text-sm font-mono text-white">
                          {scan.barcode}
                        </code>
                      </div>
                      <span className="text-xs text-slate-500">
                        {scan.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Barcode Formats
              </h3>
              <div className="space-y-2">
                {allFormats.map((format) => (
                  <label
                    key={format}
                    className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(format)}
                      onChange={() => toggleFormat(format)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-300">
                      {format.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Browser Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Browser Info
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-1">User Agent</p>
                  <p className="text-slate-300 text-xs break-all">
                    {navigator.userAgent}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">
                    BarcodeDetector API
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      'BarcodeDetector' in window
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {'BarcodeDetector' in window ? 'Supported' : 'Not Supported'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">MediaDevices API</p>
                  <p
                    className={`text-xs font-medium ${
                      navigator.mediaDevices ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {navigator.mediaDevices ? 'Supported' : 'Not Supported'}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Barcodes */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Test Barcodes
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                <p>Use these test barcodes to verify scanning:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>EAN-13: Print from a barcode generator</li>
                  <li>Code 128: Common on product packaging</li>
                  <li>QR Code: Use any QR code generator</li>
                  <li>
                    Example SKU: FD-MUS-24-ENBL
                  </li>
                </ul>
                <p className="mt-3 pt-3 border-t border-slate-800">
                  For testing, you can generate barcodes at:
                  <a
                    href="https://barcode.tec-it.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-amber-400 hover:text-amber-300 mt-1"
                  >
                    barcode.tec-it.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">
            For implementation details and API documentation, see{' '}
            <code className="px-2 py-1 bg-slate-800 rounded text-amber-400">
              BARCODE_SCANNER.md
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
