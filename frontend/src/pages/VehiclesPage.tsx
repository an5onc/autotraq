import { useState, useEffect } from 'react';
import { api, Vehicle } from '../api/client';
import { Layout } from '../components/Layout';
import { Car, Search } from 'lucide-react';

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getVehicles(search || undefined);
        setVehicles(data.vehicles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Vehicles</h1>
            <p className="text-sm text-slate-500 mt-1">Browse all vehicles in the database</p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by year, make, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center">
              <Car className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-400">No vehicles found</h3>
              <p className="text-sm text-slate-600 mt-1">Add vehicles from the Parts page</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Make</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-mono font-semibold rounded-md">{v.year}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{v.make}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{v.model}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{v.trim || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
