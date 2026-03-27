import { useState, useRef, useEffect } from 'react';
import * as QRCodeLib from 'qrcode';
import JsBarcode from 'jsbarcode';
import { X, Download, Eye, Printer, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export interface LabelPart {
  id: number;
  sku: string;
  name: string;
  barcodeData?: string; // Base64 PNG barcode
}

export type LabelSize = '2x1' | '3x2' | '4x2';
export type TemplateType = 'minimal' | 'detailed' | 'with-logo';

interface LabelConfig {
  size: LabelSize;
  template: TemplateType;
  includeQR: boolean;
  barcodeFormat: 'barcode' | 'qr' | 'both';
}

interface BarcodeGeneratorProps {
  parts: LabelPart[];
  onClose: () => void;
  logoUrl?: string;
}

// Label dimensions in inches (converted to mm for PDF export)
const LABEL_DIMENSIONS: Record<LabelSize, { width: number; height: number; name: string }> = {
  '2x1': { width: 51, height: 25, name: '2" x 1"' },
  '3x2': { width: 76, height: 51, name: '3" x 2"' },
  '4x2': { width: 102, height: 51, name: '4" x 2"' },
};

// Convert mm to inches for CSS
const mmToInches = (mm: number): number => mm / 25.4;

export function BarcodeGenerator({ parts, onClose, logoUrl }: BarcodeGeneratorProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>('2x1');
  const [templateType, setTemplateType] = useState<TemplateType>('minimal');
  const [includeQR, setIncludeQR] = useState(false);
  const [barcodeFormat, setBarcodeFormat] = useState<'barcode' | 'qr' | 'both'>('barcode');
  const [previewMode, setPreviewMode] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const qrRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Parse SKU format: MM-MMM-YY-PPCC
  const parseSKU = (sku: string) => {
    const parts = sku.split('-');
    return {
      makeCode: parts[0] || '',
      systemCode: parts[1] || '',
      year: parts[2] || '',
      positionComponent: parts[3] || '',
    };
  };

  // Generate PDF export
  const exportToPDF = async () => {
    try {
      // Dynamically import jspdf as it might not be in package.json yet
      // For now, we'll use the print dialog with CSS for PDF conversion
      toast.loading('Preparing PDF...');

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Could not open print window');
        return;
      }

      const labelDim = LABEL_DIMENSIONS[labelSize];
      const inchWidth = labelDim.width / 25.4;
      const inchHeight = labelDim.height / 25.4;

      // Create HTML for PDF export
      let html = `
        <html>
          <head>
            <title>AutoTraq Labels - ${new Date().toLocaleDateString()}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background: white;
              }
              .page {
                width: 8.5in;
                height: 11in;
                padding: 0.25in;
                margin: 0;
                page-break-after: always;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(${inchWidth}in, 1fr));
                gap: 0.1in;
                overflow: hidden;
              }
              .label {
                width: ${inchWidth}in;
                height: ${inchHeight}in;
                border: 1px solid #ccc;
                padding: 0.05in;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                page-break-inside: avoid;
                background: white;
                font-size: 8pt;
                text-align: center;
                overflow: hidden;
              }
              .label-minimal { gap: 0.05in; }
              .label-detailed { gap: 0.03in; }
              .label-with-logo { gap: 0.02in; }

              .barcode-container, .qr-container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .barcode-container img,
              .barcode-container canvas,
              .qr-container canvas {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              .sku {
                font-weight: bold;
                font-family: 'Courier New', monospace;
                font-size: 7pt;
                word-break: break-all;
              }
              .name {
                font-size: 6pt;
                color: #333;
                line-height: 1.2;
                word-break: break-word;
                max-height: 0.15in;
                overflow: hidden;
              }
              .logo {
                width: 0.3in;
                height: 0.3in;
                object-fit: contain;
                margin-bottom: 0.02in;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .page { padding: 0; margin: 0; }
              }
            </style>
          </head>
          <body>
      `;

      // Create labels for PDF
      let labelCount = 0;
      let currentPage = 0;
      let labelsPerPage = calculateLabelsPerPage(labelSize);

      html += '<div class="page">';

      for (const part of parts) {
        if (labelCount > 0 && labelCount % labelsPerPage === 0) {
          html += '</div><div class="page">';
          currentPage++;
        }

        const skuParsed = parseSKU(part.sku);
        const templateClass = `label label-${templateType}`;

        html += `<div class="${templateClass}">`;

        if (templateType === 'with-logo' && logoUrl) {
          html += `<img src="${logoUrl}" alt="Logo" class="logo" />`;
        }

        // Add barcode or QR code
        if (barcodeFormat === 'barcode' || barcodeFormat === 'both') {
          if (part.barcodeData) {
            html += `<div class="barcode-container"><img src="data:image/png;base64,${part.barcodeData}" alt="Barcode" /></div>`;
          }
        }

        if (barcodeFormat === 'qr' || barcodeFormat === 'both') {
          // QR code will be added via canvas - for now show placeholder
          html += `<div class="qr-container" data-qr="${part.sku}"></div>`;
        }

        if (templateType === 'detailed') {
          html += `
            <div class="sku">${part.sku}</div>
            <div style="font-size: 5pt; color: #666;">
              ${skuParsed.makeCode} | ${skuParsed.systemCode}
            </div>
          `;
        } else if (templateType === 'minimal') {
          html += `<div class="sku">${part.sku}</div>`;
        } else {
          html += `<div class="sku">${part.sku}</div>`;
        }

        if (templateType !== 'minimal') {
          html += `<div class="name">${part.name}</div>`;
        }

        html += '</div>';
        labelCount++;
      }

      html += '</div></body></html>';

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for images to load, then print
      setTimeout(() => {
        // Add QR codes via canvas
        const qrElements = printWindow.document.querySelectorAll('[data-qr]');
        qrElements.forEach((el) => {
          const sku = (el as HTMLElement).dataset.qr || '';
          try {
            // Use qrcode library to generate QR as data URL
            const canvas = document.createElement('canvas');
            const qrcodeLib = require('qrcode');
            qrcodeLib.toCanvas(canvas, sku, { width: 100 }, (err: any) => {
              if (!err) {
                const img = printWindow.document.createElement('img');
                img.src = canvas.toDataURL();
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                (el as HTMLElement).innerHTML = '';
                (el as HTMLElement).appendChild(img);
              }
            });
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
        });

        printWindow.print();
      }, 1000);

      toast.dismiss();
      toast.success('PDF ready - Use browser print dialog to save');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  // Calculate labels per page based on label size and orientation
  const calculateLabelsPerPage = (size: LabelSize): number => {
    const labelDim = LABEL_DIMENSIONS[size];
    const pageWidth = 8.5;
    const pageHeight = 11;
    const usableWidth = pageWidth - 0.5; // 0.25in margins
    const usableHeight = pageHeight - 0.5;

    const inchWidth = labelDim.width / 25.4;
    const inchHeight = labelDim.height / 25.4;

    const colsPerPage = Math.floor(usableWidth / inchWidth);
    const rowsPerPage = Math.floor(usableHeight / inchHeight);

    return colsPerPage * rowsPerPage;
  };

  // Generate a single QR code as canvas element
  const generateQRCode = (sku: string, containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = Math.min(150, LABEL_DIMENSIONS[labelSize].width * 3);
    const canvas = document.createElement('canvas');

    QRCodeLib.toCanvas(canvas, sku, {
      width: size,
      errorCorrectionLevel: 'H',
      margin: 0
    }, (err: any) => {
      if (!err) {
        container.innerHTML = '';
        container.appendChild(canvas);
      }
    });
  };

  // Render a single label for preview
  const renderLabel = (part: LabelPart) => {
    const labelDim = LABEL_DIMENSIONS[labelSize];
    const inchWidth = labelDim.width / 25.4;
    const inchHeight = labelDim.height / 25.4;
    const skuParsed = parseSKU(part.sku);
    const qrContainerId = `qr-${part.id}-${labelSize}-${barcodeFormat}`;

    // Generate QR code when container is mounted
    useEffect(() => {
      if ((barcodeFormat === 'qr' || barcodeFormat === 'both') && document.getElementById(qrContainerId)) {
        generateQRCode(part.sku, qrContainerId);
      }
    }, [part.sku, labelSize, barcodeFormat, qrContainerId]);

    return (
      <div
        key={`label-${part.id}`}
        className="border border-slate-300 bg-white flex flex-col items-center justify-center p-1 overflow-hidden"
        style={{
          width: `${inchWidth}in`,
          height: `${inchHeight}in`,
          fontSize: labelSize === '2x1' ? '0.55rem' : labelSize === '3x2' ? '0.7rem' : '0.9rem',
        }}
      >
        {templateType === 'with-logo' && logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            className="object-contain"
            style={{ maxWidth: '0.3in', maxHeight: '0.3in', marginBottom: '0.05in' }}
          />
        )}

        {(barcodeFormat === 'barcode' || barcodeFormat === 'both') && part.barcodeData && (
          <div className="flex-1 flex items-center justify-center">
            <img
              src={`data:image/png;base64,${part.barcodeData}`}
              alt="Barcode"
              className="object-contain"
              style={{ maxWidth: '100%', maxHeight: '50%' }}
            />
          </div>
        )}

        {(barcodeFormat === 'qr' || barcodeFormat === 'both') && (
          <div
            id={qrContainerId}
            className="flex items-center justify-center"
            style={{ flex: 1, minHeight: labelSize === '2x1' ? '30px' : '60px' }}
          />
        )}

        {templateType === 'detailed' && (
          <>
            <div className="font-bold font-mono text-center break-all">{part.sku}</div>
            <div className="text-xs text-slate-600 text-center">
              {skuParsed.makeCode} | {skuParsed.systemCode}
            </div>
          </>
        )}

        {templateType === 'minimal' && <div className="font-bold font-mono text-center break-all">{part.sku}</div>}

        {templateType === 'with-logo' && (
          <>
            <div className="font-bold font-mono text-center break-all text-xs">{part.sku}</div>
            <div className="text-xs text-slate-600 text-center line-clamp-2">{part.name}</div>
          </>
        )}

        {(templateType === 'detailed' || templateType === 'with-logo') && templateType !== 'with-logo' && (
          <div className="text-xs text-slate-600 text-center line-clamp-1">{part.name}</div>
        )}
      </div>
    );
  };

  const labelsPerPage = calculateLabelsPerPage(labelSize);
  const totalPages = Math.ceil(parts.length / labelsPerPage);
  const pageArray = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl mx-4 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Batch Label Print Preview</h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
              {parts.length} labels · {totalPages} page{totalPages !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Panel */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {/* Label Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Label Size
              </label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as LabelSize)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {Object.entries(LABEL_DIMENSIONS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Template
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="minimal">Minimal (SKU only)</option>
                <option value="detailed">Detailed (SKU + Code)</option>
                <option value="with-logo">With Logo + Name</option>
              </select>
            </div>

            {/* Barcode Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Encode
              </label>
              <select
                value={barcodeFormat}
                onChange={(e) => setBarcodeFormat(e.target.value as 'barcode' | 'qr' | 'both')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="barcode">Barcode (128)</option>
                <option value="qr">QR Code</option>
                <option value="both">Both (QR + Barcode)</option>
              </select>
            </div>

            {/* Toggle QR Inclusion */}
            <div className="flex items-end">
              <button
                onClick={() => setIncludeQR(!includeQR)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  includeQR
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {includeQR ? '✓ Include QR' : 'Include QR'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" /> {previewMode ? 'Hide' : 'Show'} Preview
            </button>
            <button
              onClick={() => {
                if (printContainerRef.current) {
                  window.print();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>

        {/* Preview Area */}
        {previewMode && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
            <div ref={printContainerRef}>
              {pageArray.map((pageIndex) => {
                const startIdx = pageIndex * labelsPerPage;
                const endIdx = Math.min(startIdx + labelsPerPage, parts.length);
                const pageLabels = parts.slice(startIdx, endIdx);

                // Calculate grid columns for this page
                const labelDim = LABEL_DIMENSIONS[labelSize];
                const inchWidth = labelDim.width / 25.4;
                const pageWidth = 8.5;
                const usableWidth = pageWidth - 0.5;
                const colsPerPage = Math.floor(usableWidth / inchWidth);

                return (
                  <div key={`page-${pageIndex}`} className="mb-6">
                    <div className="text-xs text-slate-500 mb-2">
                      Page {pageIndex + 1} of {totalPages}
                    </div>
                    <div
                      className="bg-white rounded-lg border-2 border-slate-700 p-4"
                      style={{
                        width: '8.5in',
                        height: '11in',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${colsPerPage}, 1fr)`,
                        gap: '0.1in',
                        margin: '0 auto',
                      }}
                    >
                      {pageLabels.map((part) => renderLabel(part))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!previewMode && (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center">
              <Settings className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">Configure label settings above</p>
              <p className="text-sm text-slate-600">Click "Show Preview" to see the layout</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-400">{parts.length}</span> parts ready to print •
              <span className="font-semibold text-slate-400 ml-1">{totalPages}</span> page{totalPages !== 1 ? 's' : ''} •
              Size: {LABEL_DIMENSIONS[labelSize].name} • Template: {templateType}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .fixed, .bg-black, .backdrop-blur-sm, .px-6, .py-4, .border-b, .border-slate-800, .bg-slate-800/30, .shrink-0, .px-4, .py-2.5, .inline-flex, .items-center, .gap-2, .rounded-lg, .text-sm, .text-slate-300, .cursor-pointer, .flex, .items-end, .bg-amber-500/10, .border-amber-500/30, .text-amber-400, .hover\\:bg-amber-500/20, .hover\\:border-slate-600, .text-blue-400, .w-12, .h-12, .text-slate-700, .mx-auto, .mb-3, .mb-2, .border-t, .bg-slate-800/30 {
            display: none !important;
          }

          div[style*="display: grid"] {
            display: grid !important;
          }

          .bg-white {
            background: white !important;
            border: none !important;
          }

          .border {
            border: 1px solid #ccc !important;
          }
        }
      `}</style>
    </div>
  );
}
