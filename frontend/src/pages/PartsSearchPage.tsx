import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, AdvancedSearchResult, PartCondition } from '../api/client';
import { Layout } from '../components/Layout';
import { ConditionBadge } from '../components/ConditionBadge';
import { SearchStatsCards } from '../components/SearchStatsCards';
import { HierarchyBrowser } from '../components/HierarchyBrowser';
import { SkeletonTable } from '../components/Skeleton';
import { Search, X, Car, FolderTree } from 'lucide-react';

export function PartsSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [result, setResult] = useState<AdvancedSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hierarchyKey, setHierarchyKey] = useState<string | undefined>();
  const [hierarchyLabel, setHierarchyLabel] = useState<string | undefined>();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch on query or hierarchy change
  useEffect(() => {
    if (hierarchyKey) return; // hierarchy overrides text search
    loadSearch(debouncedQuery || undefined);
  }, [debouncedQuery]);

  const loadSearch = async (q?: string) => {
    setLoading(true);
    try {
      const data = await api.advancedPartsSearch(q);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleHierarchySelect = useCallback(async (systemCode: string, componentCode: string, label: string) => {
    const key = `${systemCode}/${componentCode}`;
    if (hierarchyKey === key) {
      // Deselect
      setHierarchyKey(undefined);
      setHierarchyLabel(undefined);
      loadSearch(debouncedQuery || undefined);
      return;
    }
    setHierarchyKey(key);
    setHierarchyLabel(label);
    setLoading(true);
    try {
      const data = await api.getPartsByHierarchy(systemCode, componentCode);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [hierarchyKey, debouncedQuery]);

  const clearHierarchy = () => {
    setHierarchyKey(undefined);
    setHierarchyLabel(undefined);
    loadSearch(debouncedQuery || undefined);
  };

  const formatDollars = (cents: number | null | undefined) =>
    cents != null ? `$${(cents / 100).toFixed(2)}` : '—';

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Advanced Parts Search</h1>
          <p className="text-sm text-slate-500 mt-2">Search parts with stats and browse by system hierarchy</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar: Hierarchy Browser */}
          <div className="w-72 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <FolderTree className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">System Hierarchy</h3>
              </div>
              <HierarchyBrowser onSelect={handleHierarchySelect} activeKey={hierarchyKey} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search parts by SKU, name, or description..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (hierarchyKey) clearHierarchy();
                }}
                className="w-full pl-11 pr-10 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Active filter badge */}
            {hierarchyLabel && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500">Filtered by:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-lg border border-amber-500/20">
                  <FolderTree className="w-3 h-3" />
                  {hierarchyLabel}
                  <button onClick={clearHierarchy} className="ml-1 hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Stats Cards */}
            {result && !loading && <SearchStatsCards data={result} />}

            {/* Results Table */}
            {loading ? (
              <SkeletonTable rows={8} cols={6} />
            ) : result && result.parts.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Condition</th>
                        <th className="px-6 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty On Hand</th>
                        <th className="px-6 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                        <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {result.parts.map((part) => (
                        <tr
                          key={part.id}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/parts/${part.id}`)}
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-mono font-semibold rounded-lg">
                              {part.sku}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white font-medium">{part.name}</td>
                          <td className="px-6 py-4">
                            <ConditionBadge condition={part.condition as PartCondition} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-medium ${part.onHandQty > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {part.onHandQty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-300">
                            {formatDollars(part.costCents)}
                          </td>
                          <td className="px-6 py-4">
                            {part.fitments.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {part.fitments.slice(0, 2).map((f) => (
                                  <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded-md">
                                    <Car className="w-2.5 h-2.5" />
                                    {f.vehicle.year} {f.vehicle.make} {f.vehicle.model}
                                  </span>
                                ))}
                                {part.fitments.length > 2 && (
                                  <span className="text-[10px] text-slate-500">+{part.fitments.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500">{result.totalCount} parts</p>
                </div>
              </div>
            ) : result ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-400">No parts found</h3>
                <p className="text-sm text-slate-600 mt-1">Try a different search term or browse the hierarchy</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
