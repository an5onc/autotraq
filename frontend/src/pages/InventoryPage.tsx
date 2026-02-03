import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, Part, Location, OnHand, InventoryEvent } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { PartSearch } from '../components/PartSearch';
import { Package, MapPin, ArrowDownToLine, PenLine, X, TrendingUp, TrendingDown, Box, Search } from 'lucide-react';

export function InventoryPage() {
  const { canFulfill, isManager } = useAuth();
  const [searchParams] = useSearchParams();
  const [onHand, setOnHand] = useState<OnHand[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [receiveForm, setReceiveForm] = useState({ partId: '', locationId: '', qty: 1, reason: '' });
  const [correctForm, setCorrectForm] = useState({ partId: '', locationId: '', qty: 0, reason: '' });
  const [locationName, setLocationName] = useState('');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  const viewMode = searchParams.get('view');
  const focusSearch = searchParams.get('focus') === 'search';

  useEffect(() => { loadData(); }, []);

  // Handle query params
  useEffect(() => {
    if (focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (viewMode === 'events' && eventsRef.current) {
      eventsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusSearch, viewMode, loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [onHandData, eventsData, partsData, locationsData] = await Promise.all([
        api.getOnHand(), api.getEvents(), api.getParts(undefined, undefined, 1000), api.getLocations(),
      ]);
      setOnHand(onHandData);
      setEvents(eventsData.events);
      setParts(partsData.parts);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.receiveStock(parseInt(receiveForm.partId), parseInt(receiveForm.locationId), receiveForm.qty, receiveForm.reason || undefined);
      setShowReceiveModal(false);
      setReceiveForm({ partId: '', locationId: '', qty: 1, reason: '' });
      loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to receive stock'); }
  };

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.correctStock(parseInt(correctForm.partId), parseInt(correctForm.locationId), correctForm.qty, correctForm.reason);
      setShowCorrectModal(false);
      setCorrectForm({ partId: '', locationId: '', qty: 0, reason: '' });
      loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to correct stock'); }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLocation(locationName);
      setShowLocationModal(false);
      setLocationName('');
      loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create location'); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const totalQty = onHand.reduce((sum, i) => sum + i.quantity, 0);
  const uniqueParts = new Set(onHand.map((i) => i.partId)).size;

  // Filtered on-hand
  const filteredOnHand = useMemo(() => {
    let result = onHand;
    if (locationFilter) {
      result = result.filter(i => String(i.locationId) === locationFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.part?.sku?.toLowerCase().includes(q) ||
        i.part?.name?.toLowerCase().includes(q) ||
        i.location?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [onHand, locationFilter, searchQuery]);

  const activeLocationName = locationFilter ? locations.find(l => String(l.id) === locationFilter)?.name : null;

  const eventTypeBadge: Record<string, string> = {
    RECEIVE: 'bg-emerald-500/10 text-emerald-400',
    FULFILL: 'bg-blue-500/10 text-blue-400',
    RETURN: 'bg-amber-500/10 text-amber-400',
    CORRECTION: 'bg-purple-500/10 text-purple-400',
  };

  const inputCls = "w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm";

  const showOverview = viewMode !== 'events';
  const showEvents = viewMode !== 'search';

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Inventory</h1>
            <p className="text-sm text-slate-500 mt-2">Track stock levels and movements</p>
          </div>
          <div className="flex gap-2">
            {isManager && (
              <>
                <button onClick={() => setShowLocationModal(true)} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm whitespace-nowrap text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"><MapPin className="w-4 h-4" /> Location</button>
                <button onClick={() => setShowCorrectModal(true)} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm whitespace-nowrap text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"><PenLine className="w-4 h-4" /> Correction</button>
              </>
            )}
            {canFulfill && (
              <button onClick={() => setShowReceiveModal(true)} className="inline-flex items-center gap-3 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer"><ArrowDownToLine className="w-4 h-4" /> Receive Stock</button>
            )}
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {showOverview && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard icon={Box} label="Total Units" value={totalQty} color="amber" />
              <StatCard icon={Package} label="Unique Parts" value={uniqueParts} color="blue" />
              <StatCard icon={MapPin} label="Locations" value={locations.length} color="emerald" />
            </div>

            {/* Two column: On-Hand + Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                      On-Hand Quantities
                      {activeLocationName && <span className="text-amber-400 ml-2">@ {activeLocationName}</span>}
                    </h3>
                    {locationFilter && (
                      <button onClick={() => setLocationFilter('')} className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer">View All</button>
                    )}
                  </div>
                  {/* Search + Location filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
                        placeholder="Search SKU, name, location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition-colors"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    >
                      <option value="">All locations</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                {loading ? <div className="p-16 text-center text-slate-500">Loading...</div> : filteredOnHand.length === 0 ? (
                  <div className="p-16 text-center"><Package className="w-10 h-10 text-slate-700 mx-auto mb-2" /><p className="text-sm text-slate-500">{onHand.length === 0 ? 'No inventory yet' : 'No matching items'}</p></div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-slate-900"><tr className="border-b border-slate-800"><th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Part</th><th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th><th className="px-8 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th></tr></thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {filteredOnHand.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-8 py-4"><span className="text-sm font-medium text-white">{item.part?.sku}</span> <span className="text-sm text-slate-400">— {item.part?.name}</span></td>
                            <td className="px-8 py-4 text-sm text-slate-400">{item.location?.name}</td>
                            <td className="px-8 py-4 text-right"><span className={`text-sm font-bold ${item.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{item.quantity}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-800"><h3 className="text-sm font-semibold text-white uppercase tracking-wider">Locations</h3></div>
                {loading ? <div className="p-16 text-center text-slate-500">Loading...</div> : locations.length === 0 ? (
                  <div className="p-16 text-center"><MapPin className="w-10 h-10 text-slate-700 mx-auto mb-2" /><p className="text-sm text-slate-500">No locations yet</p></div>
                ) : (
                  <div className="p-4 space-y-2">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setLocationFilter(locationFilter === String(loc.id) ? '' : String(loc.id))}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                          locationFilter === String(loc.id)
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-slate-800/50 hover:bg-slate-800'
                        }`}
                      >
                        <MapPin className={`w-4 h-4 ${locationFilter === String(loc.id) ? 'text-amber-400' : 'text-amber-500'}`} />
                        <span className={`text-sm ${locationFilter === String(loc.id) ? 'text-amber-400 font-medium' : 'text-white'}`}>{loc.name}</span>
                        <span className="ml-auto text-xs text-slate-500">
                          {onHand.filter(i => i.locationId === loc.id).reduce((s, i) => s + i.quantity, 0)} units
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Events */}
        {showEvents && (
          <div ref={eventsRef} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-800"><h3 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Events</h3></div>
            {loading ? <div className="p-16 text-center text-slate-500">Loading...</div> : events.length === 0 ? (
              <div className="p-16 text-center text-slate-500">No events yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-800">
                    {['Date', 'Type', 'Part', 'Location', 'Qty', 'Reason', 'User'].map((h) => (
                      <th key={h} className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(ev.createdAt)}</td>
                        <td className="px-8 py-4"><span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${eventTypeBadge[ev.type] || ''}`}>{ev.type}</span></td>
                        <td className="px-8 py-4 text-sm text-white">{ev.part?.sku}</td>
                        <td className="px-8 py-4 text-sm text-slate-400">{ev.location?.name}</td>
                        <td className="px-8 py-4">
                          <span className={`flex items-center gap-1 text-sm font-bold ${ev.qtyDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {ev.qtyDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {ev.qtyDelta >= 0 ? '+' : ''}{ev.qtyDelta}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-sm text-slate-400">{ev.reason || '—'}</td>
                        <td className="px-8 py-4 text-sm text-slate-400">{ev.user?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showReceiveModal && <Modal title="Receive Stock" onClose={() => setShowReceiveModal(false)}>
        <form onSubmit={handleReceive} className="space-y-4">
          <Field label="Part"><PartSearch parts={parts} value={receiveForm.partId} onChange={(v) => setReceiveForm({ ...receiveForm, partId: v })} required /></Field>
          <Field label="Location"><select className={inputCls} value={receiveForm.locationId} onChange={(e) => setReceiveForm({ ...receiveForm, locationId: e.target.value })} required><option value="">Select location...</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="Quantity"><input type="number" className={inputCls} value={receiveForm.qty} onChange={(e) => setReceiveForm({ ...receiveForm, qty: parseInt(e.target.value) || 1 })} required min={1} /></Field>
          <Field label="Reason (optional)"><input type="text" className={inputCls} value={receiveForm.reason} onChange={(e) => setReceiveForm({ ...receiveForm, reason: e.target.value })} placeholder="PO #12345" /></Field>
          <ModalFooter onCancel={() => setShowReceiveModal(false)} label="Receive Stock" />
        </form>
      </Modal>}

      {showCorrectModal && <Modal title="Stock Correction" onClose={() => setShowCorrectModal(false)}>
        <form onSubmit={handleCorrect} className="space-y-4">
          <Field label="Part"><PartSearch parts={parts} value={correctForm.partId} onChange={(v) => setCorrectForm({ ...correctForm, partId: v })} required /></Field>
          <Field label="Location"><select className={inputCls} value={correctForm.locationId} onChange={(e) => setCorrectForm({ ...correctForm, locationId: e.target.value })} required><option value="">Select location...</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="Qty Adjustment (+ or -)"><input type="number" className={inputCls} value={correctForm.qty} onChange={(e) => setCorrectForm({ ...correctForm, qty: parseInt(e.target.value) || 0 })} required /></Field>
          <Field label="Reason (required)"><input type="text" className={inputCls} value={correctForm.reason} onChange={(e) => setCorrectForm({ ...correctForm, reason: e.target.value })} required placeholder="Physical count adjustment" /></Field>
          <ModalFooter onCancel={() => setShowCorrectModal(false)} label="Apply Correction" />
        </form>
      </Modal>}

      {showLocationModal && <Modal title="Create Location" onClose={() => setShowLocationModal(false)}>
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <Field label="Location Name"><input type="text" className={inputCls} value={locationName} onChange={(e) => setLocationName(e.target.value)} required placeholder="Main Warehouse" /></Field>
          <ModalFooter onCancel={() => setShowLocationModal(false)} label="Create Location" />
        </form>
      </Modal>}
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon className="w-6 h-6" /></div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{label}</label>{children}</div>;
}

function ModalFooter({ onCancel, label }: { onCancel: () => void; label: string }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer">Cancel</button>
      <button type="submit" className="inline-flex items-center gap-3 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer">{label}</button>
    </div>
  );
}
