import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Package, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api, ForecastResult } from '../api/client';

interface StockoutRisk {
  critical: ForecastResult[];
  warning: ForecastResult[];
  moderate: ForecastResult[];
}

interface SeasonalPattern {
  categoryId: number;
  categoryName: string;
  monthlyDemand: Array<{ month: string; demand: number }>;
}

export function ForecastingDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockoutRisk, setStockoutRisk] = useState<StockoutRisk>({
    critical: [],
    warning: [],
    moderate: []
  });
  const [seasonalPatterns, setSeasonalPatterns] = useState<SeasonalPattern[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [riskResponse, patternsResponse, summaryResponse] = await Promise.all([
        api.getStockoutRisk(),
        api.getAllSeasonalPatterns(),
        api.getForecastingDashboard()
      ]);

      // Organize stockout risk by severity
      setStockoutRisk({
        critical: riskResponse.parts.filter((p) => p.daysUntilStockout <= 7),
        warning: riskResponse.parts.filter((p) => p.daysUntilStockout > 7 && p.daysUntilStockout <= 14),
        moderate: riskResponse.parts.filter((p) => p.daysUntilStockout > 14 && p.daysUntilStockout <= 30)
      });

      setSeasonalPatterns(patternsResponse.patterns);
      setSummary(summaryResponse.summary);

      // Set first category as default
      if (patternsResponse.patterns.length > 0) {
        setSelectedCategory(patternsResponse.patterns[0].categoryId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecasting data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Loading forecast data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  const selectedPattern = seasonalPatterns.find((p) => p.categoryId === selectedCategory);

  // Prepare risk distribution data
  const riskDistribution = [
    { name: 'Critical (0-7 days)', value: stockoutRisk.critical.length, color: '#ef4444' },
    { name: 'Warning (8-14 days)', value: stockoutRisk.warning.length, color: '#f59e0b' },
    { name: 'Moderate (15-30 days)', value: stockoutRisk.moderate.length, color: '#eab308' }
  ].filter((item) => item.value > 0);

  // Prepare trend breakdown data
  const trendData = [
    { name: 'Increasing', value: summary?.trendBreakdown.increasing || 0, color: '#10b981' },
    { name: 'Stable', value: summary?.trendBreakdown.stable || 0, color: '#6366f1' },
    { name: 'Decreasing', value: summary?.trendBreakdown.decreasing || 0, color: '#f87171' }
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Forecasting</h1>
          <p className="text-slate-400 mt-1">Predict stockouts and optimize reorder quantities</p>
        </div>
      </div>

      {/* Key Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Parts Analyzed</p>
                <p className="text-2xl font-bold text-white mt-2">{summary.totalParts}</p>
              </div>
              <Package className="w-8 h-8 text-slate-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-400 text-sm">Critical (0-7 days)</p>
                <p className="text-2xl font-bold text-red-300 mt-2">{summary.criticalParts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-400 text-sm">At Risk (30 days)</p>
                <p className="text-2xl font-bold text-amber-300 mt-2">{summary.partsAtRisk30Days}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">Forecast Confidence</p>
                <p className="text-2xl font-bold text-emerald-400 mt-2">{(summary.avgConfidence * 100).toFixed(0)}%</p>
              </div>
              <Activity className="w-8 h-8 text-slate-500" />
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stockout Risk Distribution */}
        {riskDistribution.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Stockout Risk (Next 30 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Demand Trend Breakdown */}
        {trendData.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Demand Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trendData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Critical Parts at Risk */}
      {stockoutRisk.critical.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Critical Parts - Immediate Action Required
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-500/20">
                  <th className="text-left py-3 px-4 text-red-300 font-semibold">SKU</th>
                  <th className="text-left py-3 px-4 text-red-300 font-semibold">Name</th>
                  <th className="text-right py-3 px-4 text-red-300 font-semibold">Stock</th>
                  <th className="text-right py-3 px-4 text-red-300 font-semibold">Daily Avg</th>
                  <th className="text-right py-3 px-4 text-red-300 font-semibold">Days Left</th>
                  <th className="text-right py-3 px-4 text-red-300 font-semibold">Reorder Qty</th>
                </tr>
              </thead>
              <tbody>
                {stockoutRisk.critical.slice(0, 10).map((part) => (
                  <tr key={part.partId} className="border-b border-red-500/10 hover:bg-red-500/5 transition-colors">
                    <td className="py-3 px-4 text-red-400 font-mono">{part.sku}</td>
                    <td className="py-3 px-4 text-white truncate">{part.name}</td>
                    <td className="py-3 px-4 text-right text-red-300">{part.currentStock}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{part.averageDailySales.toFixed(1)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block bg-red-500/20 text-red-300 rounded px-2 py-1">
                        {part.daysUntilStockout} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">{part.reorderQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning Parts */}
      {stockoutRisk.warning.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-amber-300 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Warning - Review Reorder Points
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-500/20">
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold">SKU</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold">Name</th>
                  <th className="text-right py-3 px-4 text-amber-300 font-semibold">Days Until Stockout</th>
                  <th className="text-right py-3 px-4 text-amber-300 font-semibold">Reorder Point</th>
                  <th className="text-right py-3 px-4 text-amber-300 font-semibold">Recommended Qty</th>
                </tr>
              </thead>
              <tbody>
                {stockoutRisk.warning.slice(0, 10).map((part) => (
                  <tr key={part.partId} className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors">
                    <td className="py-3 px-4 text-amber-400 font-mono">{part.sku}</td>
                    <td className="py-3 px-4 text-white truncate">{part.name}</td>
                    <td className="py-3 px-4 text-right text-amber-300">{part.daysUntilStockout} days</td>
                    <td className="py-3 px-4 text-right text-slate-300">{part.reorderPoint}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">{part.reorderQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seasonal Demand Patterns */}
      {seasonalPatterns.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Seasonal Demand Patterns
            </h2>
            {seasonalPatterns.length > 1 && (
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              >
                {seasonalPatterns.map((pattern) => (
                  <option key={pattern.categoryId} value={pattern.categoryId}>
                    {pattern.categoryName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedPattern && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedPattern.monthlyDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="demand" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Reorder Summary */}
      {summary && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Reorder Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-slate-400 text-sm">Total Quantity to Reorder</p>
              <p className="text-2xl font-bold text-white mt-2">{summary.totalReorderQtyNeeded}</p>
              <p className="text-slate-500 text-xs mt-2">Based on lead times and safety stock</p>
            </div>
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-slate-400 text-sm">Lead Time (Days)</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">7</p>
              <p className="text-slate-500 text-xs mt-2">Average supplier lead time</p>
            </div>
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-slate-400 text-sm">Safety Stock (Days)</p>
              <p className="text-2xl font-bold text-emerald-400 mt-2">5</p>
              <p className="text-slate-500 text-xs mt-2">Buffer for demand variability</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-slate-500 text-xs border-t border-slate-700/50 pt-4">
        <p>Forecasts use simple moving average and trend analysis on the last 90 days of sales data.</p>
        <p className="mt-1">Confidence score reflects data consistency. Higher values indicate more reliable predictions.</p>
      </div>
    </div>
  );
}
