import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, ReorderSuggestion, ReorderSummary } from '../api/client';
import {
  Package,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export function ReorderPage() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [summary, setSummary] = useState<ReorderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookbackDays, setLookbackDays] = useState(60);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [showSettings, setShowSettings] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  useEffect(() => {
    loadSuggestions();
  }, [lookbackDays, leadTimeDays]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await api.getReorderSuggestions(lookbackDays, leadTimeDays);
      setSuggestions(data.suggestions);
      setSummary(data.summary);
    } catch (err) {
      toast.error('Failed to load reorder suggestions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-medium">
            <AlertTriangle size={12} />
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/20 text-orange-400 text-xs font-medium">
            <TrendingDown size={12} />
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium">
            <Clock size={12} />
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-500/20 text-slate-400 text-xs font-medium">
            <CheckCircle2 size={12} />
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const filteredSuggestions = priorityFilter === 'ALL'
    ? suggestions
    : suggestions.filter(s => s.priority === priorityFilter);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Reorder Management</h1>
            <p className="text-slate-400 mt-1">
              Smart reorder suggestions based on usage patterns and stock levels
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Calculation Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Lookback Period (days)
                </label>
                <input
                  type="number"
                  min="7"
                  max="180"
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Historical period to analyze usage patterns
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Expected delivery time for orders
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Critical Priority</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{summary.criticalCount}</p>
                </div>
                <AlertTriangle className="text-red-400" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">High Priority</p>
                  <p className="text-3xl font-bold text-orange-400 mt-1">{summary.highCount}</p>
                </div>
                <TrendingDown className="text-orange-400" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Total Parts</p>
                  <p className="text-3xl font-bold text-amber-400 mt-1">{summary.totalPartsNeedingReorder}</p>
                </div>
                <Package className="text-amber-400" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Est. Cost</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">
                    ${summary.totalReorderCost.toFixed(0)}
                  </p>
                </div>
                <DollarSign className="text-emerald-400" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Priority Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400">Filter by priority:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                priorityFilter === priority
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>

        {/* Suggestions Table */}
        {filteredSuggestions.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={48} />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">All Stock Levels Adequate</h3>
            <p className="text-slate-400">
              {priorityFilter === 'ALL'
                ? 'No parts need reordering at this time.'
                : `No parts with ${priorityFilter} priority need reordering.`}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Part
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Current
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Min Stock
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Avg Daily Use
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Days Left
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Suggested Qty
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Est. Cost
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredSuggestions.map((suggestion) => (
                    <tr key={suggestion.partId} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3">
                        {getPriorityBadge(suggestion.priority)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/parts/${suggestion.partId}`}
                          className="text-amber-400 hover:text-amber-300 font-medium"
                        >
                          {suggestion.sku}
                        </Link>
                        <p className="text-sm text-slate-400 truncate max-w-xs">{suggestion.name}</p>
                        <span className="text-xs text-slate-500">{suggestion.condition}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${
                          suggestion.currentStock <= 0 ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {suggestion.currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {suggestion.minStock}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {suggestion.avgDailyUsage.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${
                          suggestion.daysOfStockRemaining < 3
                            ? 'text-red-400'
                            : suggestion.daysOfStockRemaining < 7
                            ? 'text-orange-400'
                            : 'text-slate-300'
                        }`}>
                          {suggestion.daysOfStockRemaining === 999
                            ? '∞'
                            : suggestion.daysOfStockRemaining.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-400">
                          {suggestion.suggestedReorderQty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        ${suggestion.totalReorderCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-slate-500" />
                          <span className="text-sm">{formatDate(suggestion.lastOrderDate)}</span>
                        </div>
                        {suggestion.daysSinceLastOrder !== null && (
                          <p className="text-xs text-slate-500">
                            {suggestion.daysSinceLastOrder} days ago
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/inventory/receive?partId=${suggestion.partId}&qty=${suggestion.suggestedReorderQty}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-md text-sm font-medium transition-colors"
                        >
                          <ArrowDownToLine size={14} />
                          Receive
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-400">
          <p className="mb-1">
            <strong className="text-slate-300">How it works:</strong> Reorder suggestions are calculated using historical usage data from the last {lookbackDays} days.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong className="text-slate-300">Average Daily Usage:</strong> Total fulfilled quantity ÷ lookback period</li>
            <li><strong className="text-slate-300">Days of Stock:</strong> Current stock ÷ average daily usage</li>
            <li><strong className="text-slate-300">Suggested Quantity:</strong> (Min stock × 2) - Current stock + (Avg daily use × {leadTimeDays} day lead time)</li>
            <li><strong className="text-red-400">Critical:</strong> Out of stock or &lt; 3 days remaining</li>
            <li><strong className="text-orange-400">High:</strong> &lt; 7 days remaining</li>
            <li><strong className="text-amber-400">Medium:</strong> &lt; 14 days remaining</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
