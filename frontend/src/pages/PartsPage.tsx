import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, Part, InterchangeGroup, MakeCode, SystemCode, ComponentCode, PartCondition, PART_CONDITIONS } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { ConditionBadge } from '../components/ConditionBadge';
import { Plus, Wrench, Link2, Car, X, Printer, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export function PartsPage() {
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [groups, setGroups] = useState<InterchangeGroup[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showPartModal, setShowPartModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showFitmentModal, setShowFitmentModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  const [partForm, setPartForm] = useState({ sku: '', name: '', description: '', condition: 'UNKNOWN' as PartCondition, minStock: 5, costCents: null as number | null });
  const [vehicleForm, setVehicleForm] = useState({ year: 2024, make: '', model: '', trim: '' });
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  // SKU generation state
  const [useSkuGen, setUseSkuGen] = useState(true);
  const [makeCodes, setMakeCodes] = useState<MakeCode[]>([]);
  const [systemCodes, setSystemCodes] = useState<SystemCode[]>([]);
  const [componentCodes, setComponentCodes] = useState<ComponentCode[]>([]);
  const [skuMake, setSkuMake] = useState('');
  const [skuModel, setSkuModel] = useState('');
  const [skuYear, setSkuYear] = useState<number | ''>(2024);
  const [skuSystem, setSkuSystem] = useState('');
  const [skuComponent, setSkuComponent] = useState('');
  const [skuPosition, setSkuPosition] = useState('');
  const [skuPreview, setSkuPreview] = useState('');
  const [skuBarcode, setSkuBarcode] = useState('');
  const [barcodeModal, setBarcodeModal] = useState<{ sku: string; barcode: string } | null>(null);

  const [partVehicleYear, setPartVehicleYear] = useState<number | ''>('');
  const [partVehicleMake, setPartVehicleMake] = useState('');
  const [partVehicleId, setPartVehicleId] = useState<number | ''>('');
  const [partMakes, setPartMakes] = useState<string[]>([]);
  const [partModels, setPartModels] = useState<{ id: number; model: string; trim: string | null }[]>([]);

  const [fitYear, setFitYear] = useState<number | ''>('');
  const [fitMake, setFitMake] = useState('');
  const [fitVehicleId, setFitVehicleId] = useState<number | ''>('');
  const [fitMakes, setFitMakes] = useState<string[]>([]);
  const [fitModels, setFitModels] = useState<{ id: number; model: string; trim: string | null }[]>([]);

  useEffect(() => {
    if (partVehicleYear === '') { setPartMakes([]); setPartVehicleMake(''); setPartModels([]); setPartVehicleId(''); return; }
    api.getVehicleMakes(partVehicleYear).then(setPartMakes).catch(() => setPartMakes([]));
    setPartVehicleMake(''); setPartModels([]); setPartVehicleId('');
  }, [partVehicleYear]);

  useEffect(() => {
    if (partVehicleYear === '' || !partVehicleMake) { setPartModels([]); setPartVehicleId(''); return; }
    api.getVehicleModels(partVehicleYear, partVehicleMake).then(setPartModels).catch(() => setPartModels([]));
    setPartVehicleId('');
  }, [partVehicleMake]);

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

  // Load SKU code tables when modal opens
  useEffect(() => {
    if (showPartModal && makeCodes.length === 0) {
      api.getMakeCodes().then(setMakeCodes).catch(() => {});
      api.getSystemCodes().then(setSystemCodes).catch(() => {});
    }
  }, [showPartModal]);

  // Load components when system changes
  useEffect(() => {
    if (skuSystem) {
      api.getComponentCodes(skuSystem).then(setComponentCodes).catch(() => setComponentCodes([]));
      setSkuComponent('');
    }
  }, [skuSystem]);

  // Generate SKU preview
  useEffect(() => {
    if (skuMake && skuModel && skuYear && skuSystem && skuComponent) {
      const timer = setTimeout(async () => {
        try {
          const result = await api.generateSku({
            make: skuMake, model: skuModel, year: skuYear as number,
            systemCode: skuSystem, componentCode: skuComponent,
            position: skuPosition || undefined,
          });
          setSkuPreview(result.sku);
          setSkuBarcode(result.barcode_png_base64);
          setPartForm(f => ({ ...f, sku: result.sku, name: f.name || `${result.decoded.component} - ${result.decoded.make} ${result.decoded.model} ${result.decoded.year}` }));
        } catch { setSkuPreview(''); setSkuBarcode(''); }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSkuPreview('');
      setSkuBarcode('');
    }
  }, [skuMake, skuModel, skuYear, skuSystem, skuComponent, skuPosition]);

  // Handle sidebar sub-nav query params
  useEffect(() => {
    const action = searchParams.get('action');
    const focus = searchParams.get('focus');
    if (action === 'new') setShowPartModal(true);
    if (focus === 'search') searchInputRef.current?.focus();
  }, [searchParams]);

  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => { loadData(); }, [search, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partsData, groupsData] = await Promise.all([api.getParts(search, page), api.getInterchangeGroups()]);
      setParts(partsData.parts);
      setTotalPages(partsData.pagination.totalPages);
      setTotal(partsData.pagination.total);
      setGroups(groupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const part = await api.createPart(partForm.sku, partForm.name, partForm.description || undefined, partForm.condition, partForm.minStock, partForm.costCents);
      if (partVehicleId !== '') {
        try { await api.addFitment(part.id, partVehicleId); } catch {}
      }
      setShowPartModal(false);
      setPartForm({ sku: '', name: '', description: '', condition: 'UNKNOWN', minStock: 5, costCents: null });
      setPartVehicleYear(''); setPartVehicleMake(''); setPartVehicleId('');
      toast.success(`Part "${part.name}" created`);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create part');
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVehicle(vehicleForm.year, vehicleForm.make, vehicleForm.model, vehicleForm.trim || undefined);
      setShowVehicleModal(false);
      setVehicleForm({ year: 2024, make: '', model: '', trim: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
    }
  };

  const handleAddFitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || fitVehicleId === '') return;
    try {
      await api.addFitment(selectedPart.id, fitVehicleId);
      setShowFitmentModal(false);
      setFitYear(''); setFitMake(''); setFitVehicleId('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fitment');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInterchangeGroup(groupForm.name, groupForm.description || undefined);
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  const handleAddToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || selectedGroupId === '') return;
    try {
      await api.addGroupMember(selectedGroupId, selectedPart.id);
      setShowAddToGroupModal(false);
      setSelectedGroupId('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to group');
    }
  };

  const inputCls = "w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm";
  const selectCls = inputCls;
  const yearOptions = Array.from({ length: 27 }, (_, i) => 2000 + i).reverse();

  const exportToCSV = async () => {
    try {
      // Fetch all parts for export
      const allParts = await api.getParts(undefined, undefined, 5000);
      const onHand = await api.getOnHand();
      
      // Build quantity map
      const qtyMap = new Map<number, number>();
      onHand.forEach(item => {
        const current = qtyMap.get(item.partId) || 0;
        qtyMap.set(item.partId, current + item.quantity);
      });
      
      // Build CSV
      const headers = ['SKU', 'Name', 'Description', 'Condition', 'Min Stock', 'Unit Cost', 'On Hand', 'Value'];
      const rows = allParts.parts.map(part => {
        const qty = qtyMap.get(part.id) || 0;
        const cost = part.costCents ? (part.costCents / 100).toFixed(2) : '';
        const value = part.costCents ? ((part.costCents * qty) / 100).toFixed(2) : '';
        return [
          part.sku,
          `"${part.name.replace(/"/g, '""')}"`,
          `"${(part.description || '').replace(/"/g, '""')}"`,
          part.condition,
          part.minStock.toString(),
          cost,
          qty.toString(),
          value
        ].join(',');
      });
      
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parts-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allParts.parts.length} parts to CSV`);
    } catch (err) {
      toast.error('Failed to export parts');
    }
  };

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Parts Catalog</h1>
            <p className="text-sm text-slate-500 mt-2">Manage parts, fitments, and interchange groups</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm whitespace-nowrap text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {isManager && (
              <>
                <button onClick={() => setShowVehicleModal(true)} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm whitespace-nowrap text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer">
                  <Car className="w-4 h-4" /> Vehicle
                </button>
                <button onClick={() => setShowGroupModal(true)} className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm whitespace-nowrap text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer">
                  <Link2 className="w-4 h-4" /> Group
                </button>
                <button onClick={() => setShowPartModal(true)} className="inline-flex items-center gap-3 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm whitespace-nowrap transition-colors cursor-pointer">
                  <Plus className="w-4 h-4" /> New Part
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Search */}
        <div className="relative mb-8">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by SKU, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
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
          ) : parts.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-400">No parts found</h3>
              <p className="text-sm text-slate-600 mt-1">Create your first part to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Barcode</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Condition</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fitments</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Groups</th>
                      {isManager && <th className="px-8 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {parts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/parts/${part.id}`)}>
                        <td className="px-8 py-5">
                          <span className="inline-flex px-4 py-2 bg-amber-500/10 text-amber-400 text-xs font-mono font-semibold rounded-lg">{part.sku}</span>
                        </td>
                        <td className="px-8 py-5">
                          {part.barcodeData ? (
                            <img
                              src={`data:image/png;base64,${part.barcodeData}`}
                              alt="Barcode"
                              className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); setBarcodeModal({ sku: part.sku, barcode: part.barcodeData! }); }}
                            />
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-sm text-white font-medium">{part.name}</td>
                        <td className="px-8 py-5">
                          <ConditionBadge condition={part.condition || 'UNKNOWN'} />
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-400">{part.description || '—'}</td>
                        <td className="px-8 py-5">
                          {part.fitments && part.fitments.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-md">
                              <Car className="w-3 h-3" /> {part.fitments.length}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">None</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-400">
                          {part.interchangeMembers && part.interchangeMembers.length > 0
                            ? part.interchangeMembers.map((m) => m.group?.name).join(', ')
                            : <span className="text-xs text-slate-600">None</span>}
                        </td>
                        {isManager && (
                          <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setSelectedPart(part); setShowFitmentModal(true); }} className="px-5 py-2.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border whitespace-nowrap border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">+ Fitment</button>
                              <button onClick={() => { setSelectedPart(part); setShowAddToGroupModal(true); }} className="px-5 py-2.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border whitespace-nowrap border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">+ Group</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-8 py-5 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    Page {page} of {totalPages} · {total.toLocaleString()} parts
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* Modals */}
      {showPartModal && <Modal title="Create New Part" onClose={() => { setShowPartModal(false); setUseSkuGen(true); setSkuMake(''); setSkuModel(''); setSkuYear(2024); setSkuSystem(''); setSkuComponent(''); setSkuPosition(''); setSkuPreview(''); setSkuBarcode(''); setPartForm({ sku: '', name: '', description: '', condition: 'UNKNOWN' }); }}>
        <form onSubmit={handleCreatePart} className="space-y-4">
          {/* SKU Generation Toggle */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">
              {useSkuGen ? 'Select vehicle details to auto-generate SKU & barcode' : 'Manually enter a SKU identifier'}
            </p>
            <button type="button" onClick={() => setUseSkuGen(!useSkuGen)} className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${useSkuGen ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {useSkuGen ? '✓ Auto-Generate SKU' : 'Enter SKU Manually'}
            </button>
          </div>

          {useSkuGen ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Make">
                  <select className={selectCls} value={skuMake} onChange={(e) => setSkuMake(e.target.value)} required>
                    <option value="">Select...</option>
                    {makeCodes.map(mc => <option key={mc.code} value={mc.make}>{mc.make}</option>)}
                  </select>
                </Field>
                <Field label="Model">
                  <input type="text" className={inputCls} value={skuModel} onChange={(e) => setSkuModel(e.target.value)} required placeholder="Mustang" />
                </Field>
                <Field label="Year">
                  <input type="number" className={inputCls} value={skuYear} onChange={(e) => setSkuYear(e.target.value ? parseInt(e.target.value) : '')} required min={1950} max={2099} />
                </Field>
                <Field label="System">
                  <select className={selectCls} value={skuSystem} onChange={(e) => setSkuSystem(e.target.value)} required>
                    <option value="">Select...</option>
                    {systemCodes.map(sc => <option key={sc.code} value={sc.code}>{sc.name}</option>)}
                  </select>
                </Field>
                <Field label="Component">
                  <select className={selectCls} value={skuComponent} onChange={(e) => setSkuComponent(e.target.value)} required>
                    <option value="">Select...</option>
                    {componentCodes.map(cc => <option key={cc.code} value={cc.code}>{cc.name}</option>)}
                  </select>
                </Field>
                <Field label="Position (opt.)">
                  <select className={selectCls} value={skuPosition} onChange={(e) => setSkuPosition(e.target.value)}>
                    <option value="">None</option>
                    <option value="LF">Left Front</option>
                    <option value="RF">Right Front</option>
                    <option value="LR">Left Rear</option>
                    <option value="RR">Right Rear</option>
                    <option value="L">Left</option>
                    <option value="R">Right</option>
                    <option value="F">Front</option>
                    <option value="RE">Rear</option>
                  </select>
                </Field>
              </div>
              {skuPreview && (
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Generated SKU</p>
                  <p className="text-lg font-mono font-bold text-amber-400">{skuPreview}</p>
                  {skuBarcode && <img src={`data:image/png;base64,${skuBarcode}`} alt="Barcode preview" className="mt-3 mx-auto max-w-full" />}
                </div>
              )}
            </>
          ) : (
            <Field label="SKU"><input type="text" className={inputCls} value={partForm.sku} onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })} required placeholder="BRK-001" /></Field>
          )}

          <Field label="Name"><input type="text" className={inputCls} value={partForm.name} onChange={(e) => setPartForm({ ...partForm, name: e.target.value })} required placeholder="Brake Pad Set" /></Field>
          <Field label="Description (optional)"><input type="text" className={inputCls} value={partForm.description} onChange={(e) => setPartForm({ ...partForm, description: e.target.value })} placeholder="Front brake pads for sedans" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Condition">
              <select className={selectCls} value={partForm.condition} onChange={(e) => setPartForm({ ...partForm, condition: e.target.value as PartCondition })}>
                {PART_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Min Stock">
              <input type="number" className={inputCls} value={partForm.minStock} onChange={(e) => setPartForm({ ...partForm, minStock: parseInt(e.target.value) || 0 })} min={0} placeholder="5" />
            </Field>
            <Field label="Unit Cost ($)">
              <input type="number" className={inputCls} step="0.01" min="0" placeholder="0.00" value={partForm.costCents ? (partForm.costCents / 100).toFixed(2) : ''} onChange={(e) => { const val = parseFloat(e.target.value); setPartForm({ ...partForm, costCents: isNaN(val) ? null : Math.round(val * 100) }); }} />
            </Field>
          </div>
          <div className="border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-500 mb-3">Optionally link a vehicle fitment:</p>
            <Field label="Year">
              <select className={selectCls} value={partVehicleYear} onChange={(e) => setPartVehicleYear(e.target.value ? parseInt(e.target.value) : '')}>
                <option value="">-- No vehicle --</option>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            {partVehicleYear !== '' && <Field label="Make"><select className={selectCls} value={partVehicleMake} onChange={(e) => setPartVehicleMake(e.target.value)}><option value="">Select make...</option>{partMakes.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>}
            {partVehicleMake && <Field label="Model"><select className={selectCls} value={partVehicleId} onChange={(e) => setPartVehicleId(e.target.value ? parseInt(e.target.value) : '')}><option value="">Select model...</option>{partModels.map((m) => <option key={m.id} value={m.id}>{m.model}{m.trim ? ` (${m.trim})` : ''}</option>)}</select></Field>}
          </div>
          <ModalFooter onCancel={() => setShowPartModal(false)} label="Create Part" />
        </form>
      </Modal>}

      {showVehicleModal && <Modal title="Create New Vehicle" onClose={() => setShowVehicleModal(false)}>
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <Field label="Year"><input type="number" className={inputCls} value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })} required min={2000} /></Field>
          <Field label="Make"><input type="text" className={inputCls} value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} required placeholder="Honda" /></Field>
          <Field label="Model"><input type="text" className={inputCls} value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required placeholder="Civic" /></Field>
          <Field label="Trim (optional)"><input type="text" className={inputCls} value={vehicleForm.trim} onChange={(e) => setVehicleForm({ ...vehicleForm, trim: e.target.value })} placeholder="EX" /></Field>
          <ModalFooter onCancel={() => setShowVehicleModal(false)} label="Create Vehicle" />
        </form>
      </Modal>}

      {showFitmentModal && selectedPart && <Modal title={`Add Fitment to ${selectedPart.sku}`} onClose={() => setShowFitmentModal(false)}>
        <form onSubmit={handleAddFitment} className="space-y-4">
          <Field label="Year"><select className={selectCls} value={fitYear} onChange={(e) => setFitYear(e.target.value ? parseInt(e.target.value) : '')} required><option value="">Select year...</option>{yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}</select></Field>
          {fitYear !== '' && <Field label="Make"><select className={selectCls} value={fitMake} onChange={(e) => setFitMake(e.target.value)} required><option value="">Select make...</option>{fitMakes.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>}
          {fitMake && <Field label="Model"><select className={selectCls} value={fitVehicleId} onChange={(e) => setFitVehicleId(e.target.value ? parseInt(e.target.value) : '')} required><option value="">Select model...</option>{fitModels.map((m) => <option key={m.id} value={m.id}>{m.model}{m.trim ? ` (${m.trim})` : ''}</option>)}</select></Field>}
          <ModalFooter onCancel={() => setShowFitmentModal(false)} label="Add Fitment" />
        </form>
      </Modal>}

      {showGroupModal && <Modal title="Create Interchange Group" onClose={() => setShowGroupModal(false)}>
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Field label="Group Name"><input type="text" className={inputCls} value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} required placeholder="Front Brake Pads - Civic" /></Field>
          <Field label="Description (optional)"><input type="text" className={inputCls} value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="Interchangeable parts" /></Field>
          <ModalFooter onCancel={() => setShowGroupModal(false)} label="Create Group" />
        </form>
      </Modal>}

      {showAddToGroupModal && selectedPart && <Modal title={`Add ${selectedPart.sku} to Group`} onClose={() => setShowAddToGroupModal(false)}>
        <form onSubmit={handleAddToGroup} className="space-y-4">
          <Field label="Select Group">
            <select className={selectCls} value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : '')} required>
              <option value="">Choose a group...</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <ModalFooter onCancel={() => setShowAddToGroupModal(false)} label="Add to Group" />
        </form>
      </Modal>}
      {/* Barcode Enlarge Modal */}
      {barcodeModal && <Modal title={`Barcode: ${barcodeModal.sku}`} onClose={() => setBarcodeModal(null)}>
        <div className="flex flex-col items-center">
          <img src={`data:image/png;base64,${barcodeModal.barcode}`} alt="Barcode" className="max-w-full" />
          <p className="mt-3 text-lg font-mono font-bold text-amber-400">{barcodeModal.sku}</p>
          <button
            onClick={() => {
              const win = window.open('', '_blank');
              if (!win) return;
              win.document.write(`<html><head><title>${barcodeModal.sku}</title><style>body{font-family:monospace;text-align:center;padding:40px}img{max-width:100%}h2{margin:20px 0}</style></head><body><img src="data:image/png;base64,${barcodeModal.barcode}" /><h2>${barcodeModal.sku}</h2></body></html>`);
              win.document.close();
              win.print();
            }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Barcode
          </button>
        </div>
      </Modal>}
    </Layout>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ModalFooter({ onCancel, label }: { onCancel: () => void; label: string }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
      <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer">Cancel</button>
      <button type="submit" className="px-4 py-2.5 text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer">{label}</button>
    </div>
  );
}
