import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Part, InterchangeGroup, PartCondition, PART_CONDITIONS } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { ConditionBadge, ConditionSelect } from '../components/ConditionBadge';
import { ArrowLeft, Pencil, Trash2, Printer, Plus, X, BarChart3, Car, Link2, AlertTriangle } from 'lucide-react';

export function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isManager } = useAuth();

  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  // Fitment form
  const [showFitmentForm, setShowFitmentForm] = useState(false);
  const [fitYear, setFitYear] = useState<number | ''>('');
  const [fitMake, setFitMake] = useState('');
  const [fitVehicleId, setFitVehicleId] = useState<number | ''>('');
  const [fitMakes, setFitMakes] = useState<string[]>([]);
  const [fitModels, setFitModels] = useState<{ id: number; model: string; trim: string | null }[]>([]);

  // Group form
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groups, setGroups] = useState<InterchangeGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [saving, setSaving] = useState(false);

  const yearOptions = Array.from({ length: 27 }, (_, i) => 2000 + i).reverse();
  const inputCls = "w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm";
  const selectCls = inputCls;

  useEffect(() => { loadPart(); }, [id]);

  useEffect(() => {
    if (editingField && editRef.current) editRef.current.focus();
  }, [editingField]);

  // Fitment cascading
  useEffect(() => {
    if (fitYear === '') { setFitMakes([]); setFitMake(''); setFitModels([]); setFitVehicleId(''); return; }
    api.getVehicleMakes(fitYear).then(setFitMakes).catch(() => setFitMakes([]));
    setFitMake(''); setFitModels([]); setFitVehicleId('');
  }, [fitYear]);

  useEffect(() => {
    if (fitYear === '' || !fitMake) { setFitModels([]); setFitVehicleId(''); return; }
    api.getVehicleModels(fitYear, fitMake).then(setFitModels).catch(() => setFitModels([]));
    setFitVehicleId('');
  }, [fitMake]);

  const loadPart = async () => {
    try {
      setLoading(true);
      const data = await api.getPartById(parseInt(id!, 10));
      setPart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load part');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (field: string, value: string) => {
    if (!isManager) return;
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = async () => {
    if (!editingField || !part) return;
    setSaving(true);
    try {
      const updated = await api.updatePart(part.id, { [editingField]: editValue });
      setPart(updated);
      setEditingField(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditingField(null);
  };

  const handleGenerateBarcode = async () => {
    if (!part) return;
    setSaving(true);
    try {
      const updated = await api.generatePartBarcode(part.id);
      setPart(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate barcode');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!part || fitVehicleId === '') return;
    try {
      await api.addFitment(part.id, fitVehicleId);
      setShowFitmentForm(false);
      setFitYear(''); setFitMake(''); setFitVehicleId('');
      loadPart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fitment');
    }
  };

  const handleRemoveFitment = async (vehicleId: number) => {
    if (!part) return;
    try {
      await api.removeFitment(part.id, vehicleId);
      loadPart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove fitment');
    }
  };

  const handleAddToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!part || selectedGroupId === '') return;
    try {
      await api.addGroupMember(selectedGroupId, part.id);
      setShowGroupForm(false);
      setSelectedGroupId('');
      loadPart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to group');
    }
  };

  const handleRemoveFromGroup = async (groupId: number) => {
    if (!part) return;
    try {
      await api.removeGroupMember(groupId, part.id);
      loadPart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from group');
    }
  };

  const handleDelete = async () => {
    if (!part || deleteConfirm !== part.sku) return;
    try {
      await api.deletePart(part.id);
      navigate('/parts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete part');
    }
  };

  const openGroupForm = async () => {
    try {
      const g = await api.getInterchangeGroups();
      setGroups(g);
      setShowGroupForm(true);
    } catch {}
  };

  const printBarcode = () => {
    if (!part?.barcodeData) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>${part.sku}</title><style>body{font-family:monospace;text-align:center;padding:40px}img{max-width:100%}h2{margin:20px 0}</style></head><body><img src="data:image/png;base64,${part.barcodeData}" /><h2>${part.sku}</h2></body></html>`);
    win.document.close();
    win.print();
  };

  const EditableField = ({ field, value, label, mono }: { field: string; value: string; label: string; mono?: boolean }) => {
    if (editingField === field) {
      return (
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</label>
          <input
            ref={editRef}
            className={inputCls}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            disabled={saving}
          />
        </div>
      );
    }
    return (
      <div
        className={`group ${isManager ? 'cursor-pointer' : ''}`}
        onClick={() => startEdit(field, value)}
      >
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</label>
        <div className="flex items-center gap-2">
          <span className={`text-white ${mono ? 'font-mono' : ''}`}>{value || <span className="text-slate-600 italic">Not set</span>}</span>
          {isManager && <Pencil className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!part) {
    return (
      <Layout>
        <div className="text-center py-24">
          <h2 className="text-xl font-semibold text-slate-400">Part not found</h2>
          <button onClick={() => navigate('/parts')} className="mt-4 text-amber-400 hover:text-amber-300 text-sm">← Back to Parts</button>
        </div>
      </Layout>
    );
  }

  const skuDecoded = part.skuDecoded ? (() => { try { return JSON.parse(part.skuDecoded!); } catch { return null; } })() : null;

  return (
    <Layout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/parts')} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{part.name}</h1>
              <span className="inline-flex px-2.5 py-1 mt-1 bg-amber-500/10 text-amber-400 text-xs font-mono font-semibold rounded-md">{part.sku}</span>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}<button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-red-200">×</button></div>}

        {/* Overview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <EditableField field="name" value={part.name} label="Name" />
            <EditableField field="description" value={part.description || ''} label="Description" />
            {isManager ? (
              <EditableField field="sku" value={part.sku} label="SKU" mono />
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">SKU</label>
                <span className="text-white font-mono">{part.sku}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Condition</label>
              {isManager ? (
                <ConditionSelect 
                  value={part.condition || 'UNKNOWN'} 
                  onChange={async (value) => {
                    setSaving(true);
                    try {
                      const updated = await api.updatePart(part.id, { condition: value });
                      setPart(updated);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to update');
                    } finally {
                      setSaving(false);
                    }
                  }} 
                  disabled={saving}
                />
              ) : (
                <ConditionBadge condition={part.condition || 'UNKNOWN'} size="md" />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Min Stock</label>
              {isManager ? (
                <input
                  type="number"
                  min="0"
                  className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  value={part.minStock}
                  onChange={async (e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSaving(true);
                    try {
                      const updated = await api.updatePart(part.id, { minStock: value });
                      setPart(updated);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to update');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                />
              ) : (
                <span className="text-white">{part.minStock}</span>
              )}
            </div>
          </div>
        </div>

        {/* Barcode Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Barcode
          </h2>
          {part.barcodeData ? (
            <div className="flex items-center gap-6">
              <img src={`data:image/png;base64,${part.barcodeData}`} alt="Barcode" className="h-16" />
              <button onClick={printBarcode} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white whitespace-nowrap hover:border-slate-600 transition-colors cursor-pointer">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-500">No barcode generated for this part.</p>
              {isManager && (
                <button onClick={handleGenerateBarcode} disabled={saving} className="inline-flex items-center gap-3 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50">
                  <BarChart3 className="w-4 h-4" /> Generate Barcode
                </button>
              )}
            </div>
          )}
        </div>

        {/* SKU Decoded */}
        {skuDecoded && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">SKU Decoded</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['Make', skuDecoded.make],
                ['Model', skuDecoded.model],
                ['Year', skuDecoded.year],
                ['System', skuDecoded.system],
                ['Component', skuDecoded.component],
                ['Position', skuDecoded.position || '—'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{label as string}</p>
                  <p className="text-white font-medium mt-0.5">{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fitments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4" /> Fitments ({part.fitments?.length || 0})
            </h2>
            {isManager && (
              <button onClick={() => setShowFitmentForm(!showFitmentForm)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                {showFitmentForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showFitmentForm ? 'Cancel' : 'Add Fitment'}
              </button>
            )}
          </div>

          {showFitmentForm && (
            <form onSubmit={handleAddFitment} className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <select className={selectCls} value={fitYear} onChange={(e) => setFitYear(e.target.value ? parseInt(e.target.value) : '')} required>
                  <option value="">Year...</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className={selectCls} value={fitMake} onChange={(e) => setFitMake(e.target.value)} required disabled={fitYear === ''}>
                  <option value="">Make...</option>
                  {fitMakes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className={selectCls} value={fitVehicleId} onChange={(e) => setFitVehicleId(e.target.value ? parseInt(e.target.value) : '')} required disabled={!fitMake}>
                  <option value="">Model...</option>
                  {fitModels.map(m => <option key={m.id} value={m.id}>{m.model}{m.trim ? ` (${m.trim})` : ''}</option>)}
                </select>
              </div>
              <button type="submit" className="inline-flex items-center gap-3 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer">Add</button>
            </form>
          )}

          {part.fitments && part.fitments.length > 0 ? (
            <div className="space-y-2">
              {part.fitments.map(f => (
                <div key={f.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-white">
                    {f.vehicle?.year} {f.vehicle?.make} {f.vehicle?.model}{f.vehicle?.trim ? ` ${f.vehicle.trim}` : ''}
                  </span>
                  {isManager && (
                    <button onClick={() => handleRemoveFitment(f.vehicleId)} className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No fitments assigned.</p>
          )}
        </div>

        {/* Interchange Groups */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Interchange Groups ({part.interchangeMembers?.length || 0})
            </h2>
            {isManager && (
              <button onClick={() => showGroupForm ? setShowGroupForm(false) : openGroupForm()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                {showGroupForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showGroupForm ? 'Cancel' : 'Add to Group'}
              </button>
            )}
          </div>

          {showGroupForm && (
            <form onSubmit={handleAddToGroup} className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
              <select className={selectCls} value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : '')} required>
                <option value="">Choose a group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button type="submit" className="inline-flex items-center gap-3 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer">Add</button>
            </form>
          )}

          {part.interchangeMembers && part.interchangeMembers.length > 0 ? (
            <div className="space-y-2">
              {part.interchangeMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-800/50 rounded-lg">
                  <div>
                    <span className="text-sm text-white font-medium">{m.group?.name}</span>
                    {m.group?.members && m.group.members.length > 1 && (
                      <span className="ml-2 text-xs text-slate-500">
                        ({m.group.members.length} parts)
                      </span>
                    )}
                  </div>
                  {isManager && (
                    <button onClick={() => handleRemoveFromGroup(m.groupId)} className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Not in any interchange groups.</p>
          )}
        </div>

        {/* Danger Zone */}
        {isManager && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 mb-8">
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h2>
            <p className="text-sm text-slate-400 mb-4">Permanently delete this part and all its fitments and group memberships.</p>
            <button onClick={() => setShowDeleteModal(true)} className="inline-flex items-center gap-3 px-6 py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" /> Delete Part
            </button>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-white">Delete Part</h3>
                <button onClick={() => setShowDeleteModal(false)} className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-7 py-6 space-y-4">
                <p className="text-sm text-slate-400">
                  This will permanently delete <strong className="text-white">{part.name}</strong> and all associated fitments and group memberships.
                </p>
                <p className="text-sm text-slate-400">
                  Type <strong className="text-red-400 font-mono">{part.sku}</strong> to confirm:
                </p>
                <input
                  className={inputCls}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={part.sku}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowDeleteModal(false)} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer">Cancel</button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== part.sku}
                    className="inline-flex items-center gap-3 px-7 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl whitespace-nowrap transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
