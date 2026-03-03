import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, LowStockAlert } from '../api/client';
import { AlertTriangle, X, Package, MapPin } from 'lucide-react';

interface LowStockAlertPanelProps {
  onClose?: () => void;
}

export function LowStockAlertPanel({ onClose }: LowStockAlertPanelProps) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const response = await api.getLowStockAlerts();
      setAlerts(response.alerts);
    } catch (error) {
      console.error('Failed to load low stock alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  function dismissAlert(partId: number) {
    setDismissedAlerts(prev => new Set([...prev, partId]));
    // Optionally call the API to persist dismissal
    api.dismissLowStockAlert(partId).catch(console.error);
  }

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.partId));

  if (loading) {
    return null; // Silent loading for dashboard
  }

  if (visibleAlerts.length === 0) {
    return null; // No alerts to show
  }

  const criticalAlerts = visibleAlerts.filter(a => a.currentQty === 0);
  const warningAlerts = visibleAlerts.filter(a => a.currentQty > 0);
  const displayAlerts = expanded ? visibleAlerts : visibleAlerts.slice(0, 3);

  return (
    <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-800/50 rounded-2xl p-4 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Low Stock Alerts
          </h3>
          {criticalAlerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {criticalAlerts.length} Critical
            </span>
          )}
          {warningAlerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
              {warningAlerts.length} Warning
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Hide alert panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayAlerts.map((alert) => (
          <div
            key={alert.partId}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              alert.currentQty === 0
                ? 'bg-red-900/20 border-red-800/50'
                : 'bg-orange-900/20 border-orange-800/50'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Package className={`w-4 h-4 ${alert.currentQty === 0 ? 'text-red-400' : 'text-orange-400'}`} />
                <Link
                  to={`/parts/${alert.partId}`}
                  className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                >
                  {alert.sku} — {alert.name}
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-1 ml-7">
                <span className={`text-xs font-bold ${
                  alert.currentQty === 0 ? 'text-red-400' : 'text-orange-400'
                }`}>
                    {alert.currentQty} / {alert.minStock} units
                </span>
                {(alert as any).suggestedReorder > 0 && (
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                    Order {(alert as any).suggestedReorder}
                  </span>
                )}
                {(alert as any).avgMonthlyUsage > 0 && (
                  <span className="text-xs text-slate-500">~{(alert as any).avgMonthlyUsage}/mo</span>
                )}
                {alert.locations.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {alert.locations.map(loc => `${loc.locationName}: ${loc.qty}`).join(', ')}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.partId)}
              className="ml-4 text-slate-500 hover:text-slate-300 transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {visibleAlerts.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {expanded ? 'Show less' : `Show ${visibleAlerts.length - 3} more alerts`}
        </button>
      )}

      <div className="mt-3 pt-3 border-t border-slate-800/50">
        <Link
          to="/inventory"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View inventory to restock →
        </Link>
      </div>
    </div>
  );
}