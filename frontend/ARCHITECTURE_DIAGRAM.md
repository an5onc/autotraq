# BarcodeScanner Component Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                          ScanPage                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Scan Mode Toggle (Navigate / Fulfill Request)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              BarcodeScanner Component                      │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Header                                              │ │  │
│  │  │  - Title: "Barcode Scanner"                         │ │  │
│  │  │  - API Status: "Native API (4 formats supported)"   │ │  │
│  │  │  - Toggle Button: "Start Scanner" / "Stop Scanner" │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Status Messages                                     │ │  │
│  │  │  - Error: Camera permission denied                  │ │  │
│  │  │  - Success: Barcode detected (FD-MUS-24-ENBL)      │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Video Preview (when active)                        │ │  │
│  │  │  ┌────────────────────────────────────────────────┐ │ │  │
│  │  │  │  <video> element                                │ │ │  │
│  │  │  │  ┌────────────────────────────────────────────┐ │ │ │  │
│  │  │  │  │  Scanning Overlay                          │ │ │ │  │
│  │  │  │  │  ┌──────────────────────────────────────┐  │ │ │ │  │
│  │  │  │  │  │  Corner Brackets (yellow)            │  │ │ │ │  │
│  │  │  │  │  │  ┌────────────────────────────────┐  │  │ │ │ │  │
│  │  │  │  │  │  │  Animated Scan Line (yellow)  │  │  │ │ │ │  │
│  │  │  │  │  │  └────────────────────────────────┘  │  │ │ │ │  │
│  │  │  │  │  └──────────────────────────────────────┘  │ │ │ │  │
│  │  │  │  └────────────────────────────────────────────┘ │ │ │  │
│  │  │  └────────────────────────────────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Format Badges (when inactive)                      │ │  │
│  │  │  [EAN 13] [EAN 8] [CODE 128] [QR CODE]            │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  <canvas> (hidden - for fallback detection)               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Legacy QR Scanner (html5-qrcode)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  USB Scanner Mode                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Manual SKU Lookup                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌────────────────┐
│  User Action   │
│  Click "Start" │
└────────┬───────┘
         │
         v
┌────────────────────────┐
│  Request Camera        │
│  getUserMedia()        │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐         ┌──────────────────┐
│  Initialize Stream     │────────>│  Permission      │
│  videoRef.srcObject    │         │  Granted/Denied  │
└────────┬───────────────┘         └──────────────────┘
         │
         v
┌────────────────────────┐
│  Create Detector       │
│  new BarcodeDetector() │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐
│  Start Scan Loop       │
│  setInterval(500ms)    │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐
│  Detect Barcode        │
│  detector.detect()     │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐         ┌──────────────────┐
│  Barcode Found?        │────NO──>│  Continue        │
│                        │         │  Scanning        │
└────────┬───────────────┘         └──────────────────┘
         │ YES
         v
┌────────────────────────┐
│  Call onScan()         │
│  onScan(rawValue)      │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐
│  Parent: Lookup Part   │
│  api.getParts(sku)     │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐         ┌──────────────────┐
│  Part Found?           │────NO──>│  Try Decode SKU  │
│                        │         │  api.lookupSku() │
└────────┬───────────────┘         └──────────────────┘
         │ YES
         v
