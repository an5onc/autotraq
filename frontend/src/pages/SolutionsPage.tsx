import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../api/client';
import {
  Car, Search, Package, RefreshCw, Sparkles,
  CheckCircle2, Repeat2, ShoppingBag, AlertCircle,
  ChevronRight, Zap, Wind, Gauge, Settings, Thermometer,
  Droplets, Fuel, Radio, ArrowRight, Hash, Wrench,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3;
type ResultTab = 'all' | 'exact' | 'interchange' | 'alternatives';

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
  query: { vehicle: string; matchedVehicleId: number | null; totalResults: number };
}

interface RelatedPart {
  id: number;
  name: string;
  sku: string;
  condition: string;
  costCents?: number;
  stockOnHand: number;
}

// ─── System categories (Step 0) ──────────────────────────────────────────────

const SYSTEMS = [
  { id: 'brake',       label: 'Brakes',        icon: Gauge,       color: 'red',    keywords: 'brake pad rotor caliper brake line' },
  { id: 'engine',      label: 'Engine',         icon: Settings,    color: 'amber',  keywords: 'engine piston gasket valve timing' },
  { id: 'electrical',  label: 'Electrical',     icon: Zap,         color: 'yellow', keywords: 'battery alternator starter fuse relay wiring' },
  { id: 'suspension',  label: 'Suspension',     icon: Car,         color: 'blue',   keywords: 'strut shock spring ball joint tie rod control arm' },
  { id: 'cooling',     label: 'Cooling',        icon: Thermometer, color: 'cyan',   keywords: 'water pump thermostat radiator hose coolant' },
  { id: 'fuel',        label: 'Fuel System',    icon: Fuel,        color: 'orange', keywords: 'fuel pump filter injector throttle body' },
  { id: 'ac',          label: 'A/C & Heat',     icon: Wind,        color: 'sky',    keywords: 'ac compressor condenser heater core blower' },
  { id: 'drivetrain',  label: 'Drivetrain',     icon: Wrench,      color: 'purple', keywords: 'axle cv joint transmission clutch driveshaft' },
  { id: 'exhaust',     label: 'Exhaust',        icon: Droplets,    color: 'stone',  keywords: 'muffler catalytic converter oxygen sensor pipe' },
  { id: 'ignition',    label: 'Ignition',       icon: Radio,       color: 'pink',   keywords: 'spark plug coil ignition wire distributor' },
];

const colorMap: Record<string, string> = {
  red:    'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
  amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
  cyan:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
  sky:    'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
  stone:  'bg-stone-500/10 text-stone-400 border-stone-500/20 hover:bg-stone-500/20',
  pink:   'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20',
};

