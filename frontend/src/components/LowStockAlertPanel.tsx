import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, LowStockAlert } from '../api/client';
import { AlertTriangle, X, ChevronDown, ChevronUp, Package } from 'lucide-react';

export function LowStockAlertPanel() {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.getLowStockAlerts()
      .then(r => setAlerts(r.alerts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || dismissed) return null;

  const visible = alerts.filter(a => !dismissedIds.has(a.partId));
  if (visible.length === 0) return null;

  const critical = visible.filter(a => a.currentQty === 0);
  const warning  = visible.filter(a => a.currentQty > 0);

  // Only show top 5 in expanded view
  const shown = expanded ? visible.slice(0, 10) : [];

  const dismissOne = (partId: number) => {
    api.dismissLowStockAlert(partId).catch(() => {});
    setDismissedIds(prev => new Set([...prev, partId]));
  };

  return (
    <div className={`border rounded-xl mb-6 overflow-hidden transition-all ${
      critical.length > 0
        ? 'bg-red-500/5 border-red-500/20'
        : 'bg-amber-500/5 border-amber-500/20'
    }`}>
      {/* Compact header row */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <AlertTriangle className={`w-4 h-4 shrink-0 ${critical.length > 0 ? 'text-red-400' : 'text-amber-400'}`} />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">Low Stock</span>

          {critical.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/20">
              {critical.length} out of stock
            </span>
          )}
          {warning.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {warning.length} low
            </span>
          )}

          <Link
            to="/inventory?view=low-stock"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-1"
          >
            View all →
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
            title="Dismiss for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded list */}
      {expanded && (
        <div className="border-t border-slate-800/50 divide-y divide-slate-800/30">
          {shown.map(alert => (
            <div key={alert.partId} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/20 transition-colors">
              <Package className={`w-4 h-4 shrink-0 ${alert.currentQty === 0 ? 'text-red-400' : 'text-amber-400'}`} />
              <Link
                to={`/parts/${alert.partId}`}
                className="flex-1 min-w-0 text-sm text-white hover:text-amber-400 transition-colors truncate"
              >
                {alert.sku} — {alert.name}
              </Link>
              <span className={`text-xs font-bold shrink-0 ${alert.currentQty === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                {alert.currentQty} / {alert.minStock}
              </span>
              <button
                onClick={() => dismissOne(alert.partId)}
                className="p-1 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {visible.length > 10 && (
            <div className="px-5 py-3 text-xs text-slate-500">
              +{visible.length - 10} more ·{' '}
              <Link to="/inventory?view=low-stock" className="text-amber-400 hover:text-amber-300">
                View all in inventory
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
