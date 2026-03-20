import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api, ScanAnalytics } from '../api/client';
import { BarChart3, TrendingUp, Users, Clock, Activity, Calendar } from 'lucide-react';

export function ScanAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ScanAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const query: any = {};

      if (dateRange !== 'all') {
        const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
        const days = daysMap[dateRange];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query.startDate = startDate.toISOString();
      }

      const data = await api.getScanAnalytics(query);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      NAVIGATE: 'bg-blue-500',
      FULFILL: 'bg-emerald-500',
      LOOKUP: 'bg-amber-500',
      PRINT: 'bg-purple-500',
      INVENTORY: 'bg-cyan-500',
    };
    return colors[action] || 'bg-slate-500';
  };

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Scan Analytics</h1>
            <p className="text-sm text-slate-500 mt-2">
              Track barcode scan activity and usage patterns
            </p>
          </div>

          {/* Date Range Filter */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700 shrink-0">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  dateRange === range
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading analytics...</div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Activity className="w-5 h-5" />}
                title="Total Scans"
                value={analytics.recentScans.length.toString()}
                color="emerald"
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5" />}
                title="Most Active User"
                value={analytics.userActivity[0]?.userName || 'N/A'}
                subtitle={`${analytics.userActivity[0]?.scanCount || 0} scans`}
                color="blue"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Top Scanned Part"
                value={analytics.mostScannedParts[0]?.part?.sku || 'N/A'}
                subtitle={`${analytics.mostScannedParts[0]?.scanCount || 0} scans`}
                color="amber"
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                title="Peak Hour"
                value={
                  analytics.peakHours.length > 0
                    ? formatHour(
                        analytics.peakHours.reduce((max, h) =>
                          h.count > max.count ? h : max
                        ).hour
                      )
                    : 'N/A'
                }
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Scanned Parts */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Most Scanned Parts</h2>
                </div>
                <div className="space-y-3">
                  {analytics.mostScannedParts.length > 0 ? (
                    analytics.mostScannedParts.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.part?.sku || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {item.part?.name || 'No description'}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{
                                width: `${
                                  (item.scanCount /
                                    (analytics.mostScannedParts[0]?.scanCount || 1)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-8 text-right">
                            {item.scanCount}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No scan data available</p>
                  )}
                </div>
              </div>

              {/* User Activity */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">User Scan Activity</h2>
                </div>
                <div className="space-y-3">
                  {analytics.userActivity.length > 0 ? (
                    analytics.userActivity.slice(0, 10).map((user, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{user.userName}</p>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${
                                  (user.scanCount /
                                    (analytics.userActivity[0]?.scanCount || 1)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-8 text-right">
                            {user.scanCount}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No user activity data</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Peak Scanning Hours */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white">Peak Scanning Hours</h2>
                </div>
                <div className="space-y-2">
                  {analytics.peakHours.length > 0 ? (
                    analytics.peakHours
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 12)
                      .map((hour) => (
                        <div key={hour.hour} className="flex items-center justify-between">
                          <span className="text-sm text-slate-400 w-20">{formatHour(hour.hour)}</span>
                          <div className="flex-1 mx-4">
                            <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-purple-500"
                                style={{
                                  width: `${
                                    (hour.count /
                                      Math.max(...analytics.peakHours.map((h) => h.count))) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-white w-8 text-right">
                            {hour.count}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No hourly data available</p>
                  )}
                </div>
              </div>

              {/* Action Type Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Scan Type Breakdown</h2>
                </div>
                <div className="space-y-3">
                  {analytics.actionBreakdown.length > 0 ? (
                    analytics.actionBreakdown.map((action) => (
                      <div key={action.actionType} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getActionColor(action.actionType)}`} />
                          <span className="text-sm text-slate-300">{action.actionType}</span>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${getActionColor(action.actionType)}`}
                              style={{
                                width: `${
                                  (action.count /
                                    Math.max(
                                      ...analytics.actionBreakdown.map((a) => a.count)
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-8 text-right">
                            {action.count}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No action data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Scan Frequency Over Time */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Scan Frequency Over Time</h2>
              </div>
              <div className="space-y-2">
                {analytics.scanFrequency.length > 0 ? (
                  <div className="flex items-end gap-1 h-40">
                    {analytics.scanFrequency.map((day, index) => {
                      const maxCount = Math.max(...analytics.scanFrequency.map((d) => d.count));
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          <div
                            className="w-full bg-cyan-500 rounded-t transition-all hover:bg-cyan-400 cursor-pointer"
                            style={{ height: `${height}%` }}
                            title={`${day.period}: ${day.count} scans`}
                          />
                          <span className="text-xs text-slate-600 mt-2 hidden group-hover:block">
                            {new Date(day.period).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">No frequency data available</p>
                )}
              </div>
            </div>

            {/* Recent Scans */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-white">Recent Scans</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 font-medium text-slate-400">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">User</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">SKU</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">Action</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentScans.length > 0 ? (
                      analytics.recentScans.slice(0, 20).map((scan) => (
                        <tr key={scan.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-slate-300">
                            {new Date(scan.scannedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{scan.userName}</td>
                          <td className="py-3 px-4 font-mono text-amber-400">{scan.sku}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getActionColor(scan.actionType)}`}>
                              {scan.actionType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {scan.success ? (
                              <span className="text-emerald-400 text-xs">Success</span>
                            ) : (
                              <span className="text-red-400 text-xs">Failed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No recent scans
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color = 'slate',
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}) {
  const bgColors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30',
    blue: 'bg-blue-500/10 border-blue-500/30',
    amber: 'bg-amber-500/10 border-amber-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    slate: 'bg-slate-500/10 border-slate-500/30',
  };

  const iconColors: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    slate: 'text-slate-400',
  };

  return (
    <div className={`p-6 rounded-2xl border ${bgColors[color]}`}>
      <div className={`mb-3 ${iconColors[color]}`}>{icon}</div>
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
