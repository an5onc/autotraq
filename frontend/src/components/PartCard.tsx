import { Part, StockLocation } from '../api/client';
import { ConditionBadge } from './ConditionBadge';
import { MapPin, Eye, QrCode } from 'lucide-react';

interface PartCardProps {
  part: Part;
  onViewPart: (partId: number) => void;
  onShowBarcode?: (sku: string, barcode: string) => void;
}

export function PartCard({ part, onViewPart, onShowBarcode }: PartCardProps) {
  const formatPrice = (cents: number | null | undefined) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStockColor = (qty: number) => {
    if (qty === 1) return 'text-red-400 bg-red-500/10';
    if (qty <= 3) return 'text-amber-400 bg-amber-500/10';
    return 'text-green-400 bg-green-500/10';
  };

  const isOutOfStock = !part.stockOnHand || part.stockOnHand === 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
      {/* Top row: Condition, Type badges, SKU */}
      <div className="flex items-center gap-3 mb-3">
        <ConditionBadge condition={part.condition || 'UNKNOWN'} />

        {part.isOem && (
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded">
            OEM
          </span>
        )}

        {part.partType && part.partType !== 'Aftermarket' && (
          <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded">
            {part.partType}
          </span>
        )}

        <span className="ml-auto font-mono text-xs text-slate-500">
          SKU: {part.sku}
        </span>
      </div>

      {/* Part name */}
      <h3 className="text-lg font-bold text-white mb-2">
        {part.name}
      </h3>

      {/* Description */}
      {part.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {part.description}
        </p>
      )}

      {/* Price row */}
      <div className="flex items-baseline gap-4 mb-4">
        {part.retailPriceCents ? (
          <>
            <span className="text-2xl font-bold text-amber-400">
              {formatPrice(part.retailPriceCents)}
            </span>
            {part.costCents && (
              <span className="text-sm text-slate-500">
                Cost: {formatPrice(part.costCents)}
              </span>
            )}
          </>
        ) : part.costCents ? (
          <span className="text-lg font-semibold text-slate-300">
            Cost: {formatPrice(part.costCents)}
          </span>
        ) : (
          <span className="text-sm text-slate-500">No pricing info</span>
        )}
      </div>

      {/* Stock & Location info */}
      {isOutOfStock ? (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <span className="text-red-400 font-semibold">Out of Stock</span>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Stock Locations
          </div>
          {part.stockLocations && part.stockLocations.length > 0 ? (
            part.stockLocations.map((location: StockLocation) => (
              <div
                key={location.locationId}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-white">
                    {location.locationName}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStockColor(location.quantity)}`}>
                    {location.quantity} in stock
                  </span>
                </div>
                {location.distanceMiles !== undefined && (
                  <span className="text-sm text-slate-400">
                    {location.distanceMiles} mi
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No location data</div>
          )}
        </div>
      )}

      {/* Bottom row: Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
        <button
          onClick={() => onViewPart(part.id)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Part
        </button>
        {isOutOfStock && (
          <button
            onClick={() => onViewPart(part.id)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors"
            title="Add stock to this part"
          >
            + Add Stock
          </button>
        )}

        {part.barcodeData && onShowBarcode && (
          <button
            onClick={() => onShowBarcode(part.sku, part.barcodeData!)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Barcode
          </button>
        )}

        {part.fitments && part.fitments.length > 0 && (
          <span className="ml-auto text-xs text-slate-500">
            Fits {part.fitments.length} vehicle{part.fitments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}