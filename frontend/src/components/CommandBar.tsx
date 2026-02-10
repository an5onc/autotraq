import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Part, Vehicle } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Package,
  Car,
  Warehouse,
  ClipboardList,
  ScanLine,
  Users,
  LayoutDashboard,
  ArrowDownToLine,
  Plus,
  Command,
  X,
  CornerDownLeft,
} from 'lucide-react';

interface CommandItem {
  id: string;
  type: 'action' | 'part' | 'vehicle' | 'page';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandBar({ isOpen, onClose }: CommandBarProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<{ parts: Part[]; vehicles: Vehicle[] }>({ parts: [], vehicles: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Static navigation items
  const navigationItems: CommandItem[] = [
    { id: 'nav-dashboard', type: 'page', title: 'Dashboard', subtitle: 'Overview & KPIs', icon: LayoutDashboard, action: () => navigate('/dashboard'), keywords: ['home', 'stats'] },
    { id: 'nav-parts', type: 'page', title: 'Parts', subtitle: 'Browse parts catalog', icon: Package, action: () => navigate('/parts'), keywords: ['catalog', 'sku'] },
    { id: 'nav-vehicles', type: 'page', title: 'Vehicles', subtitle: 'Vehicle database', icon: Car, action: () => navigate('/vehicles'), keywords: ['car', 'make', 'model'] },
    { id: 'nav-inventory', type: 'page', title: 'Inventory', subtitle: 'Stock levels & events', icon: Warehouse, action: () => navigate('/inventory'), keywords: ['stock', 'quantity'] },
    { id: 'nav-requests', type: 'page', title: 'Requests', subtitle: 'Part requests', icon: ClipboardList, action: () => navigate('/requests'), keywords: ['order', 'fulfill'] },
    { id: 'nav-scan', type: 'page', title: 'Scan Barcode', subtitle: 'USB or camera scanner', icon: ScanLine, action: () => navigate('/scan'), keywords: ['barcode', 'qr'] },
  ];

  // Admin-only items
  if (isAdmin) {
    navigationItems.push({
      id: 'nav-admin',
      type: 'page',
      title: 'Admin Panel',
      subtitle: 'User management',
      icon: Users,
      action: () => navigate('/admin'),
      keywords: ['users', 'roles'],
    });
  }

  // Action items
  const actionItems: CommandItem[] = [
    { id: 'action-receive', type: 'action', title: 'Receive Stock', subtitle: 'Add inventory', icon: ArrowDownToLine, action: () => navigate('/inventory'), keywords: ['add', 'inbound'] },
    { id: 'action-new-part', type: 'action', title: 'Create New Part', subtitle: 'Add to catalog', icon: Plus, action: () => navigate('/parts'), keywords: ['add', 'sku'] },
    { id: 'action-scan-usb', type: 'action', title: 'USB Scanner Mode', subtitle: 'Enable barcode scanner', icon: ScanLine, action: () => navigate('/scan?mode=usb'), keywords: ['barcode'] },
    { id: 'action-scan-camera', type: 'action', title: 'Camera Scanner', subtitle: 'Use phone camera', icon: ScanLine, action: () => navigate('/scan?mode=camera'), keywords: ['barcode', 'qr'] },
  ];

  // Search for parts and vehicles
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults({ parts: [], vehicles: [] });
      return;
    }

    const searchDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const [partsRes, vehiclesRes] = await Promise.all([
          api.getParts(query, 1, 5),
          api.getVehicles(query, 1, 5),
        ]);
        setSearchResults({
          parts: partsRes.parts,
          vehicles: vehiclesRes.vehicles,
        });
      } catch {
        setSearchResults({ parts: [], vehicles: [] });
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(searchDebounce);
  }, [query]);

  // Build filtered items
  const getFilteredItems = useCallback((): CommandItem[] => {
    const lowerQuery = query.toLowerCase();
    
    // Convert search results to command items
    const partItems: CommandItem[] = searchResults.parts.map(part => ({
      id: `part-${part.id}`,
      type: 'part',
      title: part.name,
      subtitle: part.sku,
      icon: Package,
      action: () => navigate(`/parts/${part.id}`),
    }));

    const vehicleItems: CommandItem[] = searchResults.vehicles.map(vehicle => ({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle',
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      subtitle: vehicle.trim || undefined,
      icon: Car,
      action: () => navigate(`/vehicles?search=${vehicle.year}+${vehicle.make}+${vehicle.model}`),
    }));

    if (!query) {
      // Show all navigation and actions
      return [...navigationItems, ...actionItems];
    }

    // Filter navigation and actions by query
    const filteredNav = navigationItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle?.toLowerCase().includes(lowerQuery) ||
      item.keywords?.some(k => k.includes(lowerQuery))
    );

    const filteredActions = actionItems.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle?.toLowerCase().includes(lowerQuery) ||
      item.keywords?.some(k => k.includes(lowerQuery))
    );

    return [...partItems, ...vehicleItems, ...filteredNav, ...filteredActions];
  }, [query, searchResults, navigate, navigationItems, actionItems]);

  const filteredItems = getFilteredItems();

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
            placeholder="Search parts, vehicles, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-800 rounded">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 bg-slate-800 rounded border border-slate-700">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {/* Group by type */}
              {searchResults.parts.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parts</p>
                  {filteredItems.filter(i => i.type === 'part').map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      isSelected={filteredItems.indexOf(item) === selectedIndex}
                      onClick={() => { item.action(); onClose(); }}
                    />
                  ))}
                </div>
              )}

              {searchResults.vehicles.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicles</p>
                  {filteredItems.filter(i => i.type === 'vehicle').map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      isSelected={filteredItems.indexOf(item) === selectedIndex}
                      onClick={() => { item.action(); onClose(); }}
                    />
                  ))}
                </div>
              )}

              {filteredItems.filter(i => i.type === 'page').length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pages</p>
                  {filteredItems.filter(i => i.type === 'page').map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      isSelected={filteredItems.indexOf(item) === selectedIndex}
                      onClick={() => { item.action(); onClose(); }}
                    />
                  ))}
                </div>
              )}

              {filteredItems.filter(i => i.type === 'action').length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</p>
                  {filteredItems.filter(i => i.type === 'action').map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      isSelected={filteredItems.indexOf(item) === selectedIndex}
                      onClick={() => { item.action(); onClose(); }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↵</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />K to open
          </span>
        </div>
      </div>
    </div>
  );
}

// Individual command item
function CommandItem({ 
  item, 
  isSelected, 
  onClick 
}: { 
  item: CommandItem; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const Icon = item.icon;
  
  return (
    <button
      data-selected={isSelected}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isSelected 
          ? 'bg-amber-500/10 text-white' 
          : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        isSelected ? 'bg-amber-500/20' : 'bg-slate-800'
      }`}>
        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
        )}
      </div>
      {isSelected && (
        <CornerDownLeft className="w-4 h-4 text-slate-500" />
      )}
    </button>
  );
}

// Hook to manage command bar state
export function useCommandBar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

export default CommandBar;