┌────────────────────────┐
│  Navigate to Part      │
│  /parts/{id}           │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐
│  Stop Camera           │
│  stream.getTracks()    │
│  .forEach(t.stop())    │
└────────────────────────┘
```

## State Management

```
┌────────────────────────────────────────────────────────────┐
│                    BarcodeScanner State                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  hasBarcodeDetector: boolean                               │
│  - Checked on mount                                        │
│  - Result of 'BarcodeDetector' in window                  │
│                                                             │
│  isInitializing: boolean                                   │
│  - true: Camera starting, show spinner                     │
│  - false: Camera ready or inactive                         │
│                                                             │
│  detectorReady: boolean                                    │
│  - true: Can start scanning                                │
│  - false: Not ready or stopped                             │
│                                                             │
│  lastScan: string | null                                   │
│  - Last detected barcode value                             │
│  - Auto-clears after 3 seconds                             │
│                                                             │
│  cameraError: string | null                                │
│  - Error message from camera/permissions                   │
│  - null when no error                                      │
│                                                             │
│  detectedFormats: BarcodeFormat[]                          │
│  - Formats supported by browser                            │
│  - From BarcodeDetector.getSupportedFormats()             │
│                                                             │
├────────────────────────────────────────────────────────────┤
│                         Refs                                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  videoRef: HTMLVideoElement                                │
│  - Reference to video element                              │
│  - Used for camera stream and detection                    │
│                                                             │
│  canvasRef: HTMLCanvasElement                              │
│  - Hidden canvas for fallback                              │
│  - Not used when native API available                      │
│                                                             │
│  streamRef: MediaStream                                    │
│  - Active camera stream                                    │
│  - Stopped on unmount or after scan                        │
│                                                             │
│  animationFrameRef: number                                 │
│  - requestAnimationFrame ID                                │
│  - Cancelled on cleanup                                    │
│                                                             │
│  scanIntervalRef: number                                   │
│  - setInterval ID for scanning loop                        │
│  - Cleared on cleanup                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Props Interface

```typescript
interface BarcodeScannerProps {
  // Required
  onScan: (barcode: string) => void
  // Called when barcode successfully detected
  // Receives raw barcode value (SKU)

  isActive: boolean
  // Controls whether scanner is active
  // true: Camera on, scanning
  // false: Camera off, idle

  onToggle: () => void
  // Called when user clicks start/stop button
  // Parent should flip isActive state

  // Optional
  onError?: (error: string) => void
  // Called when errors occur
  // Receives user-friendly error message

  supportedFormats?: BarcodeFormat[]
  // Array of barcode formats to detect
  // Default: ['ean_13', 'ean_8', 'code_128', 'qr_code']
}
```

## Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Event Timeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  t=0ms      Component Mounts                                   │
│             └─> Check BarcodeDetector availability             │
│                                                                 │
│  t=100ms    User clicks "Start Scanner"                        │
│             └─> onToggle() called                              │
│             └─> Parent sets isActive = true                    │
│                                                                 │
│  t=150ms    useEffect detects isActive change                  │
│             └─> startCamera() called                           │
│             └─> setIsInitializing(true)                        │
│                                                                 │
│  t=200ms    getUserMedia() request sent                        │
│             └─> Browser shows permission prompt               │
│                                                                 │
│  t=1000ms   User grants permission                             │
│             └─> MediaStream received                           │
│             └─> videoRef.srcObject = stream                    │
│                                                                 │
│  t=1200ms   Video metadata loaded                              │
│             └─> video.play() called                            │
│             └─> setDetectorReady(true)                         │
│             └─> setIsInitializing(false)                       │
│                                                                 │
│  t=1300ms   Scanning starts                                    │
│             └─> setInterval begins (500ms)                     │
│                                                                 │
│  t=1800ms   First scan attempt                                 │
│             └─> detector.detect(video)                         │
│             └─> No barcode found                               │
│                                                                 │
│  t=2300ms   Second scan attempt                                │
│             └─> detector.detect(video)                         │
│             └─> No barcode found                               │
│                                                                 │
│  t=2800ms   Third scan attempt                                 │
│             └─> detector.detect(video)                         │
│             └─> Barcode detected!                              │
│             └─> setLastScan(barcode.rawValue)                  │
│             └─> onScan(barcode.rawValue)                       │
│             └─> stopCamera()                                   │
│             └─> onToggle()                                     │
│                                                                 │
│  t=2850ms   Parent receives barcode                            │
│             └─> lookupAndNavigate(barcode)                     │
│             └─> api.getParts(barcode)                          │
│                                                                 │
│  t=3000ms   API response received                              │
│             └─> Part found                                     │
│             └─> navigate(`/parts/${id}`)                       │
│                                                                 │
│  t=5800ms   Success message auto-clears                        │
│             └─> setLastScan(null)                              │
│                                                                 │
│  Component Unmount                                              │
│             └─> stopCamera() called                            │
│             └─> stream.getTracks().forEach(t => t.stop())      │
│             └─> clearInterval(scanIntervalRef)                 │
│             └─> cancelAnimationFrame(animationFrameRef)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## CSS Animation