const colorActiveMap: Record<string, string> = {
  red:    'bg-red-500 text-white border-red-500',
  amber:  'bg-amber-500 text-slate-900 border-amber-500',
  yellow: 'bg-yellow-400 text-slate-900 border-yellow-400',
  blue:   'bg-blue-500 text-white border-blue-500',
  cyan:   'bg-cyan-500 text-slate-900 border-cyan-500',
  orange: 'bg-orange-500 text-white border-orange-500',
  sky:    'bg-sky-500 text-white border-sky-500',
  purple: 'bg-purple-500 text-white border-purple-500',
  stone:  'bg-stone-500 text-white border-stone-500',
  pink:   'bg-pink-500 text-white border-pink-500',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents?: number) {
  if (!cents) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function conditionColor(c: string) {
  switch (c) {
    case 'NEW':       return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'EXCELLENT': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'GOOD':      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'FAIR':      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'POOR':      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:          return 'bg-slate-700/50 text-slate-400 border-slate-600';
  }
}

function matchBadge(type: string) {
  switch (type) {
    case 'exact':       return { label: 'Exact Fit',    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
    case 'interchange': return { label: 'Interchange',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         icon: <Repeat2 className="w-3.5 h-3.5" /> };
    case 'alternative': return { label: 'Alternative',  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      icon: <ShoppingBag className="w-3.5 h-3.5" /> };
    default:            return { label: type,           cls: 'bg-slate-700/50 text-slate-400',                           icon: null };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SolutionsPage() {
  const [step, setStep] = useState<Step>(0);

  // Step 0 — system
  const [selectedSystem, setSelectedSystem] = useState<typeof SYSTEMS[0] | null>(null);

  // Step 1 — vehicle (Year → Make → Model)
  const [allYears, setAllYears]   = useState<number[]>([]);
  const [makes, setMakes]         = useState<string[]>([]);
  const [models, setModels]       = useState<string[]>([]);
  const [selectedYear, setSelectedYear]   = useState('');
  const [selectedMake, setSelectedMake]   = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Step 2 — part query + OEM shortcut
  const [partQuery, setPartQuery] = useState('');
  const [oemQuery, setOemQuery]   = useState('');
  const [oemResults, setOemResults] = useState<RelatedPart[] | null>(null);
  const [oemLoading, setOemLoading] = useState(false);
  const partInputRef = useRef<HTMLInputElement>(null);

  // Step 3 — results
  const [results, setResults]         = useState<SolutionResult | null>(null);
  const [relatedParts, setRelatedParts] = useState<RelatedPart[]>([]);
  const [activeTab, setActiveTab]     = useState<ResultTab>('all');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const vehicleLabel = selectedYear && selectedMake && selectedModel
    ? `${selectedYear} ${selectedMake} ${selectedModel}`
    : '';

  const apiFetch = (endpoint: string) => {
    const base = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
    const token = api.getToken();
    return fetch(`${base}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.json());
  };

  // Load all years on mount
  useEffect(() => {
    apiFetch('/solutions/years')
      .then(d => setAllYears(d.data || []))
      .catch(() => {});
  }, []);

  // Load makes when year selected
  useEffect(() => {
    if (!selectedYear) { setMakes([]); return; }
    setSelectedMake('');
    setSelectedModel('');
    setModels([]);
    apiFetch(`/solutions/makes?year=${selectedYear}`)
      .then(d => setMakes(d.data || []))
      .catch(() => {});
  }, [selectedYear]);

  // Load models when make selected
  useEffect(() => {
    if (!selectedYear || !selectedMake) { setModels([]); return; }
    setSelectedModel('');
    apiFetch(`/solutions/models?make=${encodeURIComponent(selectedMake)}&year=${selectedYear}`)
      .then(d => setModels(d.data || []))
      .catch(() => {});
  }, [selectedMake]);

  // Auto-advance to step 2 when vehicle is complete
  useEffect(() => {
    if (selectedYear && selectedMake && selectedModel && step === 1) {
      setStep(2);
      setTimeout(() => partInputRef.current?.focus(), 100);
    }
  }, [selectedModel]);

  // OEM lookup (debounced)
  useEffect(() => {
    if (!oemQuery.trim() || oemQuery.trim().length < 3) { setOemResults(null); return; }
    const t = setTimeout(() => {
      setOemLoading(true);
      apiFetch(`/solutions/by-sku?q=${encodeURIComponent(oemQuery.trim())}`)
        .then(d => setOemResults(d.data || []))
        .catch(() => setOemResults([]))
        .finally(() => setOemLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [oemQuery]);

  const handleSearch = async () => {
    if (!selectedYear || !selectedMake || !selectedModel) return;
    setLoading(true);
    setError('');
    setResults(null);
    setRelatedParts([]);
    setStep(3);

    try {
      const params = new URLSearchParams({ year: selectedYear, make: selectedMake, model: selectedModel });
      if (partQuery.trim()) params.set('partName', partQuery.trim());
      if (selectedSystem) params.set('system', selectedSystem.id);

      const data = await apiFetch(`/solutions/search?${params}`);
      if (data.data) {
        setResults(data.data);
        setActiveTab('all');

        // Load related parts in background
        const allIds = [
          ...data.data.exact.map((p: SolutionPart) => p.id),
          ...data.data.interchange.map((p: SolutionPart) => p.id),
        ];
        if (allIds.length > 0) {
          const vid = data.data.query.matchedVehicleId;
          apiFetch(`/solutions/related?partIds=${allIds.join(',')}&vehicleId=${vid || ''}`)
            .then(d => setRelatedParts(d.data || []))
            .catch(() => {});
        }
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
    setStep(0);
    setSelectedSystem(null);
    setSelectedYear('');
    setSelectedMake('');
    setSelectedModel('');
    setPartQuery('');
    setOemQuery('');
    setOemResults(null);
    setResults(null);
    setRelatedParts([]);
    setError('');
  };

  const getFilteredParts = (): SolutionPart[] => {
    if (!results) return [];
    switch (activeTab) {
      case 'exact':        return results.exact;
      case 'interchange':  return results.interchange;
      case 'alternatives': return results.alternatives;
      default:             return [...results.exact, ...results.interchange, ...results.alternatives];
    }
  };

  // ─── Step indicators ──────────────────────────────────────────────────────

  const STEPS = [
    { num: 0, label: 'System' },
    { num: 1, label: 'Vehicle' },
    { num: 2, label: 'Part' },
    { num: 3, label: 'Results' },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400" />
          Solution Finder
        </h1>
        <p className="text-slate-400 mt-1">Walk us through the problem — we'll find every part that can fix it.</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => step > s.num ? setStep(s.num as Step) : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                step === s.num
                  ? 'bg-amber-500 text-slate-900'
                  : step > s.num
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer'
                  : 'bg-slate-900 text-slate-600 cursor-default'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.num ? 'bg-emerald-500 text-white' : 'bg-current/20'
              }`}>
                {step > s.num ? '✓' : s.num + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-700" />}
          </div>
        ))}
        {step > 0 && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Start Over
          </button>
        )}
      </div>

      {/* ── STEP 0: System Selector ── */}
      {step === 0 && (
        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-bold text-white mb-2">What system needs attention?</h2>
            <p className="text-slate-500 text-sm mb-8">Pick the area of the vehicle — this helps us prioritize exact fits.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {SYSTEMS.map(sys => {
                const Icon = sys.icon;
                const isActive = selectedSystem?.id === sys.id;
                return (
                  <button
                    key={sys.id}
                    onClick={() => {
                      setSelectedSystem(sys);
                      setPartQuery(sys.keywords.split(' ')[0]);
                      setStep(1);
                    }}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border text-sm font-semibold transition-all cursor-pointer ${
                      isActive ? colorActiveMap[sys.color] : colorMap[sys.color]
                    }`}
                  >
                    <Icon className="w-7 h-7" />
                    {sys.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skip — I know the part name */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-800" />
            <button
              onClick={() => setStep(1)}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Skip — I already know the part name →
            </button>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* OEM / Part number shortcut */}
          <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">Have a part number?</h3>
              <span className="text-xs text-slate-600">Jump straight to the part — no vehicle needed.</span>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={oemQuery}
                onChange={e => setOemQuery(e.target.value)}
                placeholder="Enter OEM number, SKU, or part name..."
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {oemLoading && (
                <div className="flex items-center px-4">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {oemResults && oemResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {oemResults.map(p => (
                  <Link
                    key={p.id}
                    to={`/parts/${p.id}`}
                    className="flex items-center justify-between p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      <p className="text-slate-500 text-xs font-mono mt-0.5">{p.sku}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${conditionColor(p.condition)}`}>{p.condition}</span>
                      <span className={`text-sm font-bold ${p.stockOnHand > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.stockOnHand > 0 ? `${p.stockOnHand} in stock` : 'Out of stock'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {oemResults && oemResults.length === 0 && oemQuery.length >= 3 && !oemLoading && (
              <p className="mt-3 text-sm text-slate-600">No parts found for "{oemQuery}"</p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 1: Vehicle (Year → Make → Model) ── */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Car className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">What's the vehicle?</h2>
            {selectedSystem && (
              <span className={`ml-auto flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold border ${colorMap[selectedSystem.color]}`}>
                <selectedSystem.icon className="w-3.5 h-3.5" />
                {selectedSystem.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Year — first */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Year</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select Year...</option>
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Make — second */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Make</label>
              <select
                value={selectedMake}
                onChange={e => setSelectedMake(e.target.value)}
                disabled={!selectedYear}
                className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">Select Make...</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Model — third */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Model</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">Select Model...</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Progress hint */}
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-600">
            <span className={selectedYear ? 'text-emerald-400' : ''}>Year {selectedYear ? '✓' : ''}</span>
            <ChevronRight className="w-3 h-3" />
            <span className={selectedMake ? 'text-emerald-400' : ''}>Make {selectedMake ? '✓' : ''}</span>
            <ChevronRight className="w-3 h-3" />
            <span className={selectedModel ? 'text-emerald-400' : ''}>Model — selecting will advance automatically</span>
          </div>
        </div>
      )}

      {/* ── STEP 2: Part Query ── */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">What do you need?</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Vehicle: <span className="text-amber-400 font-semibold">{vehicleLabel}</span>
            {selectedSystem && (
              <> · System: <span className="text-amber-400 font-semibold">{selectedSystem.label}</span></>
            )}
          </p>

          {/* System quick-select (re-pick or change) */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SYSTEMS.map(sys => {
              const Icon = sys.icon;
              const isActive = selectedSystem?.id === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => {
                    setSelectedSystem(sys);
                    setPartQuery(sys.keywords.split(' ')[0]);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isActive ? colorActiveMap[sys.color] : colorMap[sys.color]
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sys.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <input
              ref={partInputRef}
              type="text"
              value={partQuery}
              onChange={e => setPartQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. brake pads, alternator, tail light assembly..."
              className="flex-1 px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2.5 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Search className="w-5 h-5" />
              Find Parts
            </button>
          </div>
          <button
            onClick={handleSearch}
            className="mt-3 text-sm text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
          >
            Show all parts that fit this vehicle →
          </button>
        </div>
      )}

      {/* ── STEP 3: Results ── */}
      {step === 3 && (
        <>
          {/* Vehicle + system summary bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-bold">{vehicleLabel}</p>
                <p className="text-slate-500 text-xs">
                  {selectedSystem && <span className="text-amber-400">{selectedSystem.label} · </span>}
                  {partQuery ? `"${partQuery}"` : 'All fitting parts'}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> New Search
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Searching inventory...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-red-400 flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {results && !loading && (
            <>
              {/* Summary count cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Found',  count: results.query.totalResults,    icon: Sparkles,      color: 'text-amber-400',   bg: 'bg-amber-500/10' },
                  { label: 'Exact Fit',    count: results.exact.length,          icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Interchange',  count: results.interchange.length,    icon: Repeat2,       color: 'text-blue-400',    bg: 'bg-blue-500/10' },
                  { label: 'Alternatives', count: results.alternatives.length,   icon: ShoppingBag,   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
                ].map(card => (
                  <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <p className="text-2xl font-black text-white">{card.count}</p>
                    <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { id: 'all' as ResultTab,          label: 'All Results',   count: results.query.totalResults },
                  { id: 'exact' as ResultTab,        label: 'Exact Fit',     count: results.exact.length },
                  { id: 'interchange' as ResultTab,  label: 'Interchange',   count: results.interchange.length },
                  { id: 'alternatives' as ResultTab, label: 'Alternatives',  count: results.alternatives.length },
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-slate-900/20' : 'bg-slate-700'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Part cards */}
              <div className="space-y-4 mb-10">
                {getFilteredParts().length === 0 ? (
                  <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                    <Package className="w-14 h-14 mx-auto mb-4 text-slate-700" />
                    <p className="text-lg font-semibold text-slate-400">No parts found</p>
                    <p className="text-sm text-slate-600 mt-1">Try a different part name, or browse all parts for this vehicle.</p>
                    <button
                      onClick={() => { setPartQuery(''); handleSearch(); }}
                      className="mt-5 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Show all fitting parts
                    </button>
                  </div>
                ) : (
                  getFilteredParts().map(part => {
                    const badge = matchBadge(part.matchType);
                    const price = formatPrice(part.costCents);
                    const inStock = part.stockOnHand > 0;
                    return (
                      <div
                        key={`${part.matchType}-${part.id}`}
                        className={`bg-slate-900 border rounded-2xl p-6 transition-colors hover:border-slate-700 ${
                          part.matchType === 'exact' ? 'border-emerald-500/20' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Left: match type icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            part.matchType === 'exact' ? 'bg-emerald-500/10' :
                            part.matchType === 'interchange' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                          }`}>
                            {part.matchType === 'exact'
                              ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              : part.matchType === 'interchange'
                              ? <Repeat2 className="w-6 h-6 text-blue-400" />
                              : <ShoppingBag className="w-6 h-6 text-amber-400" />
                            }
                          </div>

                          {/* Center: part info */}
                          <div className="flex-1 min-w-0">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                                {badge.icon}
                                {badge.label}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${conditionColor(part.condition)}`}>
                                {part.condition}
                              </span>
                              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
                                {part.sku}
                              </span>
                            </div>

                            {/* Name */}
                            <h3 className="text-lg font-bold text-white mb-1">{part.name}</h3>

                            {part.description && (
                              <p className="text-sm text-slate-400 mb-2 leading-relaxed">{part.description}</p>
                            )}

                            {/* Fitment confirmation */}
                            {part.matchType === 'exact' && part.fitsVehicle && (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-medium mb-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirmed fit for {part.fitsVehicle}
                              </div>
                            )}
                            {part.fitsVehicles && part.fitsVehicles.length > 0 && part.matchType !== 'exact' && (
                              <p className="text-xs text-slate-500 mt-1">
                                Also fits: {part.fitsVehicles.slice(0, 4).join(' · ')}
                                {part.fitsVehicles.length > 4 && ` +${part.fitsVehicles.length - 4} more`}
                              </p>
                            )}
                            {part.interchangeGroup && (
                              <p className="text-xs text-slate-600 mt-1">Interchange group: {part.interchangeGroup}</p>
                            )}
                          </div>

                          {/* Right: price + stock + link */}
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-black text-white">{price ?? '—'}</p>
                            <p className={`text-sm font-semibold mt-1 ${inStock ? 'text-emerald-400' : 'text-red-400'}`}>
                              {inStock ? `${part.stockOnHand} in stock` : 'Out of stock'}
                            </p>
                            <Link
                              to={`/parts/${part.id}`}
                              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                            >
                              View Part <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Related / Complementary Parts ── */}
              {relatedParts.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Complete the Repair</h3>
                      <p className="text-xs text-slate-500">Parts commonly needed alongside this repair</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {relatedParts.map(p => (
                      <Link
                        key={p.id}
                        to={`/parts/${p.id}`}
                        className="flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {p.costCents && <p className="text-sm font-bold text-white">{formatPrice(p.costCents)}</p>}
                          <p className={`text-xs ${p.stockOnHand > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {p.stockOnHand > 0 ? `${p.stockOnHand} in stock` : 'Out'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  );
}

export default SolutionsPage;
