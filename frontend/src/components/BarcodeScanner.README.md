# BarcodeScanner Component - Quick Reference

## Import

```tsx
import { BarcodeScanner } from '../components/BarcodeScanner';
```

## Basic Usage

```tsx
function MyPage() {
  const [isActive, setIsActive] = useState(false);

  return (
    <BarcodeScanner
      onScan={(barcode) => console.log('Scanned:', barcode)}
      isActive={isActive}
      onToggle={() => setIsActive(!isActive)}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onScan` | `(barcode: string) => void` | Yes | Callback when barcode detected |
| `onError` | `(error: string) => void` | No | Callback for error handling |
| `isActive` | `boolean` | Yes | Controls scanner active state |
| `onToggle` | `() => void` | Yes | Toggle scanner on/off |
| `supportedFormats` | `BarcodeFormat[]` | No | Barcode formats to detect |

## Supported Formats

Default formats: `['ean_13', 'ean_8', 'code_128', 'qr_code']`

All available formats:
- `ean_13` - European Article Number (13 digits)
- `ean_8` - European Article Number (8 digits)
- `code_128` - High-density linear barcode
- `code_39` - Alphanumeric barcode
- `code_93` - Improved Code 39
- `upc_a` - Universal Product Code
- `upc_e` - UPC compressed format
- `qr_code` - Quick Response 2D code
- `data_matrix` - 2D barcode
- `pdf417` - Stacked linear barcode
- `aztec` - Compact 2D barcode
- `codabar` - Numeric barcode

## Browser Support

### Full Support
- Chrome 83+
- Edge 83+
- Opera 69+
- Samsung Internet 13.0+

### No Support (Shows Error Message)
- Firefox (all versions as of 2025)
- Safari (all versions as of 2025)

## Features

### Automatic Detection
- Scans every 500ms when active
- Auto-stops after successful detection
- Cleans up camera resources automatically

### Visual Feedback
- Live camera preview
- Scanning frame overlay
- Animated scan line
- Status messages (initializing, error, success)

### Error Handling
- Camera permission denied
- API not supported
- Camera not available
- Network errors

## Component States

### Inactive
- Shows format badges
- Camera icon displayed
- "Start Scanner" button enabled

### Initializing
- Shows spinner
- "Initializing..." text
- Button disabled

### Active
- Live video preview
- Scanning overlay with animation
- "Stop Scanner" button

### Error
- Error icon and message
- Suggested solutions
- "Start Scanner" button re-enabled

### Success
- Green checkmark
- Detected barcode value
- Auto-dismisses after 3 seconds

## Accessibility

- Keyboard navigable (Tab, Enter, Space)
- Screen reader announcements
- High contrast colors
- Clear error messages
- No mouse required

## Performance

- Video resolution: 1920x1080 (ideal)
- Scan frequency: 2 scans per second
- Auto cleanup on unmount
- No memory leaks

## Example: Advanced Usage

```tsx
function AdvancedScanner() {
  const [isActive, setIsActive] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

  const handleScan = async (barcode: string) => {
    setLastBarcode(barcode);

    try {
      // Lookup part in database
      const result = await api.getParts(barcode);

      if (result.parts.length > 0) {
        // Navigate to part details
        navigate(`/parts/${result.parts[0].id}`);
      } else {
        // Try to decode SKU
        const decoded = await api.lookupSku(barcode);
        console.log('Decoded:', decoded);
      }
    } catch (error) {
      console.error('Lookup failed:', error);
    }
  };

  const handleError = (error: string) => {
    toast.error(`Scanner error: ${error}`);
  };

  return (
    <div>
      <BarcodeScanner
        onScan={handleScan}
        onError={handleError}
        isActive={isActive}
        onToggle={() => setIsActive(!isActive)}
        supportedFormats={[
          'ean_13',
          'ean_8',
          'code_128',
          'qr_code',
          'upc_a'
        ]}
      />

      {lastBarcode && (
        <div className="mt-4">
          Last scanned: <code>{lastBarcode}</code>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Camera not starting
1. Check browser permissions
2. Close other apps using camera
3. Try different browser
4. Check if HTTPS (required for getUserMedia)

### Barcode not detected
1. Ensure good lighting
2. Hold barcode steady
3. Verify format is supported
4. Check barcode quality (not damaged)

### Performance issues
1. Close other resource-intensive apps
2. Reduce scan frequency (modify component)
3. Lower video resolution
4. Use fewer supported formats

## Integration with AutoTraq

The component is integrated into `/pages/ScanPage.tsx`:

```tsx
// ScanPage.tsx
const [nativeScannerActive, setNativeScannerActive] = useState(false);

const handleNativeScan = async (barcode: string) => {
  await lookupAndNavigate(barcode);
};

return (
  <BarcodeScanner
    onScan={handleNativeScan}
    onError={setError}
    isActive={nativeScannerActive}
    onToggle={() => setNativeScannerActive(!nativeScannerActive)}
    supportedFormats={['ean_13', 'ean_8', 'code_128', 'qr_code']}
  />
);
```

## Related Components

- **Legacy Scanner**: `html5-qrcode` based (fallback for unsupported browsers)
- **USB Scanner**: Keyboard input mode for USB handheld scanners
- **Manual Entry**: Text input for manual SKU lookup

## Type Definitions

See `/src/types/barcode.d.ts` for complete TypeScript definitions.

## Resources

- [Component Implementation](./BarcodeScanner.tsx)
- [Type Definitions](../types/barcode.d.ts)
- [Full Documentation](../../BARCODE_SCANNER.md)
- [MDN API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API)
