# Barcode Scanner Integration - AutoTraq

## Overview

This implementation adds a modern barcode scanner to the AutoTraq parts inventory system using the native **Barcode Detection API** with automatic fallback support.

## Features

- **Native BarcodeDetector API**: Uses the browser's built-in barcode detection for optimal performance
- **Multiple Format Support**: Supports EAN-13, EAN-8, Code 128, and QR codes
- **Automatic Part Lookup**: Scans barcodes and automatically looks up parts by SKU
- **Real-time Camera Preview**: Live video feed with visual scanning overlay
- **Error Handling**: Comprehensive error handling for camera permissions and scanning failures
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and ARIA labels

## Files Created

### 1. `/src/types/barcode.d.ts`
TypeScript type definitions for the Barcode Detection API. Provides type safety for:
- `BarcodeDetector` class
- `DetectedBarcode` interface
- `BarcodeFormat` types
- Browser compatibility checks

### 2. `/src/components/BarcodeScanner.tsx`
Main barcode scanner component with:
- Camera stream management
- BarcodeDetector API integration
- Fallback detection for unsupported browsers
- Visual scanning overlay with animated scan line
- Real-time barcode detection (scans every 500ms)
- Automatic cleanup on unmount

### 3. `/src/index.css` (modified)
Added custom animation for the scanning line overlay:
```css
@utility animate-scan-line {
  animation: scanLine 2s ease-in-out infinite;
}
```

### 4. `/src/pages/ScanPage.tsx` (modified)
Integrated the new BarcodeScanner component alongside existing scanning methods:
- Added native scanner state management
- Connected scanner to part lookup flow
- Maintained backward compatibility with legacy html5-qrcode scanner

## Browser Compatibility

### Supported Browsers (BarcodeDetector API)
- Chrome 83+ (desktop and Android)
- Edge 83+
- Opera 69+
- Samsung Internet 13.0+

### Fallback Support
For browsers without BarcodeDetector API, the component displays a helpful message and the legacy html5-qrcode scanner remains available.

### Checking Support Programmatically
```typescript
if ('BarcodeDetector' in window) {
  const formats = await window.BarcodeDetector.getSupportedFormats();
  console.log('Supported formats:', formats);
}
```

## Usage

### Basic Implementation

The BarcodeScanner component is already integrated into the ScanPage. To use it:

1. Navigate to `/scan` page
2. Click "Start Scanner" button
3. Allow camera permissions when prompted
4. Point camera at a barcode containing a valid SKU
5. The scanner will automatically detect and lookup the part

### Component Props

```typescript
interface BarcodeScannerProps {
  onScan: (barcode: string) => void;           // Called when barcode is detected
  onError?: (error: string) => void;           // Called on errors
  isActive: boolean;                            // Controls scanner state
  onToggle: () => void;                         // Toggle scanner on/off
  supportedFormats?: BarcodeFormat[];          // Optional: specify formats
}
```

### Example Integration

```tsx
import { BarcodeScanner } from '../components/BarcodeScanner';

function MyComponent() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (barcode: string) => {
    console.log('Scanned:', barcode);
    // Lookup part by SKU
    const part = await api.getParts(barcode);
    // Navigate to part details
    navigate(`/parts/${part.id}`);
  };

  const handleError = (error: string) => {
    console.error('Scanner error:', error);
  };

  return (
    <BarcodeScanner
      onScan={handleScan}
      onError={handleError}
      isActive={isScanning}
      onToggle={() => setIsScanning(!isScanning)}
      supportedFormats={['ean_13', 'code_128', 'qr_code']}
    />
  );
}
```

## Supported Barcode Formats

The implementation supports the following formats:

| Format | Description | Use Case |
|--------|-------------|----------|
| `ean_13` | European Article Number (13 digits) | Retail products |
| `ean_8` | European Article Number (8 digits) | Small products |
| `code_128` | High-density barcode | General purpose, SKU encoding |
| `qr_code` | Quick Response 2D barcode | URLs, complex data |

Additional formats available (if needed):
- `upc_a`, `upc_e` - Universal Product Code
- `code_39`, `code_93` - Industrial barcodes
- `data_matrix`, `pdf417` - 2D barcodes
- `aztec` - Compact 2D barcode

## Part Lookup Flow

When a barcode is scanned:

1. **Detection**: BarcodeDetector API detects barcode in video stream
2. **Extraction**: Raw value (SKU) is extracted from barcode
3. **Lookup**: API searches for part with matching SKU
4. **Navigation**:
   - If part exists: Navigate to part detail page
   - If not found: Display decoded SKU info with "not in inventory" message
5. **Cleanup**: Camera stream is stopped, resources released

## Camera Permissions

### Desktop
1. Browser prompts for camera permission on first use
2. Permission is remembered for future visits
3. Users can revoke in browser settings

### Mobile
1. iOS Safari: Requires user gesture to request camera
2. Android Chrome: Standard permission prompt
3. Both platforms remember the permission choice

### Handling Permission Denial

