import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, Vehicle } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Car, Search, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export function VehiclesPage() {
  const { isManager } = useAuth();
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New vehicle modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ year: 2024, make: '', model: '', trim: '' });

  useEffect(() => {
    const action = searchParams.get('action');
    const focus = searchParams.get('focus');
    if (action === 'new') setShowModal(true);
    if (focus === 'search') searchInputRef.current?.focus();
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getVehicles(search || undefined, page);
        setVehicles(data.vehicles);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, page]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVehicle(form.year, form.make, form.model, form.trim || undefined);
      setShowModal(false);
      setForm({ year: 2024, make: '', model: '', trim: '' });
      setPage(1);
      setSearch('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
    }
  };

  const inputCls = "w-full px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm";

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Vehicles</h1>
            <p className="text-sm text-slate-500 mt-2">
              {total > 0 ? `${total.toLocaleString()} vehicles in database` : 'Browse all vehicles in the database'}
            </p>
          </div>
          {isManager && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> New Vehicle
            </button>
          )}
        </div>

        {error && <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Search */}
        <div className="relative mb-8">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by year, make, or model (e.g. 2014 Ford)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center">
              <Car className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-400">No vehicles found</h3>
              <p className="text-sm text-slate-600 mt-1">{search ? 'Try a different search' : 'Add vehicles to get started'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-7 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</th>
                      <th className="px-7 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Make</th>
                      <th className="px-7 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                      <th className="px-7 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-7 py-4">
                          <span className="inline-flex px-3.5 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-mono font-semibold rounded-lg">{v.year}</span>
                        </td>
                        <td className="px-7 py-4 text-sm text-white font-medium">{v.make}</td>
                        <td className="px-7 py-4 text-sm text-slate-300">{v.model}</td>
                        <td className="px-7 py-4 text-sm text-slate-400">{v.trim || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-7 py-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    Page {page} of {totalPages} · {total.toLocaleString()} vehicles
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">New Vehicle</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleCreateVehicle} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Year</label>
                  <input type="number" className={inputCls} value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} required min={2000} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Make</label>
                  <input type="text" className={inputCls} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required placeholder="Ford" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Model</label>
                  <input type="text" className={inputCls} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required placeholder="F-150" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Trim (optional)</label>
                  <input type="text" className={inputCls} value={form.trim} onChange={(e) => setForm({ ...form, trim: e.target.value })} placeholder="XLT" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-3 text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors cursor-pointer">Create Vehicle</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
