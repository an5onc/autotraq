import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../api/client';
import {
  Car, Search, Package, RefreshCw, Sparkles,
  CheckCircle2, Repeat2, ShoppingBag, AlertCircle, ChevronRight
} from 'lucide-react';

type Tab = 'exact' | 'interchange' | 'alternatives' | 'all';

interface SolutionPart {
  id: number;
  name: string;
  sku: string;
  description?: string;
  condition: string;
  costCents?: number;
  matchType: 'exact' | 'interchange' | 'alternative';
  fitsVehicle?: string;
  fitsVehicles?: string[];
  interchangeGroup?: string;
  stockOnHand: number;
}

interface SolutionResult {
  exact: SolutionPart[];
  interchange: SolutionPart[];
  alternatives: SolutionPart[];
  query: {
    vehicle: string;
    matchedVehicleId: number | null;
    totalResults: number;
  };
}

export function SolutionsPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Vehicle selection
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Part search
  const [partQuery, setPartQuery] = useState('');
  
  // Results
  const [results, setResults] = useState<SolutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [error, setError] = useState('');

  const apiFetch = (endpoint: string) => {
    const base = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
    const token = api.getToken();
    return fetch(`${base}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.json());
  };

  // Load makes on mount
  useEffect(() => {
    apiFetch('/solutions/makes')
      .then(d => setMakes(d.data || []))
      .catch(() => {});
  }, []);

  // Load models when make changes
  useEffect(() => {
    if (!selectedMake) { setModels([]); return; }
    setSelectedModel('');
    setSelectedYear('');
    setYears([]);
    apiFetch(`/solutions/models?make=${encodeURIComponent(selectedMake)}`)
      .then(d => setModels(d.data || []))
      .catch(() => {});
  }, [selectedMake]);

  // Load years when model changes
  useEffect(() => {
    if (!selectedMake || !selectedModel) { setYears([]); return; }
    setSelectedYear('');
    apiFetch(`/solutions/years?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`)
      .then(d => setYears(d.data || []))
      .catch(() => {});
  }, [selectedModel]);

  const canProceedToStep2 = selectedMake && selectedModel && selectedYear;

  const handleSearch = async () => {
    if (!canProceedToStep2) return;
    setLoading(true);
    setError('');
    setResults(null);
    setStep(3);

    try {
      const params = new URLSearchParams({
        year: selectedYear,
        make: selectedMake,
        model: selectedModel,
      });
      if (partQuery.trim()) params.set('partName', partQuery.trim());

      const data = await apiFetch(`/solutions/search?${params}`);
      if (data.data) {
        setResults(data.data);
        setActiveTab('all');
      } else {
        setError(data.error?.message || 'Search failed');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setPartQuery('');
    setResults(null);
    setError('');
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return '—';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const conditionColor = (c: string) => {
    switch (c) {
      case 'NEW': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'EXCELLENT': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'GOOD': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'FAIR': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'POOR': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const matchIcon = (type: string) => {
    switch (type) {
      case 'exact': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'interchange': return <Repeat2 className="w-4 h-4 text-blue-400" />;
      case 'alternative': return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      default: return null;
    }
  };

  const matchLabel = (type: string) => {
    switch (type) {
      case 'exact': return 'Exact Fit';
      case 'interchange': return 'Interchange';
      case 'alternative': return 'Alternative';
      default: return type;
    }
  };

  const matchBadgeColor = (type: string) => {
    switch (type) {
      case 'exact': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'interchange': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'alternative': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-700 text-slate-400';
    }
  };

  const getFilteredParts = (): SolutionPart[] => {
    if (!results) return [];
    switch (activeTab) {
      case 'exact': return results.exact;
      case 'interchange': return results.interchange;
      case 'alternatives': return results.alternatives;
      case 'all': return [...results.exact, ...results.interchange, ...results.alternatives];
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400" />
          Solution Finder
        </h1>
        <p className="text-slate-400 mt-1">Tell us your vehicle and what you need — we'll find every option.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { num: 1, label: 'Your Vehicle' },
          { num: 2, label: 'What You Need' },
          { num: 3, label: 'Solutions' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              step >= s.num
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-500'
            }`}>
              <span className="font-bold">{s.num}</span>
              {s.label}
            </div>
            {i < 2 && <ChevronRight className="w-4 h-4 text-slate-600" />}
          </div>
        ))}
        {step > 1 && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Start Over
          </button>
        )}
      </div>

      {/* Step 1: Vehicle Selection */}
      {step >= 1 && step < 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
            <Car className="w-6 h-6 text-amber-400" />
            What's your vehicle?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Make */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Make</label>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select Make...</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">Select Model...</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); if (step === 1) setStep(2); }}
                disabled={!selectedModel}
                className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">Select Year...</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Part Search */}
      {step === 2 && canProceedToStep2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2.5">
            <Search className="w-6 h-6 text-amber-400" />
            What do you need?
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Searching for <span className="text-amber-400 font-medium">{selectedYear} {selectedMake} {selectedModel}</span>
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={partQuery}
              onChange={(e) => setPartQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Describe the part you need... (e.g., tail light assembly, brake pads, alternator)"
              className="flex-1 px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              autoFocus
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2.5 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
              Find Solutions
            </button>
          </div>
          <button
            onClick={handleSearch}
            className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Or show all parts for this vehicle →
          </button>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <>
          {/* Vehicle summary bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Car className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-white font-bold">{selectedYear} {selectedMake} {selectedModel}</p>
                {partQuery && <p className="text-slate-500 text-sm">Searching for: "{partQuery}"</p>}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> New Search
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-red-400 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {results && !loading && (
            <>
              {/* Results summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Solutions', count: results.query.totalResults, icon: Sparkles, color: 'amber' },
                  { label: 'Exact Fits', count: results.exact.length, icon: CheckCircle2, color: 'emerald' },
                  { label: 'Interchange', count: results.interchange.length, icon: Repeat2, color: 'blue' },
                  { label: 'Alternatives', count: results.alternatives.length, icon: ShoppingBag, color: 'amber' },
                ].map(card => (
                  <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <card.icon className={`w-5 h-5 text-${card.color}-400`} />
                      <span className="text-2xl font-black text-white">{card.count}</span>
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'all' as Tab, label: 'All Solutions', count: results.query.totalResults },
                  { id: 'exact' as Tab, label: 'Exact Fit', count: results.exact.length },
                  { id: 'interchange' as Tab, label: 'Interchange', count: results.interchange.length },
                  { id: 'alternatives' as Tab, label: 'Alternatives', count: results.alternatives.length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-slate-900/20' : 'bg-slate-700'
                    }`}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Results list */}
              <div className="space-y-3">
                {getFilteredParts().length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <Package className="w-14 h-14 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No parts found</p>
                    <p className="text-sm mt-1">Try a broader search or check a different vehicle.</p>
                  </div>
                ) : (
                  getFilteredParts().map(part => (
                    <div key={`${part.matchType}-${part.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {matchIcon(part.matchType)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${matchBadgeColor(part.matchType)}`}>
                              {matchLabel(part.matchType)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${conditionColor(part.condition)}`}>
                              {part.condition}
                            </span>
                            <span className="text-xs text-slate-600 font-mono">{part.sku}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">{part.name}</h3>
                          {part.description && (
                            <p className="text-sm text-slate-400 mb-2">{part.description}</p>
                          )}
                          {part.fitsVehicle && (
                            <p className="text-xs text-slate-500">
                              <span className="text-emerald-400">✓</span> Fits: {part.fitsVehicle}
                            </p>
                          )}
                          {part.fitsVehicles && part.fitsVehicles.length > 0 && (
                            <p className="text-xs text-slate-500">
                              <span className="text-blue-400">↔</span> Also fits: {part.fitsVehicles.slice(0, 5).join(', ')}
                              {part.fitsVehicles.length > 5 && ` +${part.fitsVehicles.length - 5} more`}
                            </p>
                          )}
                          {part.interchangeGroup && (
                            <p className="text-xs text-slate-500 mt-1">
                              <span className="text-blue-400">🔄</span> Interchange group: {part.interchangeGroup}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-2xl font-black text-white">{formatPrice(part.costCents)}</p>
                          <p className={`text-xs mt-1 ${part.stockOnHand > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {part.stockOnHand > 0 ? `${part.stockOnHand} in stock` : 'Out of stock'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
