import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, AdvancedSearchResult, PartCondition, PART_CONDITIONS } from '../api/client';
import { ConditionBadge } from '../components/ConditionBadge';
import { HierarchyBrowser } from '../components/HierarchyBrowser';
import { Search, Package, DollarSign, BarChart3, TrendingUp, TrendingDown, Minus, Boxes, PackageX, X } from 'lucide-react';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatsCards({ data }: { data: AdvancedSearchResult }) {
  const { totalCount, conditionBreakdown, priceStats, inventoryStats } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* Total Parts */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Package className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Parts</p>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
          </div>
        </div>
        {/* Condition breakdown pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.entries(conditionBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([condition, count]) => (
              <span key={condition} className="inline-flex items-center gap-1">
                <ConditionBadge condition={condition as PartCondition} size="sm" />
                <span className="text-[10px] text-slate-500 font-mono">{count}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Price Stats */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Price Range</p>
          </div>
        </div>
        {priceStats.avg > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Minus className="w-3 h-3" /> Avg
              </span>
              <span className="text-sm font-semibold text-white">{formatCents(priceStats.avg)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> High
              </span>
              <span className="text-sm font-medium text-emerald-400">{formatCents(priceStats.high)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingDown className="w-3 h-3 text-red-400" /> Low
              </span>
              <span className="text-sm font-medium text-red-400">{formatCents(priceStats.low)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No pricing data</p>
        )}
      </div>

      {/* Inventory Stats */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Boxes className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Inventory</p>
            <p className="text-2xl font-bold text-white">{inventoryStats.totalOnHand}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-400">{inventoryStats.inStock} in stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-slate-400">{inventoryStats.outOfStock} out</span>
          </div>
        </div>
      </div>

      {/* Condition Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Condition Mix</p>
          </div>
        </div>
        {totalCount > 0 ? (
          <div className="space-y-1.5">
            {Object.entries(conditionBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)
              .map(([condition, count]) => {
                const pct = Math.round((count / totalCount) * 100);
                const config = PART_CONDITIONS.find(c => c.value === condition);
                const colorMap: Record<string, string> = {
                  emerald: 'bg-emerald-400', green: 'bg-green-400', blue: 'bg-blue-400',
                  amber: 'bg-amber-400', orange: 'bg-orange-400', purple: 'bg-purple-400',
                  red: 'bg-red-400', slate: 'bg-slate-400',
                };
                return (
                  <div key={condition} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-16 truncate">{config?.label || condition}</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colorMap[config?.color || 'slate']}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No data</p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [result, setResult] = useState<AdvancedSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeHierarchy, setActiveHierarchy] = useState<string | undefined>();
  const [hierarchyLabel, setHierarchyLabel] = useState<string>('');

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    setActiveHierarchy(undefined);
    setHierarchyLabel('');
    try {
      const data = await api.advancedPartsSearch(q || undefined);
      setResult(data);
      if (q) {
        setSearchParams({ q });
      } else {
        setSearchParams({});
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  const doHierarchySearch = useCallback(async (systemCode: string, componentCode: string, label: string) => {
    setLoading(true);
    setQuery('');
    setActiveHierarchy(`${systemCode}/${componentCode}`);
    setHierarchyLabel(label);
    try {
      const data = await api.getPartsByHierarchy(systemCode, componentCode);
      setResult(data);
      setSearchParams({});
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Load initial search from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    } else {
      // Load all parts by default
      doSearch('');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setActiveHierarchy(undefined);
    setHierarchyLabel('');
    doSearch('');
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Hierarchy Sidebar */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sticky top-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Parts Hierarchy
          </h3>
          <HierarchyBrowser
            onSelect={doHierarchySearch}
            activeKey={activeHierarchy}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search parts by name, SKU, or description... (e.g. fender, bumper, headlight)"
              className="w-full pl-12 pr-24 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {(query || activeHierarchy) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Active Filter Label */}
        {hierarchyLabel && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <span className="text-xs text-amber-400">Filtered by hierarchy:</span>
            <span className="text-sm font-medium text-amber-300">{hierarchyLabel}</span>
            <button onClick={clearSearch} className="ml-auto text-amber-500 hover:text-amber-300 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Results */}
        {!loading && result && (
          <>
            <StatsCards data={result} />

            {/* Results Table */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {result.totalCount} part{result.totalCount !== 1 ? 's' : ''} found
                  {query && <span className="text-slate-400 font-normal"> matching "{query}"</span>}
                </h3>
                <div className="flex items-center gap-2">
                  <PackageX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-500">
                    {result.inventoryStats.outOfStock} with zero stock shown
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">SKU</th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Name</th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Condition</th>
                      <th className="text-right px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Qty</th>
                      <th className="text-right px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Cost</th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Vehicles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {result.parts.map((part) => (
                      <tr
                        key={part.id}
                        onClick={() => navigate(`/parts/${part.id}`)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-amber-400">{part.sku}</span>
                        </td>
                        <td className="px-4 py-3 text-white">{part.name}</td>
                        <td className="px-4 py-3">
                          <ConditionBadge condition={part.condition} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono ${part.onHandQty === 0 ? 'text-red-400' : part.onHandQty <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {part.onHandQty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {part.costCents ? formatCents(part.costCents) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {part.fitments.length > 0 ? (
                            <span className="text-xs text-slate-400">
                              {part.fitments.length === 1
                                ? `${part.fitments[0].vehicle.year} ${part.fitments[0].vehicle.make} ${part.fitments[0].vehicle.model}`
                                : `${part.fitments.length} vehicles`}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.parts.length === 0 && (
                <div className="text-center py-12">
                  <PackageX className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No parts found</p>
                  <p className="text-xs text-slate-600 mt-1">Try a different search term or browse the hierarchy</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
