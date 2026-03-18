/**
 * BarcodeScanner Component Test Examples
 *
 * Note: This is an example test file showing how to test the BarcodeScanner component.
 * To use this, you'll need to install testing dependencies:
 *
 * npm install --save-dev @testing-library/react @testing-library/jest-dom
 * npm install --save-dev @testing-library/user-event vitest jsdom
 */

// Uncomment to use with actual testing framework:
/*
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarcodeScanner } from './BarcodeScanner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock MediaDevices API
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock BarcodeDetector API
class MockBarcodeDetector {
  constructor(public options?: { formats?: string[] }) {}

  static async getSupportedFormats() {
    return ['ean_13', 'ean_8', 'code_128', 'qr_code'];
  }

  async detect(_source: HTMLVideoElement) {
    return [
      {
        boundingBox: new DOMRectReadOnly(0, 0, 100, 100),
        cornerPoints: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        format: 'ean_13',
        rawValue: 'FD-MUS-24-ENBL',
      },
    ];
  }
}

(global.window as any).BarcodeDetector = MockBarcodeDetector;

describe('BarcodeScanner', () => {
  const mockOnScan = vi.fn();
  const mockOnError = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful camera access
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as any);
  });

  it('renders in inactive state', () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText(/Start Scanner/i)).toBeInTheDocument();
    expect(screen.getByText(/Native API/i)).toBeInTheDocument();
  });

  it('shows supported formats', () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={false}
        onToggle={mockOnToggle}
        supportedFormats={['ean_13', 'code_128']}
      />
    );

    expect(screen.getByText(/EAN 13/i)).toBeInTheDocument();
    expect(screen.getByText(/CODE 128/i)).toBeInTheDocument();
  });

  it('requests camera permission when activated', async () => {
    const { rerender } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={false}
        onToggle={mockOnToggle}
      />
    );

    rerender(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    });
  });

  it('shows error when camera permission denied', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(
      <BarcodeScanner
        onScan={mockOnScan}
        onError={mockOnError}
        isActive={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
    });
  });

  it('calls onScan when barcode detected', async () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('FD-MUS-24-ENBL');
    }, { timeout: 3000 });
  });

  it('stops camera after successful scan', async () => {
    const stopMock = vi.fn();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: stopMock }],
    } as any);

    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(stopMock).toHaveBeenCalled();
      expect(mockOnToggle).toHaveBeenCalled();
    });
  });

  it('cleans up camera stream on unmount', async () => {
    const stopMock = vi.fn();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: stopMock }],
    } as any);

    const { unmount } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    unmount();

    expect(stopMock).toHaveBeenCalled();
  });

  it('shows fallback message when BarcodeDetector not available', () => {
    const originalBarcodeDetector = (global.window as any).BarcodeDetector;
    delete (global.window as any).BarcodeDetector;

    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText(/Fallback mode/i)).toBeInTheDocument();

    (global.window as any).BarcodeDetector = originalBarcodeDetector;
  });

  it('handles toggle button click', async () => {
    const user = userEvent.setup();

    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={false}
        onToggle={mockOnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /Start Scanner/i });
    await user.click(button);

    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('disables button while initializing', async () => {
    mockGetUserMedia.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={true}
        onToggle={mockOnToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
  });

  it('respects custom supported formats', async () => {
    const customFormats = ['qr_code', 'data_matrix'];

    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={false}
        onToggle={mockOnToggle}
        supportedFormats={customFormats}
      />
    );

    expect(screen.getByText(/QR CODE/i)).toBeInTheDocument();
    expect(screen.getByText(/DATA MATRIX/i)).toBeInTheDocument();
  });

  it('displays last scanned barcode temporarily', async () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        isActive={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Barcode Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/FD-MUS-24-ENBL/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('BarcodeScanner Accessibility', () => {
  it('has accessible button', () => {
    render(
      <BarcodeScanner
        onScan={vi.fn()}
        isActive={false}
        onToggle={vi.fn()}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName();
  });

  it('announces errors to screen readers', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Camera not found'));

    render(
      <BarcodeScanner
        onScan={vi.fn()}
        onError={vi.fn()}
        isActive={true}
        onToggle={vi.fn()}
      />
    );

    await waitFor(() => {
      const errorMessage = screen.getByText(/Camera not found/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('provides visual feedback for scanner state', () => {
    const { rerender } = render(
      <BarcodeScanner
        onScan={vi.fn()}
        isActive={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText(/Start Scanner/i)).toBeInTheDocument();

    rerender(
      <BarcodeScanner
        onScan={vi.fn()}
        isActive={true}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText(/Stop Scanner/i)).toBeInTheDocument();
  });
});

describe('BarcodeScanner Integration', () => {
  it('integrates with part lookup flow', async () => {
    const mockLookupPart = vi.fn().mockResolvedValue({
      parts: [{ id: 123, sku: 'FD-MUS-24-ENBL', name: 'Test Part' }]
    });

    const handleScan = async (barcode: string) => {
      const result = await mockLookupPart(barcode);
      console.log('Found part:', result.parts[0]);
    };

    render(
      <BarcodeScanner
        onScan={handleScan}
        isActive={true}
        onToggle={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mockLookupPart).toHaveBeenCalledWith('FD-MUS-24-ENBL');
    }, { timeout: 3000 });
  });
});
*/

export {}; // Make this a module

/**
 * Manual Testing Checklist
 *
 * Browser Compatibility:
 * □ Test in Chrome 83+ (should work)
 * □ Test in Edge 83+ (should work)
 * □ Test in Firefox (should show fallback message)
 * □ Test in Safari (should show fallback message)
 *
 * Camera Permissions:
 * □ Grant permission - scanner should start
 * □ Deny permission - should show error message
 * □ Revoke permission - should show error on next scan
 *
 * Barcode Detection:
 * □ Scan EAN-13 barcode - should detect
 * □ Scan EAN-8 barcode - should detect
 * □ Scan Code 128 barcode - should detect
 * □ Scan QR code - should detect
 * □ Scan unsupported format - should not detect
 *
 * Part Lookup:
 * □ Scan existing SKU - navigate to part details
 * □ Scan non-existent SKU - show "not found" message
 * □ Scan invalid SKU format - show error
 *
 * User Interface:
 * □ Click "Start Scanner" - camera should start
 * □ Click "Stop Scanner" - camera should stop
 * □ Multiple start/stop cycles - should work correctly
 * □ Success message appears after scan
 * □ Success message disappears after 3 seconds
 *
 * Responsive Design:
 * □ Desktop (1920x1080) - full size preview
 * □ Tablet (768x1024) - scaled preview
 * □ Mobile (375x667) - mobile-optimized
 * □ Portrait orientation - works correctly
 * □ Landscape orientation - works correctly
 *
 * Performance:
 * □ Scanner starts within 2 seconds
 * □ Barcode detected within 1 second
 * □ No memory leaks after multiple scans
 * □ Camera properly released after scan
 *
 * Accessibility:
 * □ Keyboard navigation works (Tab, Enter, Space)
 * □ Screen reader announces states
 * □ Focus visible on button
 * □ Error messages readable by screen reader
 *
 * Error Handling:
 * □ Camera not available - shows error
 * □ Permission denied - shows error with solution
 * □ API not supported - shows fallback message
 * □ Network error during lookup - shows error
 *
 * Integration:
 * □ Works with Navigate mode
 * □ Works with Fulfill Request mode
 * □ Doesn't interfere with USB scanner
 * □ Doesn't interfere with manual entry
 * □ Doesn't interfere with legacy scanner
 */
