import { useState, useEffect } from 'react';
import { api, Part, Location, Request } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { ClipboardList, Plus, Check, Truck, X, Minus, Ban } from 'lucide-react';

export function RequestsPage() {
  const { isManager, canFulfill } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestItems, setRequestItems] = useState<{ partId: string; qty: number; locationId: string }[]>([{ partId: '', qty: 1, locationId: '' }]);
  const [requestNotes, setRequestNotes] = useState('');

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, partsData, locationsData] = await Promise.all([
        api.getRequests(statusFilter || undefined), api.getParts(), api.getLocations(),
      ]);
      setRequests(requestsData.requests);
      setParts(partsData.parts);
      setLocations(locationsData);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = requestItems.filter((i) => i.partId).map((i) => ({
        partId: parseInt(i.partId), qtyRequested: i.qty, locationId: i.locationId ? parseInt(i.locationId) : undefined,
      }));
      if (items.length === 0) { setError('Please add at least one item'); return; }
      await api.createRequest(items, requestNotes || undefined);
      setShowCreateModal(false);
      setRequestItems([{ partId: '', qty: 1, locationId: '' }]);
      setRequestNotes('');
      loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create request'); }
  };

  const handleApprove = async (id: number) => { try { await api.approveRequest(id); loadData(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); } };
  const handleFulfill = async (id: number) => { try { await api.fulfillRequest(id); loadData(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); } };
  const handleCancel = async (id: number) => { try { await api.cancelRequest(id); loadData(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); } };

  const addItem = () => setRequestItems([...requestItems, { partId: '', qty: 1, locationId: '' }]);
  const removeItem = (i: number) => setRequestItems(requestItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const n = [...requestItems]; n[i] = { ...n[i], [field]: value }; setRequestItems(n);
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const statusBadge: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-400',
    APPROVED: 'bg-blue-500/10 text-blue-400',
    FULFILLED: 'bg-emerald-500/10 text-emerald-400',
    CANCELLED: 'bg-red-500/10 text-red-400',
  };

  const filterBtns = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Fulfilled', value: 'FULFILLED' },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm";

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Requests</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage part requests</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-3 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {filterBtns.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? <div className="p-12 text-center text-slate-500">Loading...</div> : requests.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-400">No requests found</h3>
              <p className="text-sm text-slate-600 mt-1">Create a new request to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-800">
                  {['ID', 'Status', 'Items', 'Created By', 'Created', 'Notes', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-800/50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-white">#{req.id}</td>
                      <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${statusBadge[req.status] || ''}`}>{req.status}</span></td>
                      <td className="px-6 py-4">
                        {req.items.map((item, i) => (
                          <div key={i} className="text-xs text-slate-400">
                            <span className="text-white font-medium">{item.part?.sku}</span>: {item.qtyRequested} pcs
                            {item.location && <span className="text-slate-600"> @ {item.location.name}</span>}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{req.creator?.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{req.notes || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {req.status === 'PENDING' && isManager && (
                            <button onClick={() => handleApprove(req.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-colors cursor-pointer"><Check className="w-3.5 h-3.5" /> Approve</button>
                          )}
                          {req.status === 'APPROVED' && canFulfill && (
                            <button onClick={() => handleFulfill(req.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors cursor-pointer"><Truck className="w-3.5 h-3.5" /> Fulfill</button>
                          )}
                          {(req.status === 'PENDING' || req.status === 'APPROVED') && isManager && (
                            <button onClick={() => handleCancel(req.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors cursor-pointer"><Ban className="w-3.5 h-3.5" /> Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Create New Request</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Request Items</label>
                <div className="space-y-2">
                  {requestItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select className={`${inputCls} flex-[2]`} value={item.partId} onChange={(e) => updateItem(idx, 'partId', e.target.value)} required>
                        <option value="">Select part...</option>
                        {parts.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                      </select>
                      <input type="number" className={`${inputCls} flex-[1]`} value={item.qty} onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value) || 1)} min={1} placeholder="Qty" />
                      <select className={`${inputCls} flex-[2]`} value={item.locationId} onChange={(e) => updateItem(idx, 'locationId', e.target.value)}>
                        <option value="">Location (opt)</option>
                        {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      {requestItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="p-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"><Minus className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add Item</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Notes (optional)</label>
                <input type="text" className={inputCls} value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} placeholder="Urgent order for customer" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2.5 text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer">Create Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