The component handles permission denial gracefully:
- Displays clear error message
- Suggests checking browser settings
- Offers alternative input methods (manual entry, USB scanner)

## Performance Optimization

### Scan Frequency
- Native API: Scans every 500ms (2 scans per second)
- Balances detection speed with CPU usage
- Automatically stops after successful detection

### Resource Management
- Camera stream released immediately after scan
- Animation frames cancelled on unmount
- Proper cleanup prevents memory leaks

### Video Quality
The scanner requests optimal video settings:
```typescript
{
  facingMode: { ideal: 'environment' },  // Rear camera on mobile
  width: { ideal: 1920 },                 // High resolution
  height: { ideal: 1080 }                 // 16:9 aspect ratio
}
```

## UI/UX Features

### Visual Feedback
- **Scanning Frame**: Yellow corner brackets indicate scan area
- **Animated Scan Line**: Moving line shows active scanning
- **Status Messages**: Clear feedback for success/error states
- **Format Badges**: Shows supported barcode formats

### Loading States
- Initialization spinner while camera starts
- "Scanning..." indicator during detection
- Success message with detected barcode

### Error States
- Camera permission denied
- BarcodeDetector API not available
- Network errors during part lookup

## Accessibility

### Keyboard Navigation
- `Tab` to focus Start/Stop button
- `Enter` or `Space` to activate button
- Full keyboard control, no mouse required

### Screen Readers
- Descriptive button labels
- Status announcements for scan results
- Error messages properly associated

### Color Contrast
- All text meets WCAG 2.1 AA standards
- Error messages use sufficient contrast
- Icons paired with text labels

## Testing Checklist

- [ ] Camera permissions granted on first use
- [ ] Scanner detects EAN-13 barcodes
- [ ] Scanner detects Code 128 barcodes
- [ ] Scanner detects QR codes
- [ ] Part lookup works for existing SKUs
- [ ] Error shown for non-existent SKUs
- [ ] Camera stops after successful scan
- [ ] Multiple scans work correctly
- [ ] Works on Chrome desktop
- [ ] Works on Chrome Android
- [ ] Fallback message shown in Firefox
- [ ] Legacy scanner still functional
- [ ] Responsive on mobile devices
- [ ] Keyboard navigation works
- [ ] Screen reader announcements work

## Troubleshooting

### "Could not access camera"
**Cause**: Camera permission denied or camera in use by another app
**Solution**:
1. Check browser permissions settings
2. Close other apps using camera
3. Try different browser
4. Use manual SKU entry as alternative

### "BarcodeDetector API not available"
**Cause**: Browser doesn't support the API
**Solution**:
1. Use Chrome 83+ or Edge 83+
2. Use the legacy QR scanner instead
3. Use manual SKU entry
4. Use USB barcode scanner mode

### Barcode not detected
**Cause**: Barcode quality, lighting, or format issues
**Solution**:
1. Ensure good lighting
2. Hold barcode steady and flat
3. Move camera closer/farther
4. Clean barcode if damaged
5. Verify barcode format is supported

### Part not found after scan
**Cause**: SKU not in inventory database
**Solution**:
1. Check if SKU is correct
2. Add part to inventory first
3. Use manual lookup to verify SKU
4. Check for typos in database

## Future Enhancements

Potential improvements for future iterations:

1. **Batch Scanning**: Scan multiple barcodes in sequence
2. **Offline Support**: Cache common SKUs for offline lookup
3. **Barcode Generation**: Generate printable barcodes for new parts
4. **Multi-Camera Support**: Switch between front/rear cameras
5. **Zoom Controls**: Digital zoom for small barcodes
6. **Vibration Feedback**: Haptic feedback on successful scan (mobile)
7. **Sound Effects**: Audio confirmation of scan
8. **Scan History**: Track recently scanned items
9. **Advanced Formats**: Support for Aztec, DataMatrix, PDF417

## API Reference

### BarcodeDetector Constructor

```typescript
const detector = new BarcodeDetector({
  formats: ['ean_13', 'code_128', 'qr_code']
});
```

### Detection Method

```typescript
const barcodes = await detector.detect(imageSource);
// imageSource can be: HTMLVideoElement, HTMLImageElement,
// HTMLCanvasElement, ImageBitmap, or ImageData
```

### Get Supported Formats

```typescript
const formats = await BarcodeDetector.getSupportedFormats();
// Returns: Array<BarcodeFormat>
```

### DetectedBarcode Object

```typescript
{
  boundingBox: DOMRectReadOnly,        // Barcode location
  cornerPoints: Array<{x, y}>,          // Corner coordinates
  format: BarcodeFormat,                // Detected format
  rawValue: string                      // Barcode content (SKU)
}
```

## Resources

- [MDN BarcodeDetector API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API)
- [Shape Detection API Explainer](https://github.com/WICG/shape-detection-api)
- [Can I Use - BarcodeDetector](https://caniuse.com/mdn-api_barcodedetector)
- [W3C Shape Detection API Spec](https://wicg.github.io/shape-detection-api/)

## License

Part of the AutoTraq inventory system for UNC Software Engineering Capstone project.
