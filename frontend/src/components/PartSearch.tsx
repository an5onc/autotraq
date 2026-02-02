import { useState, useRef, useEffect } from 'react';
import { Part } from '../api/client';
import { Search, X } from 'lucide-react';

interface PartSearchProps {
  parts: Part[];
  value: string;
  onChange: (partId: string) => void;
  required?: boolean;
  className?: string;
}

export function PartSearch({ parts, value, onChange, required, className }: PartSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = parts.find(p => String(p.id) === value);

  useEffect(() => {
    if (selected && !open) setQuery('');
  }, [value, selected, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? parts.filter(p => {
        const q = query.toLowerCase();
        return p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      }).slice(0, 50)
    : parts.slice(0, 50);

  const inputCls = "w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm";

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      {selected && !open ? (
        <div
          className={`${inputCls} flex items-center justify-between cursor-pointer`}
          onClick={() => { setOpen(true); setQuery(''); }}
        >
          <span className="truncate"><span className="font-medium">{selected.sku}</span> — {selected.name}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); }} className="ml-2 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            className={`${inputCls} pl-10`}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by SKU or name..."
            autoComplete="off"
          />
        </div>
      )}
      {/* Hidden input for required validation */}
      {required && <input type="text" value={value} required className="sr-only" tabIndex={-1} onChange={() => {}} />}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No parts found</div>
          ) : (
            filtered.map(p => (
              <button
                key={p.id}
                type="button"
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors cursor-pointer ${String(p.id) === value ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300'}`}
                onClick={() => { onChange(String(p.id)); setOpen(false); setQuery(''); }}
              >
                <span className="font-medium text-white">{p.sku}</span> <span className="text-slate-400">— {p.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