```
┌────────────────────────────────────────────────────────────┐
│              Scanning Overlay Animation                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Frame (yellow border with corner brackets)                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │    ▼  ←─── Scan line starts at top (opacity: 0)     │ │
│  │                                                       │ │
│  │         ▼  ←─── Moves down (opacity increases)       │ │
│  │                                                       │ │
│  │              ▼  ←─── Middle (opacity: 1)             │ │
│  │                                                       │ │
│  │                   ▼  ←─── Continues down             │ │
│  │                                                       │ │
│  │                        ▼  ←─── Bottom (opacity: 0)   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Animation: scanLine 2s ease-in-out infinite               │
│  - 0%: top, opacity 0                                      │
│  - 50%: middle, opacity 1                                  │
│  - 100%: bottom (translateY: 128px), opacity 0             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Browser Compatibility Check

```
┌─────────────────────────────────────────────────────────────┐
│              Component Mount Sequence                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  useEffect(() => {                                          │
│    if ('BarcodeDetector' in window) {                       │
│      // ✅ Chrome, Edge, Opera, Samsung Internet           │
│      BarcodeDetector.getSupportedFormats()                  │
│        .then(formats => {                                   │
│          setHasBarcodeDetector(true)                        │
│          setDetectedFormats(formats)                        │
│        })                                                    │
│    } else {                                                  │
│      // ❌ Firefox, Safari                                  │
│      setHasBarcodeDetector(false)                           │
│      // Component shows fallback message                    │
│    }                                                         │
│  }, [])                                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌────────────────────────────────────────────────────────────┐
│                  ScanPage Integration                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  State:                                                     │
│  ├─ nativeScannerActive: boolean                           │
│  ├─ scanMode: 'navigate' | 'fulfill'                       │
│  └─ error: string                                           │
│                                                             │
│  Handlers:                                                  │
│  ├─ handleNativeScan(barcode)                              │
│  │  └─> lookupAndNavigate(barcode)                        │
│  │      ├─ Navigate mode: go to part detail              │
│  │      └─ Fulfill mode: fulfill request                  │
│  │                                                          │
│  ├─ handleNativeScanError(error)                           │
│  │  └─> setError(error)                                   │
│  │                                                          │
│  └─ toggleNativeScanner()                                  │
│     └─> setNativeScannerActive(!nativeScannerActive)      │
│     └─> stopScanner() // stop legacy if active            │
│                                                             │
│  Component Usage:                                           │
│  <BarcodeScanner                                            │
│    onScan={handleNativeScan}                               │
│    onError={handleNativeScanError}                         │
│    isActive={nativeScannerActive}                          │
│    onToggle={toggleNativeScanner}                          │
│    supportedFormats={['ean_13', 'ean_8',                   │
│                      'code_128', 'qr_code']}              │
│  />                                                         │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Memory Management

```
┌────────────────────────────────────────────────────────────┐
│                  Cleanup Flow                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  useEffect cleanup (when isActive changes to false):       │
│  └─> stopCamera()                                          │
│      ├─> cancelAnimationFrame(animationFrameRef.current)  │
│      ├─> clearInterval(scanIntervalRef.current)           │
│      ├─> stream.getTracks().forEach(track =>              │
│      │                       track.stop())                 │
│      ├─> videoRef.current.srcObject = null                │
│      ├─> streamRef.current = null                         │
│      ├─> setDetectorReady(false)                          │
│      └─> setCameraError(null)                             │
│                                                             │
│  Component unmount:                                         │
│  └─> useEffect return function                            │
│      └─> stopCamera() (ensures cleanup)                   │
│                                                             │
│  No memory leaks:                                           │
│  ✅ MediaStream tracks stopped                             │
│  ✅ Animation frames cancelled                             │
│  ✅ Intervals cleared                                      │
│  ✅ Event listeners removed                                │
│  ✅ Refs nullified                                         │
│                                                             │
└────────────────────────────────────────────────────────────┘
```
