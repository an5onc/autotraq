import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
}

export function Barcode({ value, width = 2, height = 60, displayValue = false, fontSize = 12 }: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch {
        // fallback: just show text if encoding fails
      }
    }
  }, [value, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} />;
}
