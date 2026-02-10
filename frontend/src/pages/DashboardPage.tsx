import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, InventoryEvent, OnHand, Part } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { 
  Package, 
  Warehouse, 
  ClipboardList, 
  AlertTriangle, 
  ArrowDownToLine, 
  Plus, 
  ScanLine,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  DollarSign,
  Activity,
  Archive
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalParts: number;
  totalInventory: number;
  totalValueCents: number;
  pendingRequests: number;
  lowStockCount: number;
  recentEvents: InventoryEvent[];
  lowStockParts: (Part & { onHand: number })[];
}

interface HistoryPoint {
  date: string;
  total: number;
}

interface TopMover {
  part: Part;
  eventCount: number;
  netChange: number;
}

interface DeadStockItem {
  part: Part;
  quantity: number;
  lastActivity: string | null;
  daysSinceActivity: number | null;
}

export function DashboardPage() {
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [topMovers, setTopMovers] = useState<TopMover[]>([]);
  const [deadStock, setDeadStock] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [partsRes, onHandRes, eventsRes, requestsRes] = await Promise.all([
        api.getParts(undefined, undefined, 1000),
        api.getOnHand(),
        api.getEvents(),
        api.getRequests('PENDING'),
      ]);

      // Build part lookup for cost
      const partById = new Map(partsRes.parts.map(p => [p.id, p]));

      // Calculate total inventory and value
      let totalInventory = 0;
      let totalValueCents = 0;
      const partQuantities = new Map<number, number>();
      
      onHandRes.forEach(item => {
        totalInventory += item.quantity;
        const current = partQuantities.get(item.partId) || 0;
        partQuantities.set(item.partId, current + item.quantity);
        
        // Add to value if part has cost
        const part = partById.get(item.partId);
        if (part?.costCents) {
          totalValueCents += item.quantity * part.costCents;
        }
      });

      // Find low stock parts (parts with quantity < their minStock threshold)
      const lowStockParts = partsRes.parts
        .filter(part => {
          const qty = partQuantities.get(part.id) || 0;
          return qty < part.minStock && qty >= 0;
        })
        .map(part => ({
          ...part,
          onHand: partQuantities.get(part.id) || 0,
        }))
        .slice(0, 10);

      setStats({
        totalParts: partsRes.parts.length,
        totalInventory,
        totalValueCents,
        pendingRequests: requestsRes.requests.length,
        lowStockCount: lowStockParts.length,
        recentEvents: eventsRes.events.slice(0, 8),
        lowStockParts,
      });

      // Load analytics data in background
      Promise.all([
        api.getInventoryHistory(30),
        api.getTopMovers(30, 5),
        api.getDeadStock(90, 5),
      ]).then(([historyData, moversData, deadData]) => {
        setHistory(historyData);
        setTopMovers(moversData);
        setDeadStock(deadData);
      }).catch(() => {/* ignore analytics errors */});

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatEventType = (type: string) => {
    switch (type) {
      case 'RECEIVE': return { label: 'Received', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp };
      case 'FULFILL': return { label: 'Fulfilled', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: TrendingDown };
      case 'RETURN': return { label: 'Returned', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: TrendingUp };
      case 'CORRECTION': return { label: 'Corrected', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Package };
      default: return { label: type, color: 'text-slate-400', bg: 'bg-slate-500/10', icon: Package };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center text-red-400 py-12">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-2">
            Welcome back, {user?.name}. Here's what's happening with your inventory.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard
            title="Total Parts"
            value={stats?.totalParts || 0}
            icon={Package}
            color="amber"
            link="/parts"
          />
          <KPICard
            title="Total Inventory"
            value={stats?.totalInventory || 0}
            icon={Warehouse}
            color="emerald"
            link="/inventory"
            suffix=" units"
          />
          <KPICard
            title="Inventory Value"
            value={stats?.totalValueCents ? stats.totalValueCents / 100 : 0}
            icon={DollarSign}
            color="purple"
            link="/inventory"
            prefix="$"
            formatMoney
          />
          <KPICard
            title="Pending Requests"
            value={stats?.pendingRequests || 0}
            icon={ClipboardList}
            color="blue"
            link="/requests?status=PENDING"
          />
          <KPICard
            title="Low Stock"
            value={stats?.lowStockCount || 0}
            icon={AlertTriangle}
            color="red"
            link="/inventory?view=low-stock"
            alert={stats?.lowStockCount ? stats.lowStockCount > 0 : false}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <QuickAction icon={ArrowDownToLine} label="Receive Stock" to="/inventory" />
            <QuickAction icon={Plus} label="Add Part" to="/parts" />
            <QuickAction icon={ScanLine} label="Scan Barcode" to="/scan" />
            {isManager && <QuickAction icon={ClipboardList} label="View Requests" to="/requests" />}
          </div>
        </div>

        {/* Inventory Chart */}
        {history.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Inventory Levels (30 Days)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#f59e0b' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                    name="Total Units"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Analytics Row */}
        {(topMovers.length > 0 || deadStock.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Movers */}
            {topMovers.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Top Movers (30 Days)
                </h2>
                <div className="space-y-3">
                  {topMovers.map((item, i) => (
                    <Link 
                      key={item.part.id} 
                      to={`/parts/${item.part.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.part.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{item.part.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{item.eventCount} events</p>
                        <p className={`text-xs ${item.netChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.netChange >= 0 ? '+' : ''}{item.netChange} net
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Dead Stock */}
            {deadStock.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-orange-400" /> Dead Stock (90+ Days)
                </h2>
                <div className="space-y-3">
                  {deadStock.map((item) => (
                    <Link 
                      key={item.part.id} 
                      to={`/parts/${item.part.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Archive className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.part.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{item.part.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{item.quantity} units</p>
                        <p className="text-xs text-orange-400">
                          {item.daysSinceActivity ? `${item.daysSinceActivity}d idle` : 'Never moved'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Activity</h2>
              <Link to="/inventory?view=events" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.recentEvents.map((event) => {
                const typeInfo = formatEventType(event.type);
                const Icon = typeInfo.icon;
                return (
                  <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className={`w-9 h-9 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {event.part?.name || `Part #${event.partId}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {typeInfo.label} {Math.abs(event.qtyDelta)} @ {event.location?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-mono font-semibold ${event.qtyDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {event.qtyDelta >= 0 ? '+' : ''}{event.qtyDelta}
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!stats?.recentEvents || stats.recentEvents.length === 0) && (
                <p className="text-center text-slate-500 py-8 text-sm">No recent activity</p>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Low Stock Alerts
              </h2>
              <Link to="/inventory?view=low-stock" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.lowStockParts.map((part) => (
                <Link
                  key={part.id}
                  to={`/parts/${part.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{part.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{part.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold text-red-400">{part.onHand}</p>
                    <p className="text-xs text-slate-600">min: {part.minStock}</p>
                  </div>
                </Link>
              ))}
              {(!stats?.lowStockParts || stats.lowStockParts.length === 0) && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-slate-500 text-sm">All parts are well stocked!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  link, 
  prefix = '',
  suffix = '',
  alert = false,
  formatMoney = false
}: { 
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'amber' | 'emerald' | 'blue' | 'red' | 'purple';
  link: string;
  prefix?: string;
  suffix?: string;
  alert?: boolean;
  formatMoney?: boolean;
}) {
  const colorClasses = {
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <Link
      to={link}
      className={`bg-slate-900 border rounded-2xl p-5 hover:border-slate-700 transition-colors ${
        alert ? 'border-red-500/50' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {alert && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">
        {prefix}{formatMoney ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-slate-500 mt-1">{title}</p>
    </Link>
  );
}

// Quick Action Button
function QuickAction({ icon: Icon, label, to }: { icon: React.ElementType; label: string; to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

export default DashboardPage;
